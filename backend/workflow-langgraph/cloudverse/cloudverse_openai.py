from typing import Any, List, Optional, TypedDict, Dict, Callable
from langchain.schema import BaseMessage, ChatResult, AIMessage, HumanMessage, SystemMessage, ChatGeneration, \
    FunctionMessage
from langchain_core.language_models import BaseChatModel
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult
from pydantic import Field, model_validator
from enum import Enum
import json
import requests
from dataclasses import dataclass


class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"
    FUNCTION = "function"


class ToolInputParameter(TypedDict):
    type: str
    description: str


class ToolProperties(TypedDict):
    input: ToolInputParameter


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
    tools: List[Tool] = Field(default_factory=list, description="List of available tools")
    tool_callbacks: Dict[str, Callable] = Field(default_factory=dict, description="Tool callback functions")

    def register_tool(self, tool: Tool, callback: Callable) -> None:
        """Register a tool and its callback function."""
        self.tools.append(tool)
        self.tool_callbacks[tool["toolName"]] = callback

    def _convert_messages_to_cloudverse_format(self, messages: List[BaseMessage]) -> Dict:
        """Convert LangChain message format to cloudverse format with tools and parameters."""
        message_dict = {
            SystemMessage: MessageRole.SYSTEM.value,
            HumanMessage: MessageRole.USER.value,
            AIMessage: MessageRole.ASSISTANT.value,
            FunctionMessage: MessageRole.FUNCTION.value
        }

        converted_messages = []
        for message in messages:
            role = message_dict.get(type(message), MessageRole.USER.value)
            msg_dict = {
                "role": role,
                "content": str(message.content)
            }

            if isinstance(message, FunctionMessage):
                msg_dict["name"] = message.name

            converted_messages.append(msg_dict)

        payload = {
            "messages": converted_messages,
            "model": self.model_name,
            "temperature": self.temperature,
            "topP": self.top_p,
            "frequencyPenalty": self.frequency_penalty,
            "presencePenalty": self.presence_penalty,
            "stop": [],
            "maxTokens": self.max_tokens,
            "toolChoice": self.tool_choice,
            "tools": self.tools
        }

        return payload

    def _handle_tool_call(self, tool_call: Dict[str, Any]) -> str:
        """Handle tool calls and execute the corresponding callback."""

        tool_name = tool_call.get("toolName")
        # Extract arguments and handle input parameter specifically
        arguments = tool_call.get("args", "{}")
        if isinstance(arguments, str):
            try:
                args = json.loads(arguments)
            except json.JSONDecodeError:
                args = {"input": arguments}
        else:
            args = arguments

        if tool_name in self.tool_callbacks:
            try:
                # Pass the input argument directly
                result = self.tool_callbacks[tool_name](args.get("input", ""))
                return str(result)
            except Exception as e:
                error_msg = f"Error executing tool {tool_name}: {str(e)}"
                return error_msg

        error_msg = f"Tool {tool_name} not found"
        return error_msg

    def _generate(
            self,
            messages: List[BaseMessage],
            stop: Optional[List[str]] = None,
            run_manager: Optional[Any] = None,
            **kwargs: Any,
    ) -> ChatResult:
        """Generate a chat response through cloudverse with tool support."""
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }

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

            usage = response_data.get("usage", {})
            metadata = dict([('prompt_tokens', usage.get("promptTokens", 0)),
                             ('completion_token', usage.get("completionTokens", 0)),
                             ('total_tokens', usage.get("totalTokens", 0)),
                             ('tool_calls', response_data.get("toolCalls", [])),
                             ('model', response_data.get("model", self.model_name)),
                             ('finish_reason', response_data.get("finishReason", ""))]
                            )

            # Check for tool calls in different possible formats
            tool_calls = response_data.get("toolCalls", [])
            if tool_calls:
                tool_results = []
                for tool_call in tool_calls:
                    result = self._handle_tool_call(tool_call)
                    tool_results.append(FunctionMessage(
                        content=result,
                        name=tool_call["toolName"]
                    ))

                if tool_results:
                    messages.extend(tool_results)
                    return self._create_chat_result(tool_results[0].content, metadata)

            response_message = response_data.get("text", "")
            return self._create_chat_result(response_message, metadata)


        except requests.RequestException as e:
            error_msg = f"Proxy request failed: {str(e)}"
            raise requests.RequestException(error_msg) from e

    @property
    def _llm_type(self) -> str:
        """Return identifier for the LLM type."""
        return "cloudverse"

    def _create_chat_result(self, message: str, metadata: dict) -> ChatResult:
        message = AIMessage(content=message)
        return ChatResult(generations=[ChatGeneration(message=message)], llm_output=metadata)