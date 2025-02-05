from typing import Dict, Any, List, Optional
from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
    FunctionMessage,
    BaseMessage
)
# from langchain_openai import ChatOpenAI
from cloudverse.cloudverse_openai import CloudverseChat
from pydantic import BaseModel, Field
from enum import Enum

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
    model: str = Field(default="gpt-3.5-turbo")
    temperature: float = Field(default=0.7)
    system_message: Optional[str] = None
    prompt_template: Optional[str] = None
    output_key: str = Field(default="output")
    input_key: str = Field(default="input")
    max_tokens: Optional[int] = None
    streaming: bool = Field(default=False)

class LLMNode:
    def __init__(self, config: Dict[str, Any], api_key: str):
        self.node_id = config.get("id", "llm")
        self.config = LLMNodeConfig(**config.get("config", {}))
        # self.llm = ChatOpenAI(
        #     model=self.config.model,
        #     temperature=self.config.temperature,
        #     max_tokens=self.config.max_tokens,
        #     streaming=self.config.streaming,
        #     api_key=api_key
        # )
        PROXY_URL = 'https://cloudverse.freshworkscorp.com'
        PROXY_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7Im5hbWUiOiJSYW1yYXRhbiBKYXZhIiwiZW1haWwiOiJyYW1yYXRhbi5qYXZhQGZyZXNod29ya3MuY29tIiwiaW1hZ2UiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJSGNkaFNnTTFFTW1obDAweXdwMmpjaWEtQ0pzQkQwTUE4NzhsZG1BYmN3YWswSnc9czk2LWMiLCJpZCI6IjY3YTIwY2EzMGUyNThhNjc4OTU4YmJmMSJ9LCJleHBpcmVzIjoiMjAyNS0wMi0wNFQxNDo1MzoxMS4wMDlaIiwianRpIjoiR1E1dGhiTExxZU9DbGpLNVMwU0ZUIiwiaWF0IjoxNzM4NjczNTk2LCJleHAiOjE3MzkyNzgzOTZ9.Vxd9MVeKbTsTg7DhJ5g39-65PCXslAd6RAi4TZTyeHw'
        self.llm = CloudverseChat(proxy_url=PROXY_URL, auth_token=PROXY_TOKEN,
                               model_name=self.config.model, temperature=self.config.temperature,
                               max_tokens=self.config.max_tokens, stream=self.config.streaming)
        self.message_history: List[BaseMessage] = []
        if self.config.system_message:
            self.message_history.append(SystemMessage(content=self.config.system_message))

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
        if self.config.prompt_template:
            # Create a dictionary of available variables from previous node outputs
            variables = {}
            for node_id, outputs in node_outputs.items():
                for key, value in outputs.items():
                    placeholder = f"{node_id}.{key}"
                    variables[placeholder] = value
            
            try:
                # First try to format with node outputs
                return self.config.prompt_template.format(input=input_text, **variables)
            except KeyError:
                # Fallback to basic formatting if placeholders not found
                return self.config.prompt_template.format(input=input_text)
        return input_text

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process the input state and return the output state"""
        try:
            # Get input from state
            node_inputs = state.get("inputs", {})
            node_outputs = state.get("node_outputs", {})
            
            # Get input using node-specific input key
            input_key = f"{self.node_id}.{self.config.input_key}"
            input_text = node_inputs.get(input_key, state.get(self.config.input_key, ""))
            
            # Format the input using template if provided
            formatted_input = self._format_prompt(input_text, node_outputs)
            
            # Add input message to history
            input_message = HumanMessage(content=formatted_input)
            self.message_history.append(input_message)
            
            # Process messages through LLM
            response = await self.llm.ainvoke(self.message_history)
            
            # Add response to history
            self.message_history.append(response)
            
            # Prepare output with node-specific output key
            output = {
                f"{self.node_id}.{self.config.output_key}": response.content,
                f"{self.node_id}.message_history": [msg.content for msg in self.message_history]
            }
            
            return output
            
        except Exception as e:
            # Handle errors and add to state
            error_msg = f"Error in LLM processing: {str(e)}"
            return {
                f"{self.node_id}.error": error_msg,
                f"{self.node_id}.{self.config.output_key}": None
            }

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