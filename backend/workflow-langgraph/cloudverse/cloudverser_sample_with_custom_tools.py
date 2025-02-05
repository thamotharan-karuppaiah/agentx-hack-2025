from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from cloudverse_openai import CloudverseChat

addition_tool = {
    "toolName": "addition",
    "description": "This tool can add two numbers",
    "parameters": {
        "type": "object",
        "properties": {
            "input": {
                "type": "string",
                "description": "Addition of two numbers"
            }
        },
        "required": ["input"],
        "additionalProperties": False
    }
}

subtract_tool = {
    "toolName": "subtract",
    "description": "This tool can subtract two numbers",
    "parameters": {
        "type": "object",
        "properties": {
            "input": {
                "type": "string",
                "description": "Subtract of two numbers"
            }
        },
        "required": ["input"],
        "additionalProperties": False
    }
}

tools = []
tools.append(addition_tool)
tools.append(subtract_tool)

# Define callbacks
def addition(input: str) -> str:
    # Parse the input string and perform addition
    nums = [int(x.strip()) for x in input.split('+')]
    return str(sum(nums))

def subtraction(input: str) -> str:
    # Parse the input string and perform subtraction
    nums = [int(x.strip()) for x in input.split('-')]
    result = nums[0] - sum(nums[1:])
    return str(result)


PROXY_URL = 'https://cloudverse.freshworkscorp.com'
PROXY_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7Im5hbWUiOiJSYW1yYXRhbiBKYXZhIiwiZW1haWwiOiJyYW1yYXRhbi5qYXZhQGZyZXNod29ya3MuY29tIiwiaW1hZ2UiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJSGNkaFNnTTFFTW1obDAweXdwMmpjaWEtQ0pzQkQwTUE4NzhsZG1BYmN3YWswSnc9czk2LWMiLCJpZCI6IjY3YTIwY2EzMGUyNThhNjc4OTU4YmJmMSJ9LCJleHBpcmVzIjoiMjAyNS0wMi0wNFQxNDo1MzoxMS4wMDlaIiwianRpIjoiR1E1dGhiTExxZU9DbGpLNVMwU0ZUIiwiaWF0IjoxNzM4NjczNTk2LCJleHAiOjE3MzkyNzgzOTZ9.Vxd9MVeKbTsTg7DhJ5g39-65PCXslAd6RAi4TZTyeHw'

# Create LLM instance
llm = CloudverseChat(proxy_url=PROXY_URL, auth_token=PROXY_TOKEN, model_name='Azure-GPT-4o', temperature=0.7,
                     tool_choice='auto',tools=tools)

# Register tools
llm.register_tool(addition_tool, addition)
llm.register_tool(subtract_tool, subtraction)

# Use the LLM
messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="Hello, how are you?"),
    AIMessage(
        content="Hello! I'm just a computer program, so I don't have feelings, but I'm here and ready to help you. How can I assist you today?"),
    HumanMessage(content="what is 5+4")
]

response = llm.invoke(messages)
print(response)