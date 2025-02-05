import re
import json
from typing import Dict, Any
from langchain_experimental.tools import PythonREPLTool
from contextlib import redirect_stdout
import io

class PythonNode:
    """Node for executing Python code with placeholder replacement"""
    
    def __init__(self, node_config: Dict[str, Any]):
        self.repl = PythonREPLTool()
        
    def _replace_placeholders(self, code: str, state: Dict[str, Any]) -> str:
        """Replace placeholders in code with values from state"""
        # Get data from state
        data = state.get("webrequest_output", {})
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except:
                data = {}

        # Replace {{variable}} placeholders with values from data
        for match in re.finditer(r'\{\{(.*?)\}\}', code):
            placeholder = match.group(1).strip()
            try:
                # Handle nested keys (e.g., data.user.name)
                value = data
                for key in placeholder.split('.'):
                    value = value[key]
                code = code.replace(match.group(0), repr(value))
            except (KeyError, TypeError):
                print(f"Warning: {placeholder} not found in data")
                
        return code

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

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Python code with state data"""
        try:
            # Get code from state
            code = state.get("python_input", "")
            if not code:
                raise ValueError("No Python code provided in state.python_input")
                
            # Replace placeholders and execute code
            code_to_execute = self._replace_placeholders(code, state)
            execution_result = self._execute_code(code_to_execute)
            
            if "error" in execution_result:
                state["python_node_output"] = {"error": execution_result["error"]}
                return {
                    "type": "python",
                    "status": "error",
                    "error": execution_result["error"],
                    "code_executed": code_to_execute,
                    **state
                }
            
            result = execution_result["output"]
            
            # Update state with execution result
            if isinstance(result, dict):
                state["python_node_output"] = result
            else:
                state["python_node_output"] = {"output": result}
            
            return {
                "type": "python",
                "status": "success",
                "result": result,
                "code_executed": code_to_execute,
                **state
            }
            
        except Exception as e:
            state["python_node_output"] = {"error": str(e)}
            return {
                "type": "python",
                "status": "error",
                "error": str(e),
                "code_executed": code if 'code' in locals() else "",
                **state
            } 