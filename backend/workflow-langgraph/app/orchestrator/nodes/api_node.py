from typing import Dict, Any
import aiohttp
from ...schemas import APINodeData

class APINode:
    def __init__(self, config: Dict[str, Any]):
        self.node_id = config.get("id", "api")
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
                for line in self.config.headers.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        # Replace placeholders in header values
                        value = self._replace_placeholders(value.strip(), node_outputs, node_inputs)
                        headers[key.strip()] = value

            # Replace placeholders in URL
            url = self._replace_placeholders(self.config.url, node_outputs, node_inputs)

            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method=self.config.method.upper(),
                    url=url,
                    headers=headers
                ) as response:
                    response_data = await response.json()
                    return {
                        f"{self.node_id}.status": response.status,
                        f"{self.node_id}.data": response_data,
                        f"{self.node_id}.url": url,
                        f"{self.node_id}.method": self.config.method.upper()
                    }

        except Exception as e:
            error_msg = f"Error in API call: {str(e)}"
            if self.config.errorBehavior == "continue":
                return {
                    f"{self.node_id}.error": error_msg,
                    f"{self.node_id}.data": None,
                    f"{self.node_id}.status": None,
                    f"{self.node_id}.url": url if 'url' in locals() else self.config.url,
                    f"{self.node_id}.method": self.config.method.upper()
                }
            raise Exception(error_msg) 