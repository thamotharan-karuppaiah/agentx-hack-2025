import json

from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from langchain.agents import create_react_agent
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy import create_engine, Column, String, DateTime, Enum as SQLAEnum, JSON, Integer, Identity
from sqlalchemy.orm import sessionmaker, Session, declarative_base, Mapped
from pydantic import BaseModel
from datetime import datetime
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
            name = "answer question",
            func= addition,
            description="use the tool"
        )
    ] # todo: fetch tools from api call and add it here

    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=response_data["systemPrompt"]),
            SystemMessage(content="You have access to the following tools:\n{tools}"),
            MessagesPlaceholder(variable_name="tools"),
            MessagesPlaceholder(variable_name="tool_names"),
            HumanMessage(content="{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ]
    )
    pre_built_agent = create_react_agent(llm=llm, prompt=prompt,tools=tools)
    messages = [
        HumanMessage(content=request.trigger_input)
    ]

    # Pass the necessary variables as a dictionary
    agent_response = pre_built_agent.invoke({
        "input": request.trigger_input,
        "tools": tools,  # Pass tools to the prompt
        "tool_names": ", ".join([tool.name for tool in tools]),  # Convert tools to comma-separated names
        "agent_scratchpad": "",  # Start with an empty scratchpad or provide reasoning history
        "intermediate_steps": []
    })
    print(agent_response)

    current_time = datetime.now()
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


    return Execution.model_validate(db_execution)


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


@router.post("/{execution_id}/continueExecution",
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
