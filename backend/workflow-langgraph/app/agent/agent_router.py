import json

from fastapi import FastAPI, HTTPException, status, Depends, APIRouter

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langgraph.prebuilt import create_react_agent
from sqlalchemy import create_engine, Column, String, DateTime, Enum as SQLAEnum, JSON, Integer, Identity, Text
from sqlalchemy.orm import sessionmaker, Session, declarative_base, Mapped
from pydantic import BaseModel, Field, create_model
from datetime import datetime, timezone
from typing import Optional, Any, List, Dict, Type, Union
from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool, BaseTool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from enum import StrEnum
import os
import requests
import httpx
from asyncio import create_task
import asyncio
from ..services.workflow_service import WorkflowService

from app import schemas
from app.config import settings
from app.database import get_db
from cloudverse.cloudverse_openai import CloudverseChat
import aiohttp

router = APIRouter()
Base = declarative_base()

class ExecutionStatus(StrEnum):
    AGENT_IN_PROGRESS = "AGENT_IN_PROGRESS"
    CLOSED = "CLOSED"
    TOOL_IN_PROGRESS = "TOOL_IN_PROGRESS"
    IDLE = "IDLE"
    TOOL_REVIEW = "TOOL_REVIEW"

class ExecutionBase(BaseModel):
    trigger_type: Optional[str] = ''
    trigger_input: str
    triggered_by: Optional[str] = '1'

class CreateExecutionRequest(ExecutionBase):
    pass

class Execution(ExecutionBase):
    id: int
    status: ExecutionStatus
    history: List[Dict] = []
    tool_state: Dict = {}
    create_date: datetime
    last_run_at: datetime
    agent_id: str

    class Config:
        from_attributes = True  # Ensures compatibility with SQLAlchemy models

class ExecutionDB(Base):
    __tablename__ = "agent_executions"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True, autoincrement=True, server_default=Identity())
    status = Column(SQLAEnum(ExecutionStatus), nullable=False)
    trigger_type: Mapped[Optional[str]] = Column(String, nullable=True)
    trigger_input = Column(String, nullable=False)
    history = Column(JSON, nullable=False)
    tool_state = Column(JSON, nullable=False)
    create_date = Column(DateTime, nullable=False)
    last_run_at = Column(DateTime, nullable=False)
    triggered_by = Column(String, nullable=False)
    agent_id = Column(String, nullable=False)

def addition(a: int, b: int) -> int:
    return a+b

def format_tool_for_prompt(tool: Tool) -> str:
    """Format a tool for inclusion in the prompt."""
    return f"- {tool.name}: {tool.description}"

class ExtendedCloudverseChat(CloudverseChat):
    def bind_tools(self, tools):
        """Implement bind_tools method required by langgraph."""
        # Create a new instance with the same parameters but with tools bound
        new_instance = self.clone()
        new_instance.tools = tools
        return new_instance

    def clone(self):
        """Create a copy of the current instance."""
        return ExtendedCloudverseChat(
            proxy_url=self.proxy_url,
            auth_token=self.auth_token,
            model_name=self.model_name,
            temperature=self.temperature
        )

def init_llm():
    PROXY_URL = 'https://cloudverse.freshworkscorp.com'
    PROXY_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7Im5hbWUiOiJSYW1yYXRhbiBKYXZhIiwiZW1haWwiOiJyYW1yYXRhbi5qYXZhQGZyZXNod29ya3MuY29tIiwiaW1hZ2UiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJSGNkaFNnTTFFTW1obDAweXdwMmpjaWEtQ0pzQkQwTUE4NzhsZG1BYmN3YWswSnc9czk2LWMiLCJpZCI6IjY3YTIwY2EzMGUyNThhNjc4OTU4YmJmMSJ9LCJleHBpcmVzIjoiMjAyNS0wMi0wNFQxNDo1MzoxMS4wMDlaIiwianRpIjoiR1E1dGhiTExxZU9DbGpLNVMwU0ZUIiwiaWF0IjoxNzM4NjczNTk2LCJleHAiOjE3MzkyNzgzOTZ9.Vxd9MVeKbTsTg7DhJ5g39-65PCXslAd6RAi4TZTyeHw'
    llm = ExtendedCloudverseChat(proxy_url=PROXY_URL, auth_token=PROXY_TOKEN, model_name='Azure-GPT-4o', temperature=0.7)
    return llm

def init_tools_definition(response_data):
    """Initialize tool definitions from response data and fetch their configurations."""
    tools = []
    
    for tool in response_data.get("tools", []):
        headers = {
            "x-workspace-id": "1",
            "x-user-id": "1"
        }
        
        try:
            response = requests.get(
                f"http://localhost:8096/workflow-service/v1/workflows/{tool['id']}", 
                headers=headers
            )
            response.raise_for_status()
            tool_config = response.json()
            
            # Create a dynamic Pydantic model for the tool parameters
            field_definitions = {}
            
            # Find start node in the config
            start_node = next(
                (node for node in tool_config["config"]["nodes"] 
                if node["type"] == "start" or node["id"] == "start"),
                None
            )
            
            if start_node and "data" in start_node:
                for group in start_node["data"].get("groups", []):
                    for field in group.get("fields", []):
                        field_name = field.get("variableName", "")
                        if field_name:
                            # Map field type to Python type
                            field_type = str  # Default to string
                            if field.get("type") == "number":
                                field_type = float
                            elif field.get("type") == "integer":
                                field_type = int
                            elif field.get("type") == "boolean":
                                field_type = bool
                            
                            # Add description to the field
                            description = field.get("label", f"Parameter {field_name}")
                            
                            # Create field with proper type annotation and description
                            if field.get("required", False):
                                field_definitions[field_name] = (
                                    field_type, 
                                    Field(
                                        ...,  # ... means required
                                        description=description
                                    )
                                )
                            else:
                                field_definitions[field_name] = (
                                    Optional[field_type], 
                                    Field(
                                        None,
                                        description=description
                                    )
                                )

            print(f"Creating tool model for {tool['id']} with fields:", field_definitions)
            
            # Create dynamic Pydantic model using create_model
            tool_args_model = create_model(
                f"{tool['id']}Args",
                __config__=type('Config', (), {
                    'extra': 'forbid',
                    'title': f"{tool['name']} Arguments",
                    'description': tool.get("prompt", f"Arguments for {tool['name']} workflow")
                }),
                **field_definitions
            )
            
            # Print the schema to verify
            print(f"Generated schema for {tool['id']}:", tool_args_model.model_json_schema())
            
            async def tool_func(**kwargs):
                print(f"Executing tool {tool['id']} with args:", kwargs)
                db: Session = Depends(get_db)
                
                try:
                    response = requests.get(
                        f"http://localhost:8096/workflow-service/v1/workflows/{tool['id']}",
                        json={"initial_inputs": kwargs},
                        headers={
                            "x-workspace-id": "1",
                            "x-user-id": "1"
                        }
                    )
                    response.raise_for_status()
                    result = response.json()

                    workflow = schemas.Workflow(**response.json())
                    initial_inputs = kwargs

                    workflow_service = WorkflowService(db)
                    
                    try:
                        workflow_execution = await workflow_service.create_workflow(workflow, initial_inputs)
                        result = await workflow_service.execute_workflow_sync(workflow_execution, workflow, initial_inputs)
                        return {
                            "execution_id": workflow_execution.id,
                            "status": "COMPLETED",
                            "result": result.get("result", {}),  # Graph execution result
                            "node_executions": result.get("node_executions", []),  # Individual node results
                            "error": None
                        }
                    except Exception as e:
                        print(f"Error executing workflow: {str(e)}")
                        raise HTTPException(status_code=500, detail=str(e))
                except requests.RequestException as e:
                    error_message = f"Error executing workflow {tool['id']}: {str(e)}"
                    return {
                        "status": "error",
                        "error": error_message,
                        "timestamp": datetime.utcnow().isoformat()
                    }
            
            # Create the Tool object
            tool_obj = Tool(
                name=tool["id"],
                description=tool.get("prompt", f"Executes the {tool['name']} workflow"),
                func=tool_func,
                args_schema=tool_args_model
            )
            
            tools.append(tool_obj)
            
        except Exception as e:
            print(f"Error creating tool {tool['id']}: {str(e)}")
            continue
    
    return tools

async def process_agent_interaction(
    agent_id: str,
    trigger_input: str,
    execution_id: int,
    timestamp: datetime,
    db: Session,
    db_record: Optional[ExecutionDB] = None
) -> Execution:
    """
    Process agent interactions including tool calls and database updates in a structured way.
    
    Args:
        agent_id: The ID of the agent to interact with
        trigger_input: The input message to send to the agent
        execution_id: The ID of the execution record
        timestamp: Current timestamp
        db: Database session
        db_record: Optional existing execution record
    """
    try:
        # Fetch agent configuration
        headers = {
            "x-workspace-id": "1",
            "x-user-id": "1"
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"http://localhost:8096/workflow-service/v1/agents/{agent_id}",
                headers=headers
            ) as response:
                response.raise_for_status()
                response_data = await response.json()

        # Initialize agent
        llm = init_llm()
        tools_definition = init_tools_definition(response_data)
        pre_built_agent = create_react_agent(
            model=llm,
            prompt=response_data["systemPrompt"],
            tools=tools_definition
        )

        # Get or create execution record
        # Create execution record if it doesn't exist
        if db_record is None:
            execution_db = db.query(ExecutionDB).filter(ExecutionDB.id == execution_id).first()
            if not execution_db:
                raise HTTPException(status_code=404, detail="Execution record not found")
        else:
            # Update execution record if it exists
            execution_db = db_record

        # Prepare input messages
        input_messages = []
        if execution_db.history:
            for record in execution_db.history:
                input_messages.append(tuple([record['type'], record['content']]))
        input_messages.append(("user", trigger_input))
        messages = {"messages": input_messages}

        # Process agent responses in a loop until we get a final response
        while True:
            # Get the latest agent response
            agent_response = pre_built_agent.invoke(messages)
            print(f"Agent response: {agent_response}")

            # Process and store the response
            new_message = generate_message(agent_response)
            history = execution_db.history
            history.append(new_message)
            
            # Update DB with latest history
            execution_db.history = history
            execution_db.last_run_at = datetime.now(timezone.utc)
            db.commit()

            # Check if the last message is a tool call
            last_message = agent_response['messages'][-1]
            has_tool_call = isinstance(last_message, ToolMessage) and hasattr(last_message, 'tool_call_id')

            if not has_tool_call:
                # No tool calls, this is the final response
                execution_db.status = ExecutionStatus.IDLE
                db.commit()
                break

            # Process tool call
            execution_db.status = ExecutionStatus.TOOL_IN_PROGRESS
            db.commit()

            try:
                # Extract tool arguments
                tool_args = last_message.additional_kwargs.get('tool_inputs', {})
                
                # Execute tool
                result = await execute_tool(last_message.tool_call_id, tool_args, db)
                formatted_result = format_result(result)
                
                # Add tool result to history
                history.append({
                    'type': 'tool',
                    'content': formatted_result,
                    'tool_call_id': last_message.tool_call_id,
                    'timestamp': datetime.now(timezone.utc)
                })

                # Add tool message for next agent invocation
                tool_message = ToolMessage(
                    content=formatted_result,
                    tool_call_id=last_message.tool_call_id
                )
                messages["messages"].append(tool_message)
                
                # Update DB with intermediate state
                execution_db.history = history
                db.commit()

            except Exception as e:
                print(f"Error executing tool: {str(e)}")
                execution_db.status = ExecutionStatus.IDLE
                db.commit()
                raise HTTPException(status_code=500, detail=str(e))
            
        db.refresh(execution_db)
        db.flush()
        return Execution.model_validate(execution_db)

    except Exception as e:
        print(f"Error in process_agent_interaction: {str(e)}")
        if 'execution_db' in locals():
            execution_db.status = ExecutionStatus.IDLE
            db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{agent_id}/createExecution",
         response_model=Execution,
         status_code=status.HTTP_201_CREATED)
async def create_execution(request: CreateExecutionRequest, agent_id: str, db: Session = Depends(get_db)):
    current_time = datetime.now(timezone.utc)
    db_execution = ExecutionDB(
        status=ExecutionStatus.AGENT_IN_PROGRESS,
        trigger_type=request.trigger_type,
        trigger_input=request.trigger_input,
        create_date=current_time,
        last_run_at=current_time,
        triggered_by="1",
        history=[],
        tool_state={},
        agent_id=agent_id
    )

    db_execution.history = [{"type": "user", "content": request.trigger_input, "timestamp": current_time}]
    
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)
    
    # Use the new process_agent_interaction method
    create_task(process_agent_interaction(
        agent_id=agent_id,
        trigger_input=request.trigger_input,
        execution_id=db_execution.id,
        timestamp=current_time,
        db=db
    ))
    
    return Execution.model_validate(db_execution)

async def execute_tool(workflow_id: str, tool_args: dict, db: Session) -> dict:
    """Execute a workflow tool and return the result."""
    url = f"http://localhost:8096/workflow-service/v1/workflows/{workflow_id}"
    headers = {
        "x-workspace-id": "1",
        "x-user-id": "2"
    }
    
    # Use aiohttp for async HTTP requests
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            response.raise_for_status()
            workflow_data = await response.json()
    
    workflow = schemas.Workflow(**workflow_data)
    workflow_service = WorkflowService(db)
    workflow_execution = await workflow_service.create_workflow(workflow, tool_args)
    result = await workflow_service.execute_workflow_sync(workflow_execution, workflow, tool_args)
    print(result.get("result", {}))

    formatted_result = format_result(result.get("result", {}))
    return result.get("result", {})

async def create_and_invoke_agent(agent_id, trigger_input, execution_id, timestamp, call_db_again, db_record, db: Session = Depends(get_db)):
    headers = {
        "x-workspace-id": "1",
        "x-user-id": "1"
    }

    response = requests.get(f"http://localhost:8096/workflow-service/v1/agents/{agent_id}", headers=headers)
    response.raise_for_status()
    response_data = json.loads(response.text)
    llm = init_llm()
    tools_definition = init_tools_definition(response_data);
    
    pre_built_agent = create_react_agent(model=llm, prompt=response_data["systemPrompt"], tools=tools_definition)
    input_messages = []
    if db_record:
        for record in db_record.history:
            input_messages.append(tuple([record['type'], record['content']]))

    input_messages.append(("user", trigger_input))
    messages = {"messages": input_messages}

    # Pass the necessary variables as a dictionary
    agent_response = pre_built_agent.invoke(messages)
    # todo: add other columns when tool calling or other things are in response
    print(f"agent_response: {agent_response}")

    if call_db_again:
        execution_db = db.query(ExecutionDB).filter(ExecutionDB.id == execution_id).first()
    else:
        execution_db = db_record
    execution = Execution.model_validate(execution_db)
    # input_message = {'type': 'human', 'content': trigger_input, 'timestamp': timestamp}
    message = generate_message(agent_response)

    history = execution.history
    # history.append(input_message)
    history.append(message)

    execution_db.history = message
    execution_db.status = ExecutionStatus.IDLE

    # Handle tool messages and execute tools if present
    for msg in agent_response['messages']:
        if isinstance(msg, ToolMessage) and msg.tool_call_id:
            execution_db.status = ExecutionStatus.TOOL_IN_PROGRESS
            
            try:
                result = await execute_tool(msg.tool_call_id, {"city": "MAA"}, db)
            except Exception as e:
                print(f"Error executing tool: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
            

            formatted_result = format_result(result.get("result", {}))
            print(formatted_result)
            history.append(formatted_result)


            # create the tool message and add it to the messages
            # sample tool message :
            # {
        #     "role": "tool",
        #     "content": [
        #         {
        #             "type": "tool-result",
        #             "toolCallId": "call_XZNl58ZM1aD0zZvJMXcTGUpB",
        #             "toolName": "subtract",
        #             "result": "3"
        #         }
        #     ]
        # }
            tool_message = ToolMessage(content=formatted_result, tool_call_id=msg.tool_call_id)
            messages["messages"].append(tool_message)

            agent_response = pre_built_agent.invoke(messages)
            
    
    execution_db.status = ExecutionStatus.IDLE
    db.commit()
    db.refresh(execution_db)

def format_result(result):
    """Format the result by extracting the 'output' from the last step in the workflow result.
    
    Args:
        result (dict): Dictionary containing workflow step results
        
    Returns:
        Any: The 'output' value from the last step, or the entire result if no 'output' found
    """
    # Get the last step's result (excluding 'start')
    steps = [key for key in result.keys() if key != 'start']
    if not steps:
        return result
        
    last_step = steps[-1]
    last_result = result[last_step]
    
    # Return the 'output' if it exists, otherwise return the full result
    return last_result.get('output', last_result)

def generate_message(agent_response):
    data_list = []
    m = agent_response['messages'][-1]
    message = dict()
    message['timestamp'] = datetime.now(timezone.utc)
    message['content'] = getattr(m, 'content', '') or ''  # Safely get content with default empty string
        
    if type(m) == AIMessage:
        message['type'] = 'assistant'
    elif type(m) == HumanMessage:
        message['type'] = 'user'
    elif type(m) == ToolMessage:
        message['type'] = 'tool'
        message['tool_call_id'] = m.tool_call_id
    elif type(m) == SystemMessage:
        message['type'] = 'system'    
    return message


@router.get("/{execution_id}",
         response_model=Execution)
async def get_execution(execution_id: str, db: Session = Depends(get_db)):
    execution = db.query(ExecutionDB).filter(ExecutionDB.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    return Execution.model_validate(execution)

@router.post("/{agent_id}/continueChat/{execution_id}",
          response_model=Execution)
async def continue_execution(request: CreateExecutionRequest, agent_id: str, execution_id: str, db: Session = Depends(get_db)):
    execution = db.query(ExecutionDB).filter(ExecutionDB.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    current_time = datetime.now(timezone.utc)
    execution.last_run_at = current_time
    execution.status = ExecutionStatus.AGENT_IN_PROGRESS
    
    new_history = list(execution.history)
    new_history.append({"type": "user", "content": request.trigger_input, "timestamp": current_time})
    execution.history = new_history
    
    db.commit()
    db.refresh(execution)
    
    # Use the new process_agent_interaction method
    create_task(process_agent_interaction(
        agent_id=agent_id,
        trigger_input=request.trigger_input,
        execution_id=execution_id,
        timestamp=current_time,
        db=db,
        db_record=execution
    ))
    
    return execution

@router.get("/{agent_id}/executions",
         response_model=List[Execution])
async def get_executions_by_agent(agent_id: str, db: Session = Depends(get_db)):
    executions = db.query(ExecutionDB).filter(ExecutionDB.agent_id == agent_id).all()
    if not executions:
        return []
    return [Execution.model_validate(execution) for execution in executions]

@router.delete("/{execution_id}",
         response_model=dict)
async def delete_execution(execution_id: str, db: Session = Depends(get_db)):
    execution = db.query(ExecutionDB).filter(ExecutionDB.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    db.delete(execution)
    db.commit()
    
    return {"message": "Execution deleted successfully"}
