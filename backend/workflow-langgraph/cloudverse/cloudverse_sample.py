from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from cloudverse_openai import CloudverseChat


if __name__ == "__main__":
    PROXY_URL = 'https://cloudverse.freshworkscorp.com'
    PROXY_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7Im5hbWUiOiJSYW1yYXRhbiBKYXZhIiwiZW1haWwiOiJyYW1yYXRhbi5qYXZhQGZyZXNod29ya3MuY29tIiwiaW1hZ2UiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJSGNkaFNnTTFFTW1obDAweXdwMmpjaWEtQ0pzQkQwTUE4NzhsZG1BYmN3YWswSnc9czk2LWMiLCJpZCI6IjY3YTIwY2EzMGUyNThhNjc4OTU4YmJmMSJ9LCJleHBpcmVzIjoiMjAyNS0wMi0wNFQxNDo1MzoxMS4wMDlaIiwianRpIjoiR1E1dGhiTExxZU9DbGpLNVMwU0ZUIiwiaWF0IjoxNzM4NjczNTk2LCJleHAiOjE3MzkyNzgzOTZ9.Vxd9MVeKbTsTg7DhJ5g39-65PCXslAd6RAi4TZTyeHw'
    llm = CloudverseChat(proxy_url=PROXY_URL, auth_token=PROXY_TOKEN, model_name='Azure-GPT-4o', temperature=0.7)

    messages = [
        SystemMessage(content="You are a helpful assistant."),
        HumanMessage(content="Hello, how are you?"),
        AIMessage(
            content="Hello! I'm just a computer program, so I don't have feelings, but I'm here and ready to help you. How can I assist you today?"),
        HumanMessage(content="what is 5+2")
    ]

    response = llm.invoke(messages)
    print(response)