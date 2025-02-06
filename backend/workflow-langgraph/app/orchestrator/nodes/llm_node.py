from typing import Dict, Any, List, Optional
from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
    FunctionMessage,
    BaseMessage
)
from langchain_openai import ChatOpenAI
from app.config import settings
from cloudverse.cloudverse_openai import CloudverseChat
from pydantic import BaseModel, Field
from enum import Enum
from ...models import WorkflowState

class MessageType(str, Enum):
    HUMAN = "human"
    AI = "ai"
    SYSTEM = "system"
    FUNCTION = "function"

class MessageConfig(BaseModel):
    type: MessageType
    content: str
    name: Optional[str] = None
    function_name: Optional[str] = None

class LLMNodeConfig(BaseModel):
    model: str = "Azure-GPT-4o"
    temperature: float = Field(default=0.7)
    system_message: Optional[str] = None
    prompt_template: Optional[str] = None
    output_key: str = Field(default="output")
    input_key: str = Field(default="input")
    max_tokens: Optional[int] = Field(default=500)
    streaming: bool = Field(default=False)
    messages: Optional[List[Dict[str, str]]] = Field(default=None)

class LLMNode:
    def __init__(self, config: Dict[str, Any]):
        # Prioritize using name over id, ensuring we have a consistent node identifier

        print("_______CONFIG_______", config)
        # Get name from data object if it exists, otherwise fall back to id
        self.node_name = config.get("data", {}).get("name") or config.get("name") or config.get("id")
        print("_______NODE_NAME_______", self.node_name)
        if not self.node_name:
            raise ValueError("LLM node must have a name")
            
        node_config = config.get("config", {})
        # If system prompt is in data, add it to config
        if "data" in config and "systemPrompt" in config["data"]:
            node_config["system_message"] = config["data"]["systemPrompt"]
        # If messages are in data, add them to config
        if "data" in config and "messages" in config["data"]:
            node_config["messages"] = config["data"]["messages"]
            
        self.config = LLMNodeConfig(**node_config)
        
        PROXY_URL = 'https://cloudverse.freshworkscorp.com'
        PROXY_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7Im5hbWUiOiJSYW1yYXRhbiBKYXZhIiwiZW1haWwiOiJyYW1yYXRhbi5qYXZhQGZyZXNod29ya3MuY29tIiwiaW1hZ2UiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJSGNkaFNnTTFFTW1obDAweXdwMmpjaWEtQ0pzQkQwTUE4NzhsZG1BYmN3YWswSnc9czk2LWMiLCJpZCI6IjY3YTIwY2EzMGUyNThhNjc4OTU4YmJmMSJ9LCJleHBpcmVzIjoiMjAyNS0wMi0wNFQxNDo1MzoxMS4wMDlaIiwianRpIjoiR1E1dGhiTExxZU9DbGpLNVMwU0ZUIiwiaWF0IjoxNzM4NjczNTk2LCJleHAiOjE3MzkyNzgzOTZ9.Vxd9MVeKbTsTg7DhJ5g39-65PCXslAd6RAi4TZTyeHw'
        self.llm = CloudverseChat(proxy_url=PROXY_URL, auth_token=PROXY_TOKEN,
                               model_name=self.config.model, temperature=self.config.temperature,
                               max_tokens=self.config.max_tokens, stream=self.config.streaming)
        
        self.message_history: List[BaseMessage] = []
        # Add system message if present
        if self.config.system_message:
            self.message_history.append(SystemMessage(content=self.config.system_message))
            
        # Add predefined messages from config if present
        if self.config.messages:
            for message in self.config.messages:
                if message["type"] == "USER":
                    self.message_history.append(HumanMessage(content=message["content"]))
                elif message["type"] == "ASSISTANT":
                    self.message_history.append(AIMessage(content=message["content"]))

    def _create_message(self, message_config: MessageConfig) -> BaseMessage:
        """Create a message based on its type"""
        if message_config.type == MessageType.HUMAN:
            return HumanMessage(content=message_config.content)
        elif message_config.type == MessageType.AI:
            return AIMessage(content=message_config.content)
        elif message_config.type == MessageType.SYSTEM:
            return SystemMessage(content=message_config.content)
        elif message_config.type == MessageType.FUNCTION:
            return FunctionMessage(
                content=message_config.content,
                name=message_config.function_name or "function"
            )
        raise ValueError(f"Unknown message type: {message_config.type}")

    def _format_prompt(self, input_text: str, node_outputs: Dict[str, Any]) -> str:
        """Format the prompt using the template if provided and replace placeholders"""
        formatted_text = input_text
        
        # Replace node output placeholders
        for node_id, outputs in node_outputs.items():
            for key, value in outputs.items():
                # Try both formats: node_id.output.key and node_id.key
                placeholders = [
                    f"{{{{{node_id}.output.{key}}}}}",
                    f"{{{{{node_id}.{key}}}}}"
                ]
                for placeholder in placeholders:
                    formatted_text = formatted_text.replace(placeholder, str(value))
        
        # If we have a template, apply it after replacing placeholders
        if self.config.prompt_template:
            template_text = self.config.prompt_template
            # Replace input placeholder in template with our formatted text
            formatted_text = template_text.replace("{{input}}", formatted_text)
            
            # Also apply the same placeholder replacements to the template
            for node_id, outputs in node_outputs.items():
                for key, value in outputs.items():
                    placeholders = [
                        f"{{{{{node_id}.output.{key}}}}}",
                        f"{{{{{node_id}.{key}}}}}"
                    ]
                    for placeholder in placeholders:
                        formatted_text = formatted_text.replace(placeholder, str(value))
        
        return formatted_text

    async def process(self, state: WorkflowState) -> WorkflowState:
        """Process the input state and return the output state"""
        try:
            # Initialize state attributes if they don't exist
            if not state.node_inputs:
                state.node_inputs = {}
            if not state.node_outputs:
                state.node_outputs = {}
            if not state.message_history:
                state.message_history = {}
            
            # Create a copy of message history and format each message
            current_messages = []
            
            # Add system message if present (no formatting needed for system message)
            if self.config.system_message:
                current_messages.append(SystemMessage(content=self.config.system_message))
            
            # Format and add messages from config
            if self.config.messages:
                for message in self.config.messages:
                    formatted_content = self._format_prompt(message["content"], state.node_outputs)
                    if message["type"] == "USER":
                        current_messages.append(HumanMessage(content=formatted_content))
                    elif message["type"] == "ASSISTANT":
                        current_messages.append(AIMessage(content=formatted_content))
            
            # Get and format the current input
            input_key = f"{self.node_name}.{self.config.input_key}"
            input_text = state.node_inputs.get(input_key, state.node_inputs.get(self.config.input_key, ""))
            formatted_input = self._format_prompt(input_text, state.node_outputs)
                        
            # Process messages through LLM
            response = await self.llm.ainvoke(current_messages)
            
            # Update the main message history with formatted messages
            self.message_history = current_messages
            self.message_history.append(response)
            
            # Convert message history to serializable format
            serialized_history = []
            for msg in self.message_history:
                msg_type = "system" if isinstance(msg, SystemMessage) else \
                          "human" if isinstance(msg, HumanMessage) else \
                          "ai" if isinstance(msg, AIMessage) else \
                          "function" if isinstance(msg, FunctionMessage) else "unknown"
                
                serialized_history.append({
                    "type": msg_type,
                    "content": msg.content,
                    "additional_kwargs": msg.additional_kwargs
                })
            
            # Update state with outputs
            state.node_outputs[self.node_name] = {
                "output": response.content,
                "message_history": serialized_history
            }
            
            # Update the workflow state's message history
            state.message_history[self.node_name] = serialized_history
            
            return state
            
        except Exception as e:
            # Handle errors and add to state
            error_msg = f"Error in LLM processing: {str(e)}"
            state.error = error_msg
            state.node_outputs[self.node_name] = {
                "error": error_msg,
                "output": None
            }
            return state

    async def add_message(self, message_config: MessageConfig) -> None:
        """Add a message to the conversation history"""
        message = self._create_message(message_config)
        self.message_history.append(message)

    def clear_history(self) -> None:
        """Clear the message history except system message"""
        if self.config.system_message:
            self.message_history = [SystemMessage(content=self.config.system_message)]
        else:
            self.message_history = [] 