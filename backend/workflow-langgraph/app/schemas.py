from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class WorkflowStepBase(BaseModel):
    step_name: str
    input_data: Optional[str] = None
    output_data: Optional[str] = None
    error_message: Optional[str] = None
    finished: bool = False
    credits_used: Optional[int] = None
    logs: Optional[Dict[str, Any]] = None
    traces: Optional[List[Any]] = None

class WorkflowStepCreate(WorkflowStepBase):
    execution_id: int

class WorkflowStepUpdate(WorkflowStepBase):
    pass

class WorkflowStepInDB(WorkflowStepBase):
    step_id: int
    execution_id: int
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowExecutionBase(BaseModel):
    apps_execution_id: int
    status: str = "RUNNING"
    thread_id: Optional[str] = None
    raw_execution_json: Optional[Dict[str, Any]] = None

class WorkflowExecutionCreate(WorkflowExecutionBase):
    pass

class WorkflowExecutionUpdate(WorkflowExecutionBase):
    pass

class WorkflowExecutionInDB(WorkflowExecutionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    steps: List[WorkflowStepInDB] = []

    class Config:
        from_attributes = True

class WorkflowConfig(BaseModel):
    nodes: Dict[str, Any]
    edges: List[Dict[str, Any]]

class WorkflowResponse(BaseModel):
    id: int
    apps_execution_id: int
    created_at: datetime
    updated_at: datetime
    data: List[Dict[str, Any]] 