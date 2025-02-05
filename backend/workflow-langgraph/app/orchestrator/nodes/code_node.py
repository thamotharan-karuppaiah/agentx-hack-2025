from typing import Dict, Any
import asyncio
from ...schemas import CodeNodeData

class CodeNode:
    def __init__(self, config: Dict[str, Any]):
        self.config = CodeNodeData(**config.get("data", {}))

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the code and return the result"""
        try:
            # Create a local namespace with state variables
            local_ns = state.copy()
            
            # Execute the code in the namespace
            exec_globals = {
                'asyncio': asyncio,
                '__builtins__': __builtins__,
            }
            
            # Execute the code
            exec(self.config.code, exec_globals, local_ns)
            
            # Get the result from the last expression
            result = local_ns.get('result', None)
            
            return {
                self.config.name: {
                    "result": result,
                    "output": local_ns.get('output', None)
                }
            }

        except Exception as e:
            error_msg = f"Error in code execution: {str(e)}"
            if self.config.errorBehavior == "continue":
                return {
                    self.config.name: {
                        "error": error_msg,
                        "result": None
                    }
                }
            raise Exception(error_msg) 