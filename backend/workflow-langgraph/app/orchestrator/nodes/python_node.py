import re
import json
from typing import Dict, Any
from langchain_experimental.tools import PythonREPLTool
from contextlib import redirect_stdout
import io
import asyncio
from ...models import WorkflowState

class PythonNode:
    """Node for executing Python code with placeholder replacement"""
    
    def __init__(self, config: Dict[str, Any]):
        self.node_id = config.get("name", config.get("id", "python"))
        self.node_name = self.node_id
        self.config = config.get("data", {})
        self.repl = PythonREPLTool()
        
    def _replace_placeholders(self, code: str, state: WorkflowState) -> str:
        """Replace placeholders in code with values from state"""
        result = code
        
        # Replace node outputs
        for node_name, outputs in state.node_outputs.items():
            if isinstance(outputs, dict):
                for key, value in outputs.items():
                    placeholder = f"${{{node_name}.{key}}}"
                    result = result.replace(placeholder, str(value))
        
        # Replace node inputs
        for node_name, inputs in state.node_inputs.items():
            if isinstance(inputs, dict):
                for key, value in inputs.items():
                    placeholder = f"${{{node_name}.{key}}}"
                    result = result.replace(placeholder, str(value))
        
        return result

    def _execute_code(self, code: str) -> Dict[str, Any]:
        """Execute code and capture result"""
        # Dedent the code and ensure proper newlines
        lines = [line.strip() for line in code.splitlines() if line.strip()]
        code = "\n".join(lines)
        
        # Add code to capture the result variable
        wrapped_code = f"""
result = None
{code}
"""
        # Execute the wrapped code
        namespace = {"__builtins__": __builtins__}
        try:
            exec(wrapped_code, namespace)
            result = namespace.get('result')
            if result is None:
                return {"error": "No result value was set"}
            return {"output": result}
        except Exception as e:
            return {"error": str(e)}

    async def process(self, state: WorkflowState) -> WorkflowState:
        """Execute Python code with state data"""
        try:
            # Get code from state inputs
            code = state.node_inputs.get(self.node_name, {}).get("python_input", "")
            if not code:
                raise ValueError("No Python code provided in state.node_inputs")
                
            # Replace placeholders and execute code
            code_to_execute = self._replace_placeholders(code, state)
            execution_result = self._execute_code(code_to_execute)
            
            # Initialize node outputs if needed
            if not state.node_outputs.get(self.node_name):
                state.node_outputs[self.node_name] = {}
            
            if "error" in execution_result:
                state.node_outputs[self.node_name].update({
                    "error": execution_result["error"],
                    "status": "error",
                    "code_executed": code_to_execute
                })
                state.error = execution_result["error"]
                return state
            
            result = execution_result["output"]
            
            # Update state with execution result
            if isinstance(result, dict):
                state.node_outputs[self.node_name].update(result)
            else:
                state.node_outputs[self.node_name]["output"] = result
            
            state.node_outputs[self.node_name].update({
                "status": "success",
                "code_executed": code_to_execute
            })
            
            return state
            
        except Exception as e:
            error_msg = str(e)
            if not state.node_outputs.get(self.node_name):
                state.node_outputs[self.node_name] = {}
            
            state.node_outputs[self.node_name].update({
                "error": error_msg,
                "status": "error",
                "code_executed": code if 'code' in locals() else ""
            })
            state.error = error_msg
            return state 