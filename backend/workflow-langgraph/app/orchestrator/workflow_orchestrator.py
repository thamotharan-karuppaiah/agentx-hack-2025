from typing import Dict, Any, Optional, List
from langgraph.graph import StateGraph, END, START
# from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage
from psycopg import Connection
from ..config import settings
from .nodes.llm_node import LLMNode
from .nodes.api_node import APINode
from .nodes.code_node import CodeNode
from .nodes.human_node import HumanNode
import asyncio
from langgraph.checkpoint.postgres import PostgresSaver
from IPython.display import Image, display
from pydantic import BaseModel

class WorkflowState(BaseModel):
    workflow_id: str
    current_node: Optional[str] = None
    output: dict = {}
    error: Optional[str] = None
    execution_log: List = []

class WorkflowOrchestrator:
    def __init__(self):
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

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()

    def create_node(self, node_config: Dict[str, Any]):
        """Create a node based on its type"""
        node_type = node_config.get("type")
        node_data = node_config.get("data", {})
        
        async def node_wrapper(state):
            try:
                if node_type == "start":
                    input_data = {}
                    for group in node_data.get("groups", []):
                        for field in group.get("fields", []):
                            input_data[field["variableName"]] = state.get(field["variableName"], "")
                    return {"input": input_data, "node_output": input_data}

                elif node_type == "end":
                    return {"output": state, "node_output": state}

                elif node_type == "llm":
                    llm_node = LLMNode(node_config, settings.OPENAI_API_KEY)
                    result = await llm_node.process(state)
                    return {"node_output": result}

                elif node_type == "api":
                    api_node = APINode(node_config)
                    result = await api_node.process(state)
                    return {"node_output": result}

                elif node_type == "code":
                    code_node = CodeNode(node_config)
                    result = await code_node.process(state)
                    return {"node_output": result}

                elif node_type == "human":
                    human_node = HumanNode(node_config)
                    self.nodes["human"] = human_node
                    result = await human_node.process(state)
                    return {"node_output": result}

            except Exception as e:
                return {
                    "error": str(e),
                    "node_id": node_config.get("id"),
                    "node_type": node_type
                }

        return node_wrapper

    def build_graph(self, workflow_config: Dict[str, Any]) -> StateGraph:
        """Build a LangGraph workflow from config"""
        # Initialize StateGraph with WorkflowState schema
        graph = StateGraph(WorkflowState)
        
        # Add nodes
        for node in workflow_config["nodes"]:
            node_instance = self.create_node(node)
            self.nodes[node["id"]] = {
                "config": node,
                "instance": node_instance
            }
            graph.add_node(node["id"], node_instance)

        # Add edges with START and END
        # First, connect START to the start node
        start_node = next(node["id"] for node in workflow_config["nodes"] if node["type"] == "start")
        graph.add_edge(START, start_node)

        # Add other edges
        for edge in workflow_config["edges"]:
            source = edge["source"]
            target = edge["target"]
            
            if target == "end":
                graph.add_edge(source, END)
            else:
                graph.add_edge(source, target)

        return graph.compile()

    async def execute_workflow(self, workflow_id: int, workflow_config: Dict[str, Any], initial_inputs: Dict[str, Any] = None):
        """Execute a workflow with optional initial inputs"""
        graph = self.build_graph(workflow_config)

        print("\nWorkflow Graph Structure:")
        print("------------------------")
        print("Nodes:", [node for node in workflow_config["nodes"]])
        print("Edges:", [edge for edge in workflow_config["edges"]])
        
        # Create initial state using the WorkflowState model
        initial_state = WorkflowState(
            workflow_id=str(workflow_id),  # Convert to string as required by schema
            current_node=None,
            output={},
            error=None,
            execution_log=[],
            **initial_inputs if initial_inputs else {}
        ).model_dump()  # Convert to dict for graph execution
        
        config = {
            "configurable": {
                "workflow_id": str(workflow_id)
            }
        }
        
        execution_states = []
        try:
            async for state in graph.astream(initial_state, config=config):
                execution_states.append(state)
                if state.get("error"):
                    break
            
            return execution_states
                
        except Exception as e:
            print(f"Error executing workflow {workflow_id}: {str(e)}")
            raise

    async def add_human_input(self, workflow_id: int, input_text: str, output: Any = None):
        """Add human input to a paused workflow"""
        if "human" not in self.nodes:
            raise ValueError("No human node found in workflow")
            
        human_node = self.nodes["human"]
        if isinstance(human_node, dict):
            human_node = human_node["instance"]
        
        # Add human input and optional output to continue the workflow
        human_node.add_human_input(input_text, output) 