from typing import Dict, Any, Optional
import asyncio
from ...models import WorkflowState

class HumanNode:
    def __init__(self, config: Dict[str, Any]):
        self.node_id = config.get("name", config.get("id", "human"))
        self.node_name = self.node_id
        self.config = config.get("data", {})
        self.state: Optional[WorkflowState] = None
        self.completed = False

    def _format_prompt(self, prompt: str, node_outputs: Dict[str, Any], node_inputs: Dict[str, Any]) -> str:
        """Format prompt with variables from state"""
        formatted = prompt
        # Replace output variables
        for node_name, outputs in node_outputs.items():
            if isinstance(outputs, dict):
                for key, value in outputs.items():
                    formatted = formatted.replace(
                        f"${{{node_name}.{key}}}", str(value)
                    )
        # Replace input variables
        for key, value in node_inputs.items():
            formatted = formatted.replace(f"${{{key}}}", str(value))
        return formatted

    async def process(self, state: WorkflowState) -> WorkflowState:
        """Process human interaction node"""
        try:
            # Store current state
            self.state = state
            self.completed = False
            
            # If there's a prompt, add it to the state
            prompt = None
            if self.config.get("prompt"):
                prompt = self._format_prompt(
                    self.config["prompt"],
                    state.node_outputs,
                    state.node_inputs
                )
                state.node_outputs[self.node_name] = {"prompt": prompt}
            
            # Wait for human input
            while not self.completed:
                await asyncio.sleep(1)
            
            # Update state with human input and output
            if not state.node_outputs.get(self.node_name):
                state.node_outputs[self.node_name] = {}
            
            state.node_outputs[self.node_name].update({
                "input": self.state.node_inputs.get(self.node_name, {}).get("input"),
                "output": self.state.node_outputs.get(self.node_name, {}).get("output"),
                "prompt": prompt
            })
            
            return state
            
        except Exception as e:
            error_msg = f"Error in human node: {str(e)}"
            if self.config.get("errorBehavior") == "continue":
                if not state.node_outputs.get(self.node_name):
                    state.node_outputs[self.node_name] = {}
                state.node_outputs[self.node_name].update({
                    "error": error_msg,
                    "input": None,
                    "output": None,
                    "prompt": self.config.get("prompt")
                })
                state.error = error_msg
                return state
            raise Exception(error_msg)
    
    def add_human_input(self, input_text: str, output: Any = None):
        """Add human input to continue the workflow"""
        if self.state is not None:
            if not self.state.node_inputs.get(self.node_name):
                self.state.node_inputs[self.node_name] = {}
            if not self.state.node_outputs.get(self.node_name):
                self.state.node_outputs[self.node_name] = {}
                
            self.state.node_inputs[self.node_name]["input"] = input_text
            if output is not None:
                self.state.node_outputs[self.node_name]["output"] = output
            self.completed = True 