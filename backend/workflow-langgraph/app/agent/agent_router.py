import json

from fastapi import FastAPI, HTTPException, status, Depends, APIRouter

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langgraph.prebuilt import create_react_agent
from sqlalchemy import create_engine, Column, String, DateTime, Enum as SQLAEnum, JSON, Integer, Identity
from sqlalchemy.orm import sessionmaker, Session, declarative_base, Mapped
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, Any, List, Dict
from langchain_core.tools import Tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from enum import StrEnum
import os
import requests

from app.database import get_db
from cloudverse.cloudverse_openai import CloudverseChat

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

def addition(a: int, b: int) -> int:
    return a+b

def format_tool_for_prompt(tool: Tool) -> str:
    """Format a tool for inclusion in the prompt."""
    return f"- {tool.name}: {tool.description}"

def init_llm():
    PROXY_URL = 'https://cloudverse.freshworkscorp.com'
    PROXY_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7Im5hbWUiOiJSYW1yYXRhbiBKYXZhIiwiZW1haWwiOiJyYW1yYXRhbi5qYXZhQGZyZXNod29ya3MuY29tIiwiaW1hZ2UiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJSGNkaFNnTTFFTW1obDAweXdwMmpjaWEtQ0pzQkQwTUE4NzhsZG1BYmN3YWswSnc9czk2LWMiLCJpZCI6IjY3YTIwY2EzMGUyNThhNjc4OTU4YmJmMSJ9LCJleHBpcmVzIjoiMjAyNS0wMi0wNFQxNDo1MzoxMS4wMDlaIiwianRpIjoiR1E1dGhiTExxZU9DbGpLNVMwU0ZUIiwiaWF0IjoxNzM4NjczNTk2LCJleHAiOjE3MzkyNzgzOTZ9.Vxd9MVeKbTsTg7DhJ5g39-65PCXslAd6RAi4TZTyeHw'
    llm = CloudverseChat(proxy_url=PROXY_URL, auth_token=PROXY_TOKEN, model_name='Azure-GPT-4o', temperature=0.7)
    return llm

@router.post("/{agent_id}/createExecution",
         response_model=Execution,
         status_code=status.HTTP_201_CREATED)
async def create_execution(request: CreateExecutionRequest, agent_id: str , db: Session = Depends(get_db)):

    current_time = datetime.now(timezone.utc)
    db_execution = ExecutionDB(
        status=ExecutionStatus.AGENT_IN_PROGRESS,
        trigger_type=request.trigger_type,
        trigger_input=request.trigger_input,
        create_date=current_time,
        last_run_at=current_time,
        triggered_by="1",
        history=[],
        tool_state={}
    )
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)
    await create_and_invoke_agent(agent_id, request.trigger_input,  db_execution.id, current_time, db)
    return Execution.model_validate(db_execution)

async def create_and_invoke_agent(agent_id, trigger_input, execution_id, timestamp, db: Session = Depends(get_db)):
    headers = {
        "x-workspace-id": "1",
        "x-user-id": "1"
    }

    response = requests.get(f"http://localhost:8096/workflow-service/v1/agents/{agent_id}", headers=headers)
    response.raise_for_status()
    response_data = json.loads(response.text)
    llm = init_llm()
    tools = [
        Tool(
            name="answer question",
            func=addition,
            description="use the tool"
        )
    ]  # todo: fetch tools from api call and add it here

    pre_built_agent = create_react_agent(model=llm, prompt=response_data["systemPrompt"], tools=[])
    messages = {"messages": [("user", trigger_input)]}

    # Pass the necessary variables as a dictionary
    agent_response = pre_built_agent.invoke(messages)
    # todo: add other columns when tool calling or other things are in response


    execution_db = db.query(ExecutionDB).filter(ExecutionDB.id == execution_id).first()
    execution = Execution.model_validate(execution_db)
    input_message = {'type': 'human', 'content': trigger_input, 'timestamp': timestamp}
    message = generate_message(agent_response)

    history = execution.history
    history.append(input_message)
    history.append(message)

    execution_db.history = history
    db.commit()
    db.refresh(execution_db)

def generate_message(agent_response):
    message = dict()
    message['timestamp'] = agent_response['messages'][-1].response_metadata['timestamp']
    message['content'] = agent_response['messages'][-1].content

    if type(agent_response['messages'][-1])==AIMessage:
        message['type'] = 'agent'
    elif type(agent_response['messages'][-1])==HumanMessage:
        message['type'] = 'user'
    elif type(agent_response['messages'][-1])==ToolMessage:
        message['type'] = 'tool'
    elif type(agent_response['messages'][-1])==SystemMessage:
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


@router.post("/{agent_id}/{execution_id}/continueChat",
          response_model=Execution)
async def continue_execution(execution_id: str, db: Session = Depends(get_db)):
    execution = db.query(ExecutionDB).filter(ExecutionDB.execution_id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    if execution.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot continue execution in {execution.status} state"
        )

    try:
        # Update status to IN_PROGRESS
        execution.status = ExecutionStatus.IN_PROGRESS
        execution.last_run_at = datetime.now()
        execution.history += f"\nExecution continued at {execution.last_run_at}"

        # Process the execution
        await process_execution(execution)

        # Update status to COMPLETED
        execution.status = ExecutionStatus.COMPLETED
        execution.last_run_at = datetime.now()
        execution.history += f"\nExecution completed at {execution.last_run_at}"

        db.commit()
        db.refresh(execution)
        return execution

    except Exception as e:
        execution.status = ExecutionStatus.FAILED
        execution.last_run_at = datetime.now()
        execution.history += f"\nExecution failed at {execution.last_run_at}: {str(e)}"
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


async def process_execution(execution: ExecutionDB) -> None:
    """
    Process the execution. Replace this with your actual business logic.
    """
    from asyncio import sleep
    await sleep(1)  # Simulate some async work

    # Update tool state with some sample data
    execution.tool_state = '{"processing_status": "completed", "results": "sample_output"}'
