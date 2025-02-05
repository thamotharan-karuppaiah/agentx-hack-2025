from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
# from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage
from psycopg import Connection
from ..config import settings
from .nodes.llm_node import LLMNode, MessageConfig, MessageType
import asyncio
from langgraph.checkpoint.postgres import PostgresSaver


class WorkflowOrchestrator:
    def __init__(self):
        # Connection configuration
        self.connection_kwargs = {
            "autocommit": True,
            "prepare_threshold": 0,
        }
        
        # Create database connection and checkpointer
        self.conn = Connection.connect(
            settings.DATABASE_URL,
            **self.connection_kwargs
        )
        self.checkpoint = PostgresSaver(self.conn)
        
        # Setup checkpoint table if not exists
        self.checkpoint.setup()
        
        self.nodes: Dict[str, Any] = {}

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Ensure connection is closed when done
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()

    def create_node(self, node_config: Dict[str, Any]):
        """Create a node based on its type"""
        node_type = node_config.get("type")
        
        if node_type == "llm":
            llm_node = LLMNode(node_config, settings.OPENAI_API_KEY)
            async def llm_wrapper(state):
                return await llm_node.process(state)
            return llm_wrapper
            
        elif node_type == "input":
            async def input_node(state):
                return {"input": state.get("input", "")}
            return input_node
            
        elif node_type == "output":
            async def output_node(state):
                return {"output": state.get("output", "")}
            return output_node
            
        elif node_type == "human":
            async def human_node(state):
                # Store current state for human review
                self.nodes["human"] = {
                    "state": state,
                    "completed": False
                }
                # Wait for human input
                while not self.nodes["human"].get("completed", False):
                    await asyncio.sleep(1)
                return self.nodes["human"]["state"]
            return human_node
            
        else:
            raise ValueError(f"Unknown node type: {node_type}")

    def build_graph(self, workflow_config: Dict[str, Any]) -> StateGraph:
        """Build a LangGraph workflow from config"""
        # Create graph
        graph = StateGraph()

        # Add nodes
        for node_id, node_config in workflow_config["nodes"].items():
            node = self.create_node(node_config)
            self.nodes[node_id] = {
                "config": node_config,
                "instance": node
            }
            graph.add_node(node_id, node)

        # Add edges
        for edge in workflow_config["edges"]:
            source = edge["source"]
            target = edge["target"]
            
            if target == "end":
                graph.add_edge(source, END)
            else:
                graph.add_edge(source, target)

        # Set entry point
        graph.set_entry_point("input")

        return graph.compile()

    async def start_workflow(self, workflow_id: int, workflow_config: Dict[str, Any]):
        """Start a workflow execution"""
        # Build graph
        graph = self.build_graph(workflow_config)
        
        # Create initial state and config
        initial_state = {
            "workflow_id": workflow_id,
            "input": workflow_config.get("input", ""),
            "output": "",
            "error": None
        }
        
        config = {
            "configurable": {
                "workflow_id": str(workflow_id)
            }
        }
        
        try:
            # Execute graph with checkpointing
            async for state in graph.astream(
                initial_state,
                config=config,
                checkpoint=self.checkpoint
            ):
                # State updates are automatically checkpointed
                if state.get("error"):
                    print(f"Error in workflow {workflow_id}: {state['error']}")
                    break
                
        except Exception as e:
            # Handle any errors during execution
            print(f"Error executing workflow {workflow_id}: {str(e)}")
            raise

    async def add_human_input(self, workflow_id: int, input_text: str):
        """Add human input to a paused workflow"""
        if "human" not in self.nodes:
            raise ValueError("No human node found in workflow")
            
        human_node = self.nodes["human"]
        current_state = human_node["state"]
        
        # Add human input to state
        current_state["input"] = input_text
        human_node["state"] = current_state
        human_node["completed"] = True 