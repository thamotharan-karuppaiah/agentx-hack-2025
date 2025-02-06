from typing import Dict, Any
import aiohttp
import json
from ...schemas import APINodeData
from ...models import WorkflowState

class APINode:
    def __init__(self, config: Dict[str, Any]):
        self.node_id = config.get("name", config.get("id", "api"))
        self.node_name = config.get("data", {}).get("name") or config.get("name") or config.get("id")
        self.config = APINodeData(**config.get("data", {}))

    def _replace_placeholders(self, text: str, node_outputs: Dict[str, Any], node_inputs: Dict[str, Any]) -> str:
        """Replace placeholders in text with values from node outputs and inputs"""
        result = text
        
        # Replace placeholders from node outputs
        for node_id, outputs in node_outputs.items():
            for key, value in outputs.items():
                placeholder = f"{{{node_id}.{key}}}"
                if isinstance(value, str):
                    result = result.replace(placeholder, value)
        
        # Replace placeholders from node inputs
        for key, value in node_inputs.items():
            if isinstance(value, str):
                result = result.replace(f"{{{key}}}", value)
        
        return result

    async def process(self, state: WorkflowState) -> WorkflowState:
        """Process the API request and return the response"""
        try:
            # Get node inputs and outputs from state
            node_inputs = state.node_inputs
            node_outputs = state.node_outputs

            # Parse headers if provided
            headers = {}
            if self.config.headers:
                try:
                    # Try to parse as JSON first
                    headers_dict = json.loads(self.config.headers)
                    headers = {
                        k.strip('"'): v.strip('"') 
                        for k, v in headers_dict.items()
                    }
                except json.JSONDecodeError:
                    # Fallback to line-by-line parsing
                    for line in self.config.headers.split('\n'):
                        if ':' in line:
                            key, value = line.split(':', 1)
                            key = key.strip().strip('"')
                            value = value.strip().strip('"').strip(',')
                            value = self._replace_placeholders(value, node_outputs, node_inputs)
                            headers[key] = value

            # Add Content-Type if not present
            if 'Content-Type' not in headers and 'content-type' not in headers:
                headers['Content-Type'] = 'application/json'

            # Replace placeholders in URL
            url = self._replace_placeholders(self.config.url, node_outputs, node_inputs)

            # Replace placeholders in body
            body = None
            if self.config.body:
                try:
                    replaced_body = self._replace_placeholders(self.config.body, node_outputs, node_inputs)
                    body = json.loads(replaced_body)
                except json.JSONDecodeError:
                    raise ValueError("Invalid JSON format in body")

            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method=self.config.method.upper(),
                    url=url,
                    headers=headers,
                    json=body if body is not None else None
                ) as response:
                    response_data = await response.json()
                    
                    # Update state with results
                    if not state.node_outputs.get(self.node_name):
                        state.node_outputs[self.node_name] = {}
                    
                    state.node_outputs[self.node_name].update({
                        "status": response.status,
                        "output": response_data,
                        "url": url,
                        "method": self.config.method.upper()
                    })
                    return state

        except Exception as e:
            error_msg = f"Error in API call: {str(e)}"
            if not state.node_outputs.get(self.node_name):
                state.node_outputs[self.node_name] = {}
                
            state.node_outputs[self.node_name].update({
                "error": error_msg,
                "data": None,
                "status": None,
                "url": url if 'url' in locals() else self.config.url,
                "method": self.config.method.upper()
            })
            
            if self.config.errorBehavior == "continue":
                state.error = error_msg
                return state
            raise Exception(error_msg) 