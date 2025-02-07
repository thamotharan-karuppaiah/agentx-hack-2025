from typing import Any, List, Optional, TypedDict, Dict, Callable, Union, Tuple
from langchain.schema import BaseMessage, ChatResult, AIMessage, HumanMessage, SystemMessage, ChatGeneration, \
    FunctionMessage
from langchain_core.messages import ToolMessage
from langchain_core.language_models import BaseChatModel
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult, LLMResult
from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.messages import BaseMessage
from pydantic import Field, model_validator
from enum import Enum
import json
import requests
import tiktoken
from datetime import datetime
import uuid


class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"
    FUNCTION = "function"


class Tool(TypedDict):
    toolName: str
    description: str
    parameters: Dict[str, Any]


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
    chat_history: List[Dict[str, Any]] = Field(default_factory=list, description="Chat history")
    stream: bool = Field(default="false", description="Text or streaming support")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

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
                "content": str(message.content),
                "timestamp": datetime.utcnow().isoformat(),
            }

            if isinstance(message, FunctionMessage):
                msg_dict["name"] = message.name

            if hasattr(message, "additional_kwargs"):
                # Filter out non-serializable objects from additional_kwargs
                serializable_kwargs = {
                    k: v for k, v in message.additional_kwargs.items() 
                    if not callable(v)  # Exclude function objects
                }
                msg_dict.update(serializable_kwargs)

            converted_messages.append(msg_dict)
            self.chat_history.append(msg_dict)

        # Convert tools to a serializable format, excluding callback functions
        serializable_tools = []
        for tool in self.tools:
            if isinstance(tool, dict):
                # Create a copy of the tool dict without any function references
                tool_copy = {
                    "toolName": tool["toolName"],
                    "description": tool["description"],
                    "parameters": tool["parameters"]
                }
                serializable_tools.append(tool_copy)
            else:
                # Convert Tool object to dict
                serializable_tools.append({
                    "toolName": tool.name,
                    "description": tool.description,
                    "parameters": tool.args_schema.schema() if hasattr(tool, 'args_schema') and tool.args_schema else {}
                })

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
            "tools": serializable_tools
            # "stream": self.stream
        }

        return payload

    def _create_message_dicts(
            self, messages: List[BaseMessage], stop: Optional[List[str]]
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        params = {
            "model": self.model_name,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "frequency_penalty": self.frequency_penalty,
            "presence_penalty": self.presence_penalty,
            "max_tokens": self.max_tokens,
        }
        if stop is not None:
            params["stop"] = stop
        message_dicts = [self._convert_message_to_dict(m) for m in messages]
        return message_dicts, params

    def _convert_message_to_dict(self, message: BaseMessage) -> Dict[str, Any]:
        """Convert a LangChain message to a dictionary format."""
        message_dict = {
            "role": message.type,
            "content": message.content,
        }
        if message.additional_kwargs:
            message_dict.update(message.additional_kwargs)
        return message_dict

    def _handle_tool_call(self, tool_call: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """Handle tool calls and execute the corresponding callback."""
        tool_name = tool_call.get("toolName")
        arguments = tool_call.get("args", "{}")

        if isinstance(arguments, str):
            try:
                args = json.loads(arguments)
            except json.JSONDecodeError:
                args = {"input": arguments}
        else:
            args = arguments

        tool_response = {
            "tool_name": tool_name,
            "tool_call_id": tool_call.get("id", ""),
            "arguments": args,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Find the matching tool - looking for Tool objects by checking name attribute
        # matching_tool = next((tool for tool in self.tools if 
        #                     hasattr(tool, "name") and tool.name == tool_name), None)

        # if matching_tool:
        #     try:
        #         # Execute the tool function with the arguments
        #         result = matching_tool.func(**args)
                
        #         # Handle the result
        #         if isinstance(result, dict) and "status" in result:
        #             tool_response.update(result)
        #         else:
        #             tool_response["status"] = "success"
        #             tool_response["result"] = str(result)
                
        #         return str(tool_response.get("result", "")), tool_response
                
        #     except Exception as e:
        #         error_msg = f"Error executing tool {tool_name}: {str(e)}"
        #         tool_response["status"] = "error"
        #         tool_response["error"] = str(e)
        #         return error_msg, tool_response

        error_msg = f"Tool {tool_name} not found"
        tool_response["status"] = "error"
        tool_response["error"] = error_msg
        return error_msg, tool_response

    def _generate(
            self,
            messages: List[BaseMessage],
            stop: Optional[List[str]] = None,
            run_manager: Optional[CallbackManagerForLLMRun] = None,
            **kwargs: Any,
    ) -> ChatResult:
        """Generate a chat response with comprehensive metadata and history."""
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }

        print(f"messages: {messages}")
        payload = self._convert_messages_to_cloudverse_format(messages)
        print(f"payload: {payload}")
        if stop:
            payload["stop"] = stop

        try:
            response = requests.post(
                f"{self.proxy_url}/api/v2/chat",
                headers=headers,
                json=payload,
                timeout=self.request_timeout
            )
            print(f"response status: {response.status_code}")
            print(f"response text: {response.text}")
            
            # Check if response is successful
            if response.status_code != 200:
                error_msg = f"Proxy request failed with status {response.status_code}: {response.text}"
                raise requests.RequestException(error_msg)

            # Try to parse as JSON first
            try:
                response_data = response.json()
            except json.JSONDecodeError:
                # If not JSON, treat as plain text response
                response_data = {
                    "text": response.text,
                    "finish_reason": "stop",
                    "usage": {},
                    "model": self.model_name,
                }

            if not response_data and not response.text:
                error_msg = "Empty response from proxy"
                raise requests.RequestException(error_msg)

            # Process tool calls if any
            tool_calls = response_data.get("toolCalls", [])
            tool_outputs = []
            final_response_data = response_data

            # if tool_calls:
            #     for tool_call in tool_calls:
            #         result, tool_info = self._handle_tool_call(tool_call)
            #         tool_outputs.append(tool_info)
            #         messages.append(FunctionMessage(
            #             content=result,
            #             name=tool_call["toolName"],
            #             additional_kwargs={"tool_info": tool_info}
            #         ))

            #     # Make another API call with the tool results
            #     payload = self._convert_messages_to_cloudverse_format(messages)
            #     response = requests.post(
            #         f"{self.proxy_url}/api/v2/chat",
            #         headers=headers,
            #         json=payload,
            #         timeout=self.request_timeout
            #     )
                
            #     if response.status_code != 200:
            #         error_msg = f"Tool response request failed with status {response.status_code}: {response.text}"
            #         raise requests.RequestException(error_msg)

            #     try:
            #         final_response_data = response.json()
            #     except json.JSONDecodeError:
            #         final_response_data = {
            #             "text": response.text,
            #             "finish_reason": "stop",
            #             "usage": {},
            #             "model": self.model_name,
            #         }

            # Get content from the final response
            content = final_response_data.get("text", "") or final_response_data.get("content", "")
            if not content and tool_outputs:
                content = tool_outputs[-1].get("result", "No response generated")

            # Create generation info
            generation_info = {
                "finish_reason": final_response_data.get("finish_reason", "stop"),
                "logprobs": final_response_data.get("logprobs"),
                "token_usage": final_response_data.get("usage", {}),
                "model": final_response_data.get("model", self.model_name),
                "timestamp": datetime.utcnow().isoformat(),
            }

            # if tool_outputs:
            #     generation_info["tool_outputs"] = tool_outputs

            # Create LLM output
            llm_output = {
                "token_usage": final_response_data.get("usage", {}),
                "model_name": self.model_name,
                "system_fingerprint": final_response_data.get("system_fingerprint"),
                "raw_response": final_response_data,
                "message_uuid": final_response_data.get("id"),
                "session_info": {
                    "session_id": final_response_data.get("session_id"),
                    "conversation_id": final_response_data.get("conversation_id"),
                },
                "tool_usage": {
                    "total_tools_called": len(tool_calls),
                    "tool_calls": tool_calls
                },
                "api_version": final_response_data.get("api_version"),
                "timestamp": datetime.utcnow().isoformat(),
            }

        
            if tool_calls:
                # Format tool calls and create messages
                messages = []
                for tool_call in tool_calls:
                    
                    tool_name = tool_call.get("toolName")
                    tool_args = tool_call.get("args")
                    # tool_result = call_tool(tool_id, tool_args) 
                    
                    messages.append(ToolMessage(
                        content=content,
                        tool_call_id=tool_name,
                        additional_kwargs={
                            "tool_outputs": tool_call if tool_calls else None
                        }
                    ))

                # Create a generation for each message
                generations = [
                    ChatGeneration(
                        message=msg,
                        generation_info=generation_info
                    ) for msg in messages
                ]

            else:
                message = AIMessage(
                    content=content,
                    additional_kwargs={
                        "raw_response": final_response_data,
                        "tool_outputs": tool_outputs if tool_outputs else None
                    }
                )
                generations = [ChatGeneration(
                    message=message,
                    generation_info=generation_info
                )]

            return ChatResult(
                generations=generations,
                llm_output=llm_output
            )

        except requests.RequestException as e:
            error_msg = f"Proxy request failed: {str(e)}"
            print(f"Error in _generate: {error_msg}")
            raise requests.RequestException(error_msg) from e
        except Exception as e:
            error_msg = f"Unexpected error in _generate: {str(e)}"
            print(f"Unexpected error: {error_msg}")
            raise requests.RequestException(error_msg) from e

    @property
    def _llm_type(self) -> str:
        """Return identifier for the LLM type."""
        return "cloudverse"