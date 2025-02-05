from typing import Dict, Any
import asyncio
from ...schemas import HumanNodeData

class HumanNode:
    def __init__(self, config: Dict[str, Any]):
        self.config = HumanNodeData(**config.get("data", {}))
        self.state = None
        self.completed = False

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process human interaction node"""
        try:
            # Store current state
            self.state = state.copy()
            self.completed = False
            
            # If there's a prompt, add it to the state
            if self.config.prompt:
                self.state["prompt"] = self.config.prompt
            
            # Wait for human input
            while not self.completed:
                await asyncio.sleep(1)
            
            # Return state with human input
            return {
                self.config.name: {
                    "input": self.state.get("human_input"),
                    "output": self.state.get("output")
                }
            }
            
        except Exception as e:
            error_msg = f"Error in human node: {str(e)}"
            if self.config.errorBehavior == "continue":
                return {
                    self.config.name: {
                        "error": error_msg,
                        "input": None,
                        "output": None
                    }
                }
            raise Exception(error_msg)
    
    def add_human_input(self, input_text: str, output: Any = None):
        """Add human input to continue the workflow"""
        if self.state is not None:
            self.state["human_input"] = input_text
            if output is not None:
                self.state["output"] = output
            self.completed = True 