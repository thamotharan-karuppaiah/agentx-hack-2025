from typing import Dict, Any
import asyncio
from ...schemas import CodeNodeData

class CodeNode:
    def __init__(self, config: Dict[str, Any]):
        self.node_id = config.get("id", "code")
        self.config = CodeNodeData(**config.get("data", {}))

    def _prepare_variables(self, node_outputs: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare variables from node outputs with proper prefixes"""
        variables = {}
        for node_id, outputs in node_outputs.items():
            for key, value in outputs.items():
                variables[f"{node_id}.{key}"] = value
        return variables

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the code and return the result"""
        try:
            # Get node inputs and outputs from state
            node_inputs = state.get("inputs", {})
            node_outputs = state.get("node_outputs", {})
            
            # Create a local namespace with state variables
            local_ns = {
                **state,
                "node_inputs": node_inputs,
                "node_outputs": self._prepare_variables(node_outputs)
            }
            
            # Execute the code in the namespace
            exec_globals = {
                'asyncio': asyncio,
                '__builtins__': __builtins__,
            }
            
            # Execute the code
            exec(self.config.code, exec_globals, local_ns)
            
            # Get the result from the last expression
            result = local_ns.get('result', None)
            
            # Prepare output with node-specific keys
            return {
                f"{self.node_id}.result": result,
                f"{self.node_id}.output": local_ns.get('output', None),
                f"{self.node_id}.variables": {
                    k: v for k, v in local_ns.items() 
                    if k not in ['__builtins__', 'asyncio', 'node_inputs', 'node_outputs'] 
                    and not k.startswith('_')
                }
            }

        except Exception as e:
            error_msg = f"Error in code execution: {str(e)}"
            if self.config.errorBehavior == "continue":
                return {
                    f"{self.node_id}.error": error_msg,
                    f"{self.node_id}.result": None,
                    f"{self.node_id}.output": None,
                    f"{self.node_id}.variables": {}
                }
            raise Exception(error_msg) 