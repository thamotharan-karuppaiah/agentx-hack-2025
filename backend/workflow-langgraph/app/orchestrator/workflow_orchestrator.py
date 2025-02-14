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
        self.db = db
        self.nodes = {}
        self.graph = None
        self._setup_checkpoint()

    def _setup_checkpoint(self):
        """Setup database checkpoint connection"""
        self.conn = Connection.connect(
            settings.DATABASE_URL,
            prepare_threshold=0
        )
        self.checkpoint = PostgresSaver(self.conn)
        self.checkpoint.setup()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Cleanup resources"""
        try:
            await self._cleanup_nodes()
            self._cleanup_connections()
        except Exception as e:
            print(f"Error during cleanup: {str(e)}")
            if exc_type is None:
                raise

    async def _cleanup_nodes(self):
        """Cleanup node resources"""
        for node_name, node in self.nodes.items():
            if hasattr(node, 'cleanup'):
                try:
                    if asyncio.iscoroutinefunction(node.cleanup):
                        await node.cleanup()
                    else:
                        node.cleanup()
                except Exception as e:
                    print(f"Error cleaning up node {node_name}: {str(e)}")

    def _cleanup_connections(self):
        """Cleanup database connections"""
        if self.conn:
            try:
                self.conn.close()
            except Exception as e:
                print(f"Error closing database connection: {str(e)}")

    def _serialize(self, data: Any) -> Any:
        """Unified serialization method"""
        if isinstance(data, (list, tuple)):
            return [self._serialize(item) for item in data]
        elif isinstance(data, dict):
            return {key: self._serialize(value) for key, value in data.items()}
        elif isinstance(data, datetime):
            return data.isoformat()
        elif hasattr(data, 'model_dump'):
            return self._serialize(data.model_dump())
        elif hasattr(data, '__dict__'):
            try:
                return self._serialize(data.__dict__)
            except:
                return str(data)
        return data

    async def _save_stream(self, execution_id: int, node_name: str, stream_type: str, content: Dict[str, Any]):
        """Save stream data to database"""
        if not self.db:
            return

        try:
            stream = WorkflowExecutionStream(
                execution_id=execution_id,
                node_name=node_name,
                stream_type=stream_type,
                content=self._serialize(content),
                timestamp=datetime.utcnow()
            )
            self.db.add(stream)
            self.db.commit()
        except Exception as e:
            print(f"Error saving stream: {str(e)}")
            self.db.rollback()
            raise

    def _create_start_node(self, config: Dict[str, Any]):
        """Create a start node that passes through initial state"""
        class StartNode:
            def __init__(self):
                self.node_name = "start"

            async def process(self, state: WorkflowState) -> WorkflowState:
                # Initialize node_inputs if not exists
                if not state.node_inputs:
                    state.node_inputs = {}
                
                # Copy existing inputs with proper node prefixing
                prefixed_inputs = {}
                for key, value in state.node_inputs.items():
                    if not key.startswith(f"{self.node_name}."):
                        prefixed_key = f"{self.node_name}.{key}"
                        prefixed_inputs[prefixed_key] = value
                
                # Update state with prefixed inputs
                state.node_inputs.update(prefixed_inputs)
                
                # Also store the outputs for potential reference by other nodes
                state.node_outputs[self.node_name] = {
                    key.split('.')[-1]: value 
                    for key, value in prefixed_inputs.items()
                }
                
                return state
        return StartNode()

    def _create_end_node(self, config: Dict[str, Any]):
        """Create an end node that finalizes the workflow state"""
        class EndNode:
            def __init__(self):
                self.node_name = "end"

            async def process(self, state: WorkflowState) -> WorkflowState:
                # Get the outputs from the previous node
                previous_node_output = state.node_outputs.get(state.current_node, {})
                
                # Store only the essential data in end node output
                state.node_outputs[self.node_name] = {
                    "output": previous_node_output.get("output"),
                    # Exclude message_history from end node output
                }
                
                # Clean up the top-level message_history
                if hasattr(state, 'message_history'):
                    delattr(state, 'message_history')
                
                return state
        return EndNode()

    async def create_node(self, node_config: Dict[str, Any]):
        """Factory method for node creation"""
        node_type = node_config.get("type")
        node_name = node_config.get("name") or node_config.get("id")
        
        if not node_type or not node_name:
            raise ValueError("Node configuration must include type and name/id")

        node_types = {
            "start": self._create_start_node,
            "end": self._create_end_node,
            "llm": lambda config: LLMNode(config),
            "api": lambda config: APINode(config),
            "code": lambda config: CodeNode(config),
            "human": lambda config: HumanNode(config)
        }

        if node_type not in node_types:
            raise ValueError(f"Unknown node type: {node_type}")

        node = await node_types[node_type](node_config) if asyncio.iscoroutinefunction(node_types[node_type]) else node_types[node_type](node_config)
        self.nodes[node_name] = node
        return node

    async def create_workflow_graph(self, workflow_config: Dict[str, Any]) -> StateGraph:
        """Create workflow graph from config"""
        if not isinstance(workflow_config, dict) or "nodes" not in workflow_config or "edges" not in workflow_config:
            raise ValueError("Invalid workflow configuration")

        graph = StateGraph(WorkflowState)
        node_mapping = {}

        # Create nodes
        for node_config in workflow_config["nodes"]:
            node_name = node_config.get("name") or node_config["id"]
            node_mapping[node_config["id"]] = node_name
            
            node = await self.create_node(node_config)
            graph.add_node(node_name, self._create_node_function(node, node_name))

        # Connect nodes
        start_node = next((n.get("name", n["id"]) for n in workflow_config["nodes"] if n["type"].lower() == "start"), None)
        if not start_node:
            raise ValueError("No start node found")

        graph.add_edge(START, start_node)
        
        for edge in workflow_config["edges"]:
            source = node_mapping[edge["source"]]
            target = node_mapping[edge["target"]]
            
            if target.lower() == "end":
                graph.add_edge(source, END)
            else:
                graph.add_edge(source, target)

        return graph.compile()

    def _create_node_function(self, node, node_name):
        """Create node execution function"""
        async def node_fn(state):
            try:
                if not isinstance(state, WorkflowState):
                    state = WorkflowState(**state)
                
                result = await node.process(state)
                
                if not isinstance(result, WorkflowState):
                    if isinstance(result, dict):
                        state.node_outputs[node_name] = result
                        state.current_node = node_name
                        result = state
                
                return result
            except Exception as e:
                print(f"Error in node {node_name}: {str(e)}")
                if isinstance(state, WorkflowState):
                    state.error = f"Error in node {node_name}: {str(e)}"
                    return state
                raise
        return node_fn

    async def execute_workflow(self, workflow_id: int, workflow_config: Dict[str, Any], execution_id: int, initial_inputs: Dict[str, Any] = None):
        """Execute workflow"""
        try:
            graph = await self.create_workflow_graph(workflow_config)
            
            initial_state = WorkflowState(
                workflow_id=str(workflow_id),
                execution_id=execution_id,
                node_inputs=initial_inputs or {},
                node_outputs={},
                output={},
                execution_log=[],
                error=None
            )

            config = {"configurable": {"thread_id": "2"}}

            final_state = await graph.ainvoke(initial_state, config=config)
            if not isinstance(final_state, WorkflowState):
                final_state = WorkflowState(**final_state)

            return self._process_final_state(final_state, execution_id)

        except Exception as e:
            print(f"Error executing workflow: {str(e)}")
            raise

    def _process_final_state(self, final_state: WorkflowState, execution_id: int):
        """Process workflow final state"""
        node_executions = {}
        final_output = {}

        for node_name, outputs in final_state.node_outputs.items():
            if outputs:
                final_output[node_name] = outputs if isinstance(outputs, dict) else {"output": outputs}
                
                node_executions[node_name] = {
                    "node_name": node_name,
                    "inputs": final_state.node_inputs.get(node_name, {}),
                    "outputs": outputs,
                    "execution_log": final_state.execution_log,
                }

        if "end" in final_state.node_outputs and final_state.node_outputs["end"]:
            final_output = final_state.node_outputs["end"]

        return {
            "execution_id": execution_id,
            "result": final_output,
            "node_executions": list(node_executions.values())
        }

    async def add_human_input(self, workflow_id: int, input_text: str, output: Any = None):
        """Add human input to workflow"""
        if "human" not in self.nodes:
            raise ValueError("No human node found in workflow")
        
        human_node = self.nodes["human"]
        if isinstance(human_node, dict):
            human_node = human_node["instance"]
        
        human_node.add_human_input(input_text, output) 