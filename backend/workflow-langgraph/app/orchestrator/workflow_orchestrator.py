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
from ..models import WorkflowExecutionStream
from sqlalchemy.orm import Session
from datetime import datetime
import json

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

class WorkflowState(BaseModel):
    workflow_id: str
    current_node: Optional[str] = None
    output: dict = {}
    error: Optional[str] = None
    execution_log: List = []
    node_inputs: Dict[str, Any] = {}  # Store inputs for each node
    node_outputs: Dict[str, Any] = {}  # Store outputs for each node
    message_history: Dict[str, List[Dict[str, Any]]] = {}  # Store message history for each node
    execution_id: Optional[int] = None  # Add execution_id to track streams

    class Config:
        arbitrary_types_allowed = True

    def model_dump(self) -> dict:
        return {
            "workflow_id": self.workflow_id,
            "current_node": self.current_node,
            "output": self.output,
            "error": self.error,
            "execution_log": self.execution_log,
            "node_inputs": self.node_inputs,
            "node_outputs": self.node_outputs,
            "message_history": self.message_history,
            "execution_id": self.execution_id
        }

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

    def _serialize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Serialize data to handle datetime objects"""
        return json.loads(json.dumps(data, cls=DateTimeEncoder))

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()

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

            async def process(self, state: WorkflowState) -> WorkflowState:
                input_data = {}
                
                # First try to get values from node_inputs
                if state.node_inputs:
                    input_data.update(state.node_inputs)
                
                # If we still don't have values, try to get them from the state directly
                if not any(input_data.values()):
                    for group in self.node_data.get("groups", []):
                        for field in group.get("fields", []):
                            var_name = field["variableName"]
                            if hasattr(state, var_name):
                                input_data[var_name] = getattr(state, var_name)
                
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
                final_output.update(state.node_inputs)
                
                # Add outputs from all previous nodes
                for node_name, output in state.node_outputs.items():
                    if node_name.lower() != "end":
                        final_output[node_name] = output
                
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
                
                return state

        return EndNode(node_id, self)

    async def create_workflow_graph(self, workflow_config: Dict[str, Any]) -> StateGraph:
        """Create a LangGraph workflow from config"""
        # Initialize StateGraph with WorkflowState schema
        graph = StateGraph(WorkflowState)
        
        # Create a mapping of node IDs to names
        node_id_to_name = {
            node_config["id"]: node_config.get("name", node_config["id"])
            for node_config in workflow_config["nodes"]
        }
        
        # Add nodes
        for node_config in workflow_config["nodes"]:
            node_id = node_config["id"]
            node_name = node_config.get("name", node_id)  # Get node name, fallback to id if not present
            node_instance = await self.create_node(node_config)
            
            # Create the node function that will be called by the graph
            async def create_node_fn(node, node_name):
                async def node_fn(state: WorkflowState):
                    try:
                        # Convert WorkflowState to dict for node processing
                        state_dict = state.model_dump()
                        
                        # Process the node with its process method
                        result = await node.process(state_dict)
                        
                        # Update node outputs in state
                        if "node_outputs" not in state_dict:
                            state_dict["node_outputs"] = {}
                        state_dict["node_outputs"][node_name] = result
                        
                        # Update the WorkflowState
                        state.node_outputs = state_dict["node_outputs"]
                        
                        # Store the output in the state's output field
                        if hasattr(node, 'node_name'):
                            if node.node_name.lower() == 'end':
                                # For end node, use the final state as output
                                state.output = result.get('final_state', {})
                            else:
                                # For other nodes, store their actual output
                                node_output = result.get(f"{node.node_name}.output", result.get("node_output", result))
                                if isinstance(node_output, dict):
                                    state.output.update(node_output)
                        
                        return state
                    except Exception as e:
                        # Use node name in error messages
                        state.error = f"Error in {node_name}: {str(e)}"
                        return state
                return node_fn
            
            # Add the node to the graph with its process method using node name
            graph.add_node(node_name, await create_node_fn(node_instance, node_name))
            self.nodes[node_name] = node_instance

        # Find the start node and connect it
        try:
            start_node = next(node_config.get("name", node_config["id"]) 
                            for node_config in workflow_config["nodes"] 
                            if node_config["type"].lower() == "start")
            # Connect the START constant to the first node
            graph.add_edge(START, start_node)
        except StopIteration:
            raise ValueError("Workflow must contain exactly one node of type 'start'")

        # Add remaining edges using node names
        for edge in workflow_config["edges"]:
            source = edge["source"]
            target = edge["target"]
            
            # Convert IDs to names if they exist in our mapping
            source_name = node_id_to_name.get(source, source)
            target_name = node_id_to_name.get(target, target)
            
            # Handle end node
            if target_name.lower() == "end":
                graph.add_edge(source_name, END)
            else:
                graph.add_edge(source_name, target_name)

        # Compile the graph and return it
        return graph.compile()

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
        """Execute a workflow with streaming support"""
        try:
            # Create the workflow graph
            graph = await self.create_workflow_graph(workflow_config)
            
            # Initialize workflow state
            initial_state = await self.initialize_workflow_state(workflow_id, execution_id, initial_inputs)
            
            # Configure graph execution
            config = {
                "recursion_limit": 25,  # Prevent infinite loops
                "checkpoint": self.checkpoint,
                "metadata": {
                    "workflow_id": workflow_id,
                    "execution_id": execution_id
                }
            }
            
            # Stream execution events with version parameter
            stream = graph.astream_events(
                initial_state,
                config=config,
                version="v1"  # Add version parameter
            )
            
            final_output = None
            async for event in stream:
                # Handle streaming event
                await self._handle_stream(event)
                
                # Update final output if this is the last event
                if event.get("type") == "end":
                    final_output = event.get("data", {}).get("output", {})
            
            return final_output

        except Exception as e:
            print(f"Error executing workflow: {str(e)}")
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
        content = {
            "state": state.model_dump(),
            "event": self._serialize_data(event)
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