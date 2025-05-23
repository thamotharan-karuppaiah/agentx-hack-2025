from typing import Dict, Any, Optional, List
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage
from psycopg import Connection
from ..config import settings
from .nodes.llm_node import LLMNode
from .nodes.api_node import APINode
from .nodes.code_node import CodeNode
from .nodes.human_node import HumanNode
import asyncio
from IPython.display import Image, display
from pydantic import BaseModel
from ..models import WorkflowExecutionStream, WorkflowState
from sqlalchemy.orm import Session
from datetime import datetime
import json

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif hasattr(obj, 'content') and hasattr(obj, 'type'):  # Handle Message objects
            return {
                "type": getattr(obj, "type", "unknown"),
                "content": getattr(obj, "content", str(obj)),
                "_type": obj.__class__.__name__
            }
        return super().default(obj)

class WorkflowOrchestrator:
    def __init__(self, db: Optional[Session] = None):
        # Connection configuration for checkpointing
        self.connection_kwargs = {
            "autocommit": True,
            "prepare_threshold": 0,
        }
        
        self.conn = Connection.connect(
            settings.DATABASE_URL,
            **self.connection_kwargs
        )
        self.checkpoint = PostgresSaver(self.conn)
        self.checkpoint.setup()
        self.nodes: Dict[str, Any] = {}
        self.graph = None
        self.db = db

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up resources when exiting the context manager"""
        try:
            # Clean up nodes
            for node_name, node in self.nodes.items():
                if hasattr(node, 'cleanup') and callable(node.cleanup):
                    try:
                        if asyncio.iscoroutinefunction(node.cleanup):
                            await node.cleanup()
                        else:
                            node.cleanup()
                    except Exception as e:
                        print(f"Error cleaning up node {node_name}: {str(e)}")
            
            # Close database connection
            if hasattr(self, 'conn') and self.conn:
                try:
                    self.conn.close()
                except Exception as e:
                    print(f"Error closing database connection: {str(e)}")
            
            # Clean up graph
            if hasattr(self, 'graph') and self.graph:
                try:
                    if hasattr(self.graph, 'cleanup') and callable(self.graph.cleanup):
                        if asyncio.iscoroutinefunction(self.graph.cleanup):
                            await self.graph.cleanup()
                        else:
                            self.graph.cleanup()
                except Exception as e:
                    print(f"Error cleaning up graph: {str(e)}")
            
        except Exception as e:
            print(f"Error during cleanup: {str(e)}")
            # Re-raise if this was not handling an existing exception
            if exc_type is None:
                raise

    def _serialize_message(self, msg):
        """Helper function to serialize message objects"""
        if hasattr(msg, 'content') and hasattr(msg, 'type'):
            return {
                "type": getattr(msg, "type", "unknown"),
                "content": getattr(msg, "content", str(msg)),
                "_type": msg.__class__.__name__
            }
        return str(msg)

    def _serialize_data(self, data: Any) -> Any:
        """Serialize data to handle datetime objects and messages"""
        if isinstance(data, (list, tuple)):
            return [self._serialize_data(item) for item in data]
        elif isinstance(data, dict):
            return {key: self._serialize_data(value) for key, value in data.items()}
        elif hasattr(data, 'content') and hasattr(data, 'type'):  # Handle Message objects
            return self._serialize_message(data)
        elif isinstance(data, datetime):
            return data.isoformat()
        elif hasattr(data, '__dict__'):  # Handle other objects
            try:
                return self._serialize_data(data.__dict__)
            except:
                return str(data)
        return data

    async def _save_stream(self, execution_id: int, node_name: str, stream_type: str, content: Dict[str, Any]):
        """Save streaming data to database"""
        if self.db:
            try:
                # Serialize the content before saving
                serialized_content = self._serialize_data(content)
                
                stream = WorkflowExecutionStream(
                    execution_id=execution_id,
                    node_name=node_name,
                    stream_type=stream_type,
                    content=serialized_content,
                    timestamp=datetime.utcnow()
                )
                self.db.add(stream)
                self.db.commit()
                print(f"Saved stream for execution {execution_id}, node {node_name}, type {stream_type}")
            except Exception as e:
                print(f"Error saving stream: {str(e)}")
                self.db.rollback()
                raise

    async def create_node(self, node_config: Dict[str, Any]):
        """Create a node based on its type"""
        node_type = node_config.get("type")
        node_name = node_config.get("name")  # Prioritize name over id
        node_id = node_config.get("id")
        
        # Ensure we have a name for the node, fallback to id if name not provided
        node_config["name"] = node_name or node_id
        
        if node_type == "start":
            return await self._create_start_node(node_config)
        elif node_type == "end":
            return await self._create_end_node(node_config)
        elif node_type == "llm":
            llm_node = LLMNode(node_config)
            self.nodes[node_config["name"]] = llm_node
            return llm_node
        elif node_type == "api":
            api_node = APINode(node_config)
            self.nodes[node_config["name"]] = api_node
            return api_node
        elif node_type == "code":
            code_node = CodeNode(node_config)
            self.nodes[node_config["name"]] = code_node
            return code_node
        elif node_type == "human":
            human_node = HumanNode(node_config)
            self.nodes[node_config["name"]] = human_node
            return human_node
        else:
            raise ValueError(f"Unknown node type: {node_type}")

    async def _create_start_node(self, node_config: Dict[str, Any]):
        """Create a start node"""
        node_data = node_config.get("data", {})
        node_id = node_config.get("name", "start")

        class StartNode:
            def __init__(self, node_id: str, node_data: Dict[str, Any], orchestrator: 'WorkflowOrchestrator'):
                self.node_id = node_id
                self.node_name = node_id
                self.node_data = node_data
                self.orchestrator = orchestrator

            async def process(self, state: Any) -> WorkflowState:
                # Convert dict to WorkflowState if needed
                if isinstance(state, dict):
                    state = WorkflowState(**state)
                
                input_data = {}
                
                # Initialize node_inputs if it doesn't exist
                if not hasattr(state, 'node_inputs'):
                    state.node_inputs = {}
                
                # First try to get values from node_inputs
                if state.node_inputs:
                    # Handle both dictionary and direct value cases
                    for key, value in state.node_inputs.items():
                        if isinstance(value, dict):
                            input_data.update(value)
                        else:
                            input_data[key] = value
                
                # If we still don't have values, try to get them from the state directly
                if not input_data:
                    for group in self.node_data.get("groups", []):
                        for field in group.get("fields", []):
                            var_name = field["variableName"]
                            if hasattr(state, var_name):
                                input_data[var_name] = getattr(state, var_name)
                
                # Initialize node_outputs if it doesn't exist
                if not hasattr(state, 'node_outputs'):
                    state.node_outputs = {}
                
                # Save stream data
                if state.execution_id:
                    await self.orchestrator._save_stream(
                        state.execution_id,
                        self.node_name,
                        "input",
                        input_data
                    )
                
                # Update state
                state.node_inputs[self.node_name] = input_data
                state.node_outputs[self.node_name] = input_data
                state.current_node = self.node_name
                
                return state

        return StartNode(node_id, node_data, self)

    async def _create_end_node(self, node_config: Dict[str, Any]):
        """Create an end node"""
        node_id = node_config.get("name", "end")

        class EndNode:
            def __init__(self, node_id: str, orchestrator: 'WorkflowOrchestrator'):
                self.node_id = node_id
                self.node_name = node_id
                self.orchestrator = orchestrator

            async def process(self, state: WorkflowState) -> WorkflowState:
                # Get all inputs and outputs
                final_output = {}
                
                print("\n=== Debug: End Node Processing ===")
                print(f"Current node outputs: {state.node_outputs}")
                
                # Add outputs from all previous nodes
                for node_name, output in state.node_outputs.items():
                    print(f"Processing output from node {node_name}: {output}")
                    if output:  # Only add non-empty outputs
                        if isinstance(output, dict):
                            final_output[node_name] = output
                        else:
                            final_output[node_name] = {"output": output}
                
                print(f"Aggregated final output: {final_output}")
                
                # Save stream data
                if state.execution_id:
                    await self.orchestrator._save_stream(
                        state.execution_id,
                        self.node_name,
                        "output",
                        final_output
                    )
                
                # Update state
                state.output = final_output
                state.current_node = self.node_name
                state.node_outputs[self.node_name] = final_output
                
                print(f"Final state output: {state.output}")
                print(f"Final node_outputs: {state.node_outputs}")
                
                return state

        return EndNode(node_id, self)

    async def create_workflow_graph(self, workflow_config: Dict[str, Any]) -> StateGraph:
        """Create a LangGraph workflow from config"""
        try:
            # Validate workflow configuration
            if not isinstance(workflow_config, dict):
                raise ValueError("Workflow configuration must be a dictionary")
            if "nodes" not in workflow_config:
                raise ValueError("Workflow configuration must contain 'nodes'")
            if "edges" not in workflow_config:
                raise ValueError("Workflow configuration must contain 'edges'")
            
            # Initialize StateGraph with WorkflowState schema
            graph = StateGraph(WorkflowState)
            
            # Create a mapping of node IDs to names and track created nodes
            node_mapping = {}
            created_nodes = {}
            
            # First pass: Create all nodes
            for node_config in workflow_config["nodes"]:
                try:
                    if "id" not in node_config:
                        raise ValueError(f"Node configuration missing 'id': {node_config}")
                    if "type" not in node_config:
                        raise ValueError(f"Node configuration missing 'type': {node_config}")
                    
                    node_id = node_config["id"]
                    node_name = node_config.get("name", node_id)
                    node_mapping[node_id] = node_name
                    
                    # Create the node instance
                    node_instance = await self.create_node(node_config)
                    created_nodes[node_name] = node_instance
                    
                    # Create the node function
                    async def create_node_fn(node, node_name):
                        async def node_fn(state):
                            try:
                                print(f"Executing node: {node_name}")
                                # Ensure state is WorkflowState
                                if not isinstance(state, WorkflowState):
                                    state = WorkflowState(**state)
                                
                                # Process the node with its process method
                                result = await node.process(state)
                                
                                # Ensure result is WorkflowState
                                if not isinstance(result, WorkflowState):
                                    if isinstance(result, dict):
                                        # Update the original state with new values
                                        state.node_outputs[node_name] = result
                                        state.current_node = node_name
                                        result = state
                                
                                print(f"Node {node_name} execution completed")
                                return result
                            except Exception as e:
                                print(f"Error in node {node_name}: {str(e)}")
                                if isinstance(state, WorkflowState):
                                    state.error = f"Error in node {node_name}: {str(e)}"
                                    return state
                                raise
                        return node_fn
                    
                    # Add node to graph
                    node_fn = await create_node_fn(node_instance, node_name)
                    graph.add_node(node_name, node_fn)
                    print(f"Added node to graph: {node_name}")
                except Exception as e:
                    raise ValueError(f"Error creating node {node_config.get('id', 'unknown')}: {str(e)}")
            
            # Find and connect the start node
            start_nodes = [
                node_config.get("name", node_config["id"])
                for node_config in workflow_config["nodes"]
                if node_config["type"].lower() == "start"
            ]
            
            if not start_nodes:
                raise ValueError("No start node found in workflow configuration")
            if len(start_nodes) > 1:
                raise ValueError(f"Multiple start nodes found: {start_nodes}")
            
            start_node = start_nodes[0]
            
            # Connect START to the first node
            graph.add_edge(START, start_node)
            print(f"Connected START to {start_node}")
            
            # Second pass: Add edges
            end_node_connections = []  # Track connections to END
            for edge in workflow_config["edges"]:
                try:
                    if "source" not in edge or "target" not in edge:
                        raise ValueError(f"Edge missing source or target: {edge}")
                    
                    source_id = edge["source"]
                    target_id = edge["target"]
                    
                    source_name = node_mapping.get(source_id)
                    target_name = node_mapping.get(target_id)
                    
                    if not source_name:
                        raise ValueError(f"Source node not found: {source_id}")
                    if not target_name:
                        raise ValueError(f"Target node not found: {target_id}")
                    
                    # Handle end node specially
                    if target_name.lower() == "end":
                        graph.add_edge(source_name, END)
                        end_node_connections.append(source_name)
                        print(f"Connected {source_name} to END")
                    else:
                        graph.add_edge(source_name, target_name)
                        print(f"Connected {source_name} to {target_name}")
                except Exception as e:
                    raise ValueError(f"Error adding edge {edge}: {str(e)}")
            
            # Validate the graph has at least one path to END
            if not end_node_connections:
                raise ValueError("Graph must have at least one path to END")
            
            # Check for disconnected nodes (excluding START, END, and end node)
            all_nodes = set(node_mapping.values())
            all_nodes.discard("end")  # Remove end node from consideration
            
            connected_nodes = {edge[0] for edge in graph.edges}
            connected_nodes.update(edge[1] for edge in graph.edges if edge[1] != END)
            connected_nodes.add(start_node)  # Add start node as it's always connected
            
            disconnected_nodes = all_nodes - connected_nodes
            if disconnected_nodes:
                raise ValueError(f"Disconnected nodes found: {disconnected_nodes}")
            
            # Compile and return the graph
            try:
                compiled_graph = graph.compile()
                print("Graph compiled successfully")
                return compiled_graph
            except Exception as e:
                raise ValueError(f"Error compiling graph: {str(e)}")
            
        except Exception as e:
            print(f"Error creating workflow graph: {str(e)}")
            raise

    async def initialize_workflow_state(self, workflow_id: int, execution_id: int, initial_inputs: Dict[str, Any] = None) -> WorkflowState:
        """Initialize workflow state with execution ID"""
        state = WorkflowState(
            workflow_id=str(workflow_id),
            execution_id=execution_id
        )
        if initial_inputs:
            state.node_inputs = initial_inputs
        return state

    async def execute_workflow(self, workflow_id: int, workflow_config: Dict[str, Any], execution_id: int, initial_inputs: Dict[str, Any] = None):
        """Execute a workflow with synchronous execution"""
        try:
            print(f"\n=== Starting workflow execution ===")
            print(f"Workflow ID: {workflow_id}")
            print(f"Execution ID: {execution_id}")
            print(f"Initial inputs: {self._serialize_data(initial_inputs)}")
            
            # Create the workflow graph
            print("\n--- Creating workflow graph ---")
            graph = await self.create_workflow_graph(workflow_config)
            print("Graph created successfully")
            
            # Initialize workflow state
            print("\n--- Initializing workflow state ---")
            initial_state = WorkflowState(
                workflow_id=str(workflow_id),
                execution_id=execution_id,
                node_inputs=initial_inputs or {},
                node_outputs={},
                message_history={},
                output={},
                execution_log=[],
                error=None
            )
            print(f"Initial state: {json.dumps(self._serialize_data(initial_state.model_dump()), cls=CustomJSONEncoder)}")
            
            # Configure graph execution
            config = {
                "recursion_limit": 5,  # Prevent infinite loops
                "checkpoint": self.checkpoint,
                "metadata": {
                    "workflow_id": workflow_id,
                    "execution_id": execution_id
                }
            }
            
            print("\n--- Starting graph execution ---")
            # Execute the graph synchronously
            final_state = await graph.ainvoke(
                initial_state,
                config=config
            )
            
            if not isinstance(final_state, WorkflowState):
                final_state = WorkflowState(**final_state)
            
            # Process the final state
            final_output = {}
            node_executions = {}
            
            # Collect outputs from all nodes
            for node_name, outputs in final_state.node_outputs.items():
                print(f"Processing node {node_name} with outputs: {outputs}")
                # Skip empty outputs
                if outputs:
                    if isinstance(outputs, dict):
                        final_output[node_name] = outputs
                    else:
                        final_output[node_name] = {"output": outputs}
                    print(f"Added to final_output: {final_output[node_name]}")
                
                # Collect node execution details
                node_executions[node_name] = {
                    "node_name": node_name,
                    "inputs": final_state.node_inputs.get(node_name, {}),
                    "outputs": outputs,
                    "execution_log": final_state.execution_log,
                    "message_history": final_state.message_history.get(node_name, [])
                }
            
            # If we have an end node, use its output
            if "end" in final_state.node_outputs:
                end_output = final_state.node_outputs["end"]
                if end_output:
                    final_output = end_output
            
            print(f"\n=== Workflow execution completed ===")
            print(f"Final output: {json.dumps(self._serialize_data(final_output), cls=CustomJSONEncoder)}")
            
            # Return both the final output and execution details
            return {
                "execution_id": execution_id,
                "result": final_output,
                "node_executions": list(node_executions.values())
            }

        except Exception as e:
            print(f"\nError executing workflow: {str(e)}")
            raise

    async def _handle_stream(self, event: Dict[str, Any]):
        """Handle streaming events from the graph"""
        if not isinstance(event, dict):
            return
            
        state = event.get("state")
        if not state or not isinstance(state, WorkflowState):
            return
            
        execution_id = state.execution_id
        if not execution_id:
            return
            
        # Save stream data
        node_name = state.current_node or "unknown"
        stream_type = event.get("type", "output")
        
        # Serialize the state and event data
        serialized_state = self._serialize_data(state.model_dump() if hasattr(state, 'model_dump') else state)
        serialized_event = self._serialize_data(event)
        
        content = {
            "state": serialized_state,
            "event": serialized_event
        }
        
        await self._save_stream(execution_id, node_name, stream_type, content)

    async def add_human_input(self, workflow_id: int, input_text: str, output: Any = None):
        """Add human input to a paused workflow"""
        if "human" not in self.nodes:
            raise ValueError("No human node found in workflow")
            
        human_node = self.nodes["human"]
        if isinstance(human_node, dict):
            human_node = human_node["instance"]
        
        # Add human input and optional output to continue the workflow
        human_node.add_human_input(input_text, output) 