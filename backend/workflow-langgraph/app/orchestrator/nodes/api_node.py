from typing import Dict, Any
import aiohttp
from ...schemas import APINodeData

class APINode:
    def __init__(self, config: Dict[str, Any]):
        self.config = APINodeData(**config.get("data", {}))

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process the API request and return the response"""
        try:
            # Parse headers if provided
            headers = {}
            if self.config.headers:
                for line in self.config.headers.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        headers[key.strip()] = value.strip()

            # Replace any variables in URL with state values
            url = self.config.url
            for key, value in state.items():
                if isinstance(value, str):
                    url = url.replace(f"{{{key}}}", value)

            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method=self.config.method.upper(),
                    url=url,
                    headers=headers
                ) as response:
                    response_data = await response.json()
                    return {
                        self.config.name: {
                            "status": response.status,
                            "data": response_data
                        }
                    }

        except Exception as e:
            error_msg = f"Error in API call: {str(e)}"
            if self.config.errorBehavior == "continue":
                return {
                    self.config.name: {
                        "error": error_msg,
                        "data": None
                    }
                }
            raise Exception(error_msg) 