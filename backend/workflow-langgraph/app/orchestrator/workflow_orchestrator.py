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
    node_inputs: Dict[str, Any] = {}  # Store inputs for each node
    node_outputs: Dict[str, Any] = {}  # Store outputs for each node
    step1_input: dict = {}

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
        node_id = node_config.get("id")
        
        async def node_wrapper(state):
            try:
                # Get node-specific inputs from state
                node_inputs = state.get("node_inputs", {}).get(node_id, {})
                # Initialize node outputs if not present
                if "node_outputs" not in state:
                    state["node_outputs"] = {}
                
                if node_type == "start":
                    input_data = {}
                    for group in node_data.get("groups", []):
                        for field in group.get("fields", []):
                            input_data[field["variableName"]] = state.get(field["variableName"], "")
                    state["node_outputs"][node_id] = input_data
                    return {"input": input_data, "node_output": input_data, "node_outputs": state["node_outputs"]}

                elif node_type == "end":
                    state["node_outputs"][node_id] = state
                    return {"output": state, "node_output": state, "node_outputs": state["node_outputs"]}

                elif node_type == "llm":
                    llm_node = LLMNode(node_config, settings.OPENAI_API_KEY)
                    result = await llm_node.process({**state, "inputs": node_inputs})
                    state["node_outputs"][node_id] = result
                    return {"node_output": result, "node_outputs": state["node_outputs"]}

                elif node_type == "api":
                    api_node = APINode(node_config)
                    result = await api_node.process({**state, "inputs": node_inputs})
                    state["node_outputs"][node_id] = result
                    return {"node_output": result, "node_outputs": state["node_outputs"]}

                elif node_type == "code":
                    code_node = CodeNode(node_config)
                    result = await code_node.process({**state, "inputs": node_inputs})
                    state["node_outputs"][node_id] = result
                    return {"node_output": result, "node_outputs": state["node_outputs"]}

                elif node_type == "human":
                    human_node = HumanNode(node_config)
                    self.nodes["human"] = human_node
                    result = await human_node.process({**state, "inputs": node_inputs})
                    state["node_outputs"][node_id] = result
                    return {"node_output": result, "node_outputs": state["node_outputs"]}

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

        print(graph)

        # try:
        #     # Get the graph visualization
        #     graph_viz = graph.get_graph()
        #     # Convert to Mermaid format with proper configuration
        #     mermaid_graph = graph_viz.to_mermaid(
        #         direction="LR",  # Left to right layout
        #         theme="default",
        #         width=800,
        #         height=600
        #     )
        #     display(Image(mermaid_graph))
        # except Exception as e:
        #     print(f"Note: Could not generate workflow visualization: {str(e)}")
        #     print("Mermaid graph definition:")
        #     print(mermaid_graph)  # Print the Mermaid definition for debugging

        print("\nWorkflow Graph Structure:")
        print("------------------------")
        print("Nodes:", [node for node in workflow_config["nodes"]])
        print("Edges:", [edge for edge in workflow_config["edges"]])
        
        # Process initial inputs for nodes if provided
        node_inputs = {}
        if initial_inputs:
            for node_id, inputs in initial_inputs.items():
                node_inputs[node_id] = inputs
        
        # Create initial state using the WorkflowState model
        initial_state = WorkflowState(
            workflow_id=str(workflow_id),
            current_node=None,
            output={},
            error=None,
            execution_log=[],
            node_inputs=node_inputs,
            node_outputs={},  # Initialize empty node outputs
            **(initial_inputs if initial_inputs else {})
        ).model_dump()
        
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