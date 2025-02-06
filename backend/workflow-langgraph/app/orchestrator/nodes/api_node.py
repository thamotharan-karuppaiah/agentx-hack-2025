from typing import Dict, Any
import aiohttp
import json
from ...schemas import APINodeData

class APINode:
    def __init__(self, config: Dict[str, Any]):
        self.node_id = config.get("name", config.get("id", "api"))
        self.node_name = self.node_id
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

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process the API request and return the response"""
        try:
            # Get node inputs and outputs from state
            node_inputs = state.get("inputs", {})
            node_outputs = state.get("node_outputs", {})

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
                            # Remove quotes and whitespace
                            key = key.strip().strip('"')
                            value = value.strip().strip('"').strip(',')
                            # Replace placeholders in header values
                            value = self._replace_placeholders(value, node_outputs, node_inputs)
                            headers[key] = value

            # Add Content-Type if not present
            if 'Content-Type' not in headers and 'content-type' not in headers:
                headers['Content-Type'] = 'application/json'

            # Replace placeholders in URL
            url = self._replace_placeholders(self.config.url, node_outputs, node_inputs)

            # Replace placeholders in body (if body is provided)
            body = None  # Default value if body is not provided
            if self.config.body:
                try:
                    replaced_body = self._replace_placeholders(self.config.body, node_outputs, node_inputs)
                    body = json.loads(replaced_body)  # Convert to dictionary if valid JSON
                except json.JSONDecodeError:
                    raise ValueError("Invalid JSON format in body")
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method=self.config.method.upper(),
                    url=url,
                    headers=headers,
                    json=body if body is not None else None  # Pass only if body exists
                ) as response:
                    response_data = await response.json()
                    return {
                        f"{self.node_name}.status": response.status,
                        f"{self.node_name}.data": response_data,
                        f"{self.node_name}.url": url,
                        f"{self.node_name}.method": self.config.method.upper()
                    }

        except Exception as e:
            error_msg = f"Error in API call: {str(e)}"
            if self.config.errorBehavior == "continue":
                return {
                    f"{self.node_name}.error": error_msg,
                    f"{self.node_name}.data": None,
                    f"{self.node_name}.status": None,
                    f"{self.node_name}.url": url if 'url' in locals() else self.config.url,
                    f"{self.node_name}.method": self.config.method.upper()
                }
            raise Exception(error_msg) 