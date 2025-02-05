from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

# Define Position first since it's used by WorkflowNode
class Position(BaseModel):
    x: float
    y: float

class NodeData(BaseModel):
    name: str
    title: str
    language: Optional[str] = None
    code: Optional[str] = None
    functionPreview: Optional[str] = None
    annotations: Optional[List] = []
    outputType: Optional[str] = None

class WorkflowNode(BaseModel):
    id: str
    type: str
    position: Position
    data: NodeData
    width: int
    height: int
    selected: bool
    positionAbsolute: Position
    dragging: bool
    deletable: Optional[bool] = None

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

class Event(BaseModel):
    name: str
    value: str

class Performer(BaseModel):
    type: str

class EventNodeData(BaseModel):
    performer: Performer
    events: List[Event]

class AdditionalField(BaseModel):
    name: str
    value: Union[List[str], str]
    operator: str

class ConditionAny(BaseModel):
    multilevel_label: str
    evaluate_on: str
    additional_field: List[AdditionalField]
    name: str
    multilevel_key: str
    value: List[str]
    field_type: str
    parent_value: str
    operator: str

class ConditionNodeData(BaseModel):
    any: List[ConditionAny]

class Action(BaseModel):
    name: str
    value: str
    field_type: str

class ActionNodeData(BaseModel):
    actions: List[Action]
    target: str

class NodeItem(BaseModel):
    data: Union[EventNodeData, ConditionNodeData, ActionNodeData]
    additional_config: Dict = {}

class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str]
    targetHandle: Optional[str]

class WorkflowConfig(BaseModel):
    nodes: List[WorkflowNode]
    edges: List[Edge]

class Workflow(BaseModel):
    id: str
    name: str
    description: str
    createdBy: str
    defaultVersion: int
    totalVersions: int
    status: str
    workspaceId: str
    public: bool
    color: str
    emoji: str
    readme: str
    deletedAt: Optional[str]
    uuid: str
    createdAt: datetime
    updatedAt: datetime
    config: WorkflowConfig
    defaultVersionId: str
    active_version_number: int
    folder_name: Optional[str]
    type: str

class WorkflowResponse(BaseModel):
    id: int
    apps_execution_id: int
    created_at: datetime
    updated_at: datetime
    data: List[Dict[str, Any]] 