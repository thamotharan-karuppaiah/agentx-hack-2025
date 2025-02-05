from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(BigInteger, primary_key=True, index=True)
    apps_execution_id = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    raw_execution_json = Column(JSON)
    status = Column(String(50), nullable=False, default='RUNNING')
    thread_id = Column(String)

    # Relationship with steps
    steps = relationship("WorkflowExecutionStep", back_populates="execution", cascade="all, delete-orphan")

class WorkflowExecutionStep(Base):
    __tablename__ = "workflow_execution_steps"

    step_id = Column(BigInteger, primary_key=True, index=True)
    execution_id = Column(BigInteger, ForeignKey('workflow_executions.id', ondelete='CASCADE'), nullable=False)
    step_name = Column(String)
    error_message = Column(Text)
    input_data = Column(Text)
    output_data = Column(Text)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    finished = Column(Boolean, default=False)
    credits_used = Column(Integer)
    logs = Column(JSON)
    traces = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship with workflow execution
    execution = relationship("WorkflowExecution", back_populates="steps") 