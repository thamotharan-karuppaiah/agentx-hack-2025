from typing import Any, List, Optional, TypedDict, Dict
from langchain.schema import BaseMessage, ChatResult, AIMessage, HumanMessage, SystemMessage, ChatGeneration
from langchain_core.language_models import BaseChatModel
from pydantic import Field, model_validator
from enum import Enum
import json
import requests


class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class ToolParameter(TypedDict):
    type: str
    description: str


class ToolProperties(TypedDict):
    input: ToolParameter


class ToolParametersSchema(TypedDict):
    type: str
    properties: ToolProperties
    required: List[str]
    additionalProperties: bool


class Tool(TypedDict):
    toolName: str
    description: str
    parameters: ToolParametersSchema


class CloudverseChat(BaseChatModel):
    proxy_url: str = Field(description="The base URL of the proxy server")
    auth_token: str = Field(description="Authentication token for the proxy")
    model_name: str = Field(default="Azure-GPT-4o", description="Name of the model to use")
    temperature: float = Field(default=0, description="Sampling temperature")
    top_p: float = Field(default=1, description="Top P sampling parameter")
    frequency_penalty: float = Field(default=0, description="Frequency penalty parameter")
    presence_penalty: float = Field(default=0, description="Presence penalty parameter")
    max_tokens: int = Field(default=500, description="Maximum number of tokens to generate")
    tool_choice: str = Field(default="auto", description="Tool choice strategy")
    request_timeout: Optional[float] = Field(default=30.0, description="Timeout for requests to the proxy")

    @property
    def _llm_type(self) -> str:
        """Return identifier for the LLM type."""
        return "cloudverse"

    def _convert_messages_to_cloudverse_format(self, messages: List[BaseMessage]) -> Dict:
        """Convert LangChain message format to cloudverse format with tools and parameters."""
        message_dict = {
            SystemMessage: MessageRole.SYSTEM.value,
            HumanMessage: MessageRole.USER.value,
            AIMessage: MessageRole.ASSISTANT.value
        }

        converted_messages = []
        for message in messages:
            role = message_dict.get(type(message), MessageRole.USER.value)
            converted_messages.append({
                "role": role,
                "content": str(message.content)
            })

        return {
            "messages": converted_messages,
            "model": self.model_name,
            "temperature": self.temperature,
            "topP": self.top_p,
            "frequencyPenalty": self.frequency_penalty,
            "presencePenalty": self.presence_penalty,
            "stop": [],
            "maxTokens": self.max_tokens,
            "toolChoice": self.tool_choice,
            "tools": []
        }

    def _generate(
            self,
            messages: List[BaseMessage],
            stop: Optional[List[str]] = None,
            run_manager: Optional[Any] = None,
            **kwargs: Any,
    ) -> ChatResult:
        """Generate a chat response through cloudverse."""
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }

        # Convert to the new format
        payload = self._convert_messages_to_cloudverse_format(messages)

        if stop:
            payload["stop"] = stop

        try:
            response = requests.post(
                f"{self.proxy_url}/api/v2/chat",
                headers=headers,
                json=payload,
                timeout=self.request_timeout if self.request_timeout is not None else None
            )
            response.raise_for_status()

            response_data = response.json()
            response_message = response_data["text"]
            return self._create_chat_result(response_message)

        except requests.RequestException as e:
            raise requests.RequestException(f"Proxy request failed: {str(e)}") from e

    def _create_chat_result(self, message: str) -> ChatResult:
        from langchain.schema import AIMessage
        message = AIMessage(content=message)
        return ChatResult(generations=[ChatGeneration(message=message)])