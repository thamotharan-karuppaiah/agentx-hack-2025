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
    message_history: Dict[str, List[Dict[str, Any]]] = {}  # Store message history for each node

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
            "message_history": self.message_history
        }

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
        self.graph = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()

    def create_node(self, node_config: Dict[str, Any]):
        """Create a node based on its type"""
        node_type = node_config.get("type")
        node_name = node_config.get("name")  # Prioritize name over id
        node_id = node_config.get("id")
        
        # Ensure we have a name for the node, fallback to id if name not provided
        node_config["name"] = node_name or node_id
        
        if node_type == "start":
            return self._create_start_node(node_config)
        elif node_type == "end":
            return self._create_end_node(node_config)
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

    def _create_start_node(self, node_config: Dict[str, Any]):
        """Create a start node"""
        node_data = node_config.get("data", {})
        node_id = node_config.get("name", "start")

        class StartNode:
            def __init__(self, node_id: str, node_data: Dict[str, Any]):
                self.node_id = node_id
                self.node_name = node_id  # Using node_id as name since it's already using the name
                self.node_data = node_data

            async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
                input_data = {}
                
                # First try to get values from node_inputs
                if state.get("node_inputs"):
                    input_data.update(state["node_inputs"])
                
                # If we still don't have values, try to get them from the state directly
                if not any(input_data.values()):
                    for group in self.node_data.get("groups", []):
                        for field in group.get("fields", []):
                            var_name = field["variableName"]
                            if var_name in state:
                                input_data[var_name] = state[var_name]
                
                # Update the state's node_inputs with our input data
                if "node_inputs" not in state:
                    state["node_inputs"] = {}
                state["node_inputs"].update(input_data)
                
                return {
                    f"{self.node_name}.input": input_data,
                    f"{self.node_name}.output": input_data,
                    "node_output": input_data  # Add this to make sure output is captured
                }

        return StartNode(node_id, node_data)

    def _create_end_node(self, node_config: Dict[str, Any]):
        """Create an end node"""
        node_id = node_config.get("name", "end")

        class EndNode:
            def __init__(self, node_id: str):
                self.node_id = node_id
                self.node_name = node_id  # Using node_id as name since it's already using the name

            async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
                # Get all inputs and outputs
                node_outputs = state.get("node_outputs", {})
                node_inputs = state.get("node_inputs", {})
                
                # Start with all inputs
                final_output = {}
                final_output.update(node_inputs)
                
                # Add outputs from all previous nodes
                for node_name, output in node_outputs.items():
                    if node_name.lower() != "end":
                        if isinstance(output, dict):
                            # Handle different output formats
                            if f"{node_name}.output" in output:
                                final_output.update(output[f"{node_name}.output"])
                            elif "node_output" in output:
                                final_output.update(output["node_output"])
                            else:
                                final_output.update(output)
                
                return {
                    f"{self.node_name}.output": final_output,
                    "final_state": final_output
                }

        return EndNode(node_id)

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
            node_instance = self.create_node(node_config)
            
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

        self.graph = graph.compile()
        return self.graph

    async def initialize_workflow_state(self, workflow_id: int, initial_inputs: Dict[str, Any] = None) -> WorkflowState:
        """Initialize the workflow state with the given inputs"""
        # Create initial state using the WorkflowState model
        initial_state = WorkflowState(
            workflow_id=str(workflow_id),
            current_node=None,
            output=initial_inputs if initial_inputs else {},
            error=None,
            execution_log=[],
            node_inputs=initial_inputs if initial_inputs else {},
            node_outputs={},
            message_history={},
        )
        
        return initial_state

    async def execute_workflow(self, workflow_id: int, workflow_config: Dict[str, Any], initial_inputs: Dict[str, Any] = None):
        """Execute a workflow with optional initial inputs"""
        try:
            # Step 1: Create the workflow graph if not already created
            if not self.graph:
                self.graph = await self.create_workflow_graph(workflow_config)

            print("\nCompiled Graph Structure:")
            print("------------------------")
            for node_name, node_spec in self.graph.nodes.items():
                print(f"Node: {node_name}")
                print(f"  Type: {type(node_spec).__name__}")
                print("------------------------")

            # Print the edges
            print("Edges:")
            for source, target in self.graph.builder._all_edges:
                print(f"  {source} -> {target}")
            print("------------------------")

            try:
                # Get the graph visualization
                display(Image(self.graph.get_graph(xray=1).draw_mermaid_png()))
            except Exception as e:
                print(f"Note: Could not generate workflow visualization: {str(e)}")

            print("\nWorkflow Graph Structure:")
            print("------------------------")
            print("Nodes:", [node for node in workflow_config["nodes"]])
            print("Edges:", [edge for edge in workflow_config["edges"]])
            
            # Step 2: Initialize the workflow state
            initial_state = await self.initialize_workflow_state(workflow_id, initial_inputs)
            
            print("\nInitial State:")
            print(initial_state)
            
            config = {
                "configurable": {
                    "workflow_id": str(workflow_id)
                }
            }
            
            # Step 3: Execute the workflow
            execution_states = []
            result = await self.graph.ainvoke(initial_state, config=config)


            print("\nResult:")
            print(result)
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