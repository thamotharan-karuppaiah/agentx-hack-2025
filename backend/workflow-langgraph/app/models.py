from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON, BigInteger, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from .database import Base

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"
    __table_args__ = (
        Index('idx_workflow_executions_id', 'id'),
        {'schema': 'public'}
    )

    id = Column(BigInteger, primary_key=True, index=True)
    status = Column(String, nullable=False, default="CREATED")
    error_message = Column(Text, nullable=True)
    raw_execution_json = Column(JSONB, nullable=True)  # Changed to JSONB for better performance
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship with steps
    steps = relationship("WorkflowExecutionStep", back_populates="execution", cascade="all, delete-orphan")
    streams = relationship("WorkflowExecutionStream", back_populates="execution", cascade="all, delete-orphan")

class WorkflowExecutionStep(Base):
    __tablename__ = "workflow_execution_steps"
    __table_args__ = (
        Index('idx_workflow_execution_steps_execution_id', 'execution_id'),
        {'schema': 'public'}
    )

    step_id = Column(BigInteger, primary_key=True, index=True)
    execution_id = Column(BigInteger, ForeignKey('public.workflow_executions.id', ondelete='CASCADE'), nullable=False)
    step_name = Column(String, nullable=False)
    error_message = Column(Text, nullable=True)
    input_data = Column(JSONB, nullable=True, default=dict)
    output_data = Column(JSONB, nullable=True, default=dict)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    finished = Column(Boolean, default=False)
    credits_used = Column(Integer, nullable=True)
    logs = Column(JSONB, nullable=False, default=list)
    traces = Column(JSONB, nullable=False, default=list)
    messages = Column(JSONB, nullable=False, default=list)
    tools = Column(JSONB, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship with workflow execution
    execution = relationship("WorkflowExecution", back_populates="steps")

class WorkflowExecutionStream(Base):
    __tablename__ = "workflow_execution_streams"
    __table_args__ = (
        Index('idx_workflow_execution_streams_execution_id', 'execution_id'),
        {'schema': 'public'}
    )

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(BigInteger, ForeignKey('public.workflow_executions.id', ondelete='CASCADE'))
    node_name = Column(String, nullable=False)
    stream_type = Column(String, nullable=False)  # 'input', 'output', 'error'
    content = Column(JSONB, nullable=False, default=dict)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    execution = relationship("WorkflowExecution", back_populates="streams") 

class WorkflowState(BaseModel):
    workflow_id: str
    current_node: Optional[str] = None
    output: dict = {}
    error: Optional[str] = None
    execution_log: List = []
    node_inputs: Dict[str, Any] = {}  # Store inputs for each node
    node_outputs: Dict[str, Any] = {}  # Store outputs for each node
    execution_id: Optional[int] = None  # Add execution_id to track streams
