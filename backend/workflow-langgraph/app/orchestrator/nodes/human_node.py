from typing import Dict, Any
import asyncio
from ...schemas import HumanNodeData

class HumanNode:
    def __init__(self, config: Dict[str, Any]):
        self.node_id = config.get("id", "human")
        self.config = HumanNodeData(**config.get("data", {}))
        self.state = None
        self.completed = False

    def _format_prompt(self, prompt: str, node_outputs: Dict[str, Any], node_inputs: Dict[str, Any]) -> str:
        """Format the prompt with node outputs and inputs"""
        try:
            # Create a dictionary of available variables
            variables = {}
            for node_id, outputs in node_outputs.items():
                for key, value in outputs.items():
                    variables[f"{node_id}.{key}"] = value
            
            # Add node inputs to variables
            variables.update(node_inputs)
            
            return prompt.format(**variables)
        except:
            return prompt

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process human interaction node"""
        try:
            # Get node inputs and outputs from state
            node_inputs = state.get("inputs", {})
            node_outputs = state.get("node_outputs", {})
            
            # Store current state
            self.state = {
                **state,
                "node_inputs": node_inputs,
                "node_outputs": node_outputs
            }
            self.completed = False
            
            # If there's a prompt, add it to the state
            prompt = None
            if self.config.prompt:
                prompt = self._format_prompt(
                    self.config.prompt,
                    node_outputs,
                    node_inputs
                )
                self.state["prompt"] = prompt
            
            # Wait for human input
            while not self.completed:
                await asyncio.sleep(1)
            
            # Return state with human input and node-specific keys
            return {
                f"{self.node_id}.input": self.state.get("human_input"),
                f"{self.node_id}.output": self.state.get("output"),
                f"{self.node_id}.prompt": prompt
            }
            
        except Exception as e:
            error_msg = f"Error in human node: {str(e)}"
            if self.config.errorBehavior == "continue":
                return {
                    f"{self.node_id}.error": error_msg,
                    f"{self.node_id}.input": None,
                    f"{self.node_id}.output": None,
                    f"{self.node_id}.prompt": self.config.prompt if hasattr(self, 'config') else None
                }
            raise Exception(error_msg)
    
    def add_human_input(self, input_text: str, output: Any = None):
        """Add human input to continue the workflow"""
        if self.state is not None:
            self.state["human_input"] = input_text
            if output is not None:
                self.state["output"] = output
            self.completed = True 