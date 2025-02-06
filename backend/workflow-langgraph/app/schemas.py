from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Define Position first since it's used by WorkflowNode
class Position(BaseModel):
    x: float
    y: float

class MessageType(str, Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"

class Message(BaseModel):
    id: str
    type: MessageType
    content: str

class Field(BaseModel):
    id: str
    type: str
    label: str
    variableName: str
    hint: Optional[str] = None
    placeholder: Optional[str] = None
    required: bool = False

class Group(BaseModel):
    id: str
    name: str
    fields: List[Field]

class StartNodeData(BaseModel):
    name: str
    title: str
    groups: List[Group]

class EndNodeData(BaseModel):
    name: str
    title: str
    outputType: str

class LLMNodeData(BaseModel):
    title: str
    name: str
    systemPrompt: str
    messages: List[Message]
    errorBehavior: str = "continue"

class APINodeData(BaseModel):
    title: str
    name: str
    url: str
    headers: Optional[str] = None
    method: str = "GET"
    body: Optional[str] = None
    errorBehavior: str = "continue"

class CodeNodeData(BaseModel):
    title: str
    name: str
    language: str
    code: str
    functionPreview: str
    annotations: List[Any] = []
    errorBehavior: str = "continue"

class HumanNodeData(BaseModel):
    title: str
    name: str
    prompt: Optional[str] = None
    errorBehavior: str = "continue"

class NodeData(BaseModel):
    name: str
    title: str
    data: Optional[Union[StartNodeData, EndNodeData, LLMNodeData, APINodeData, CodeNodeData, HumanNodeData]] = None

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

class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    className: Optional[str] = None

class WorkflowConfig(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

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

class WorkflowExecutionInDB(BaseModel):
    id: Optional[int] = None
    apps_execution_id: str  # Changed from int to str to match MongoDB ID
    status: str
    error_message: Optional[str] = None
    raw_execution_json: Optional[Dict] = None
    created_at: Optional[datetime] = datetime.utcnow()
    updated_at: Optional[datetime] = datetime.utcnow()

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

class Workflow(BaseModel):
    id: str
    _id: Optional[str] = None
    name: Optional[str] = ""
    description: Optional[str] = ""
    createdBy: Optional[str] = None
    defaultVersion: Optional[int] = 0
    totalVersions: Optional[int] = 0
    status: Optional[str] = "draft"
    workspaceId: Optional[str] = None
    public: Optional[bool] = False
    color: Optional[str] = None
    emoji: Optional[str] = None
    readme: Optional[str] = None
    deletedAt: Optional[datetime] = None
    uuid: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    __v: Optional[int] = 0
    config: WorkflowConfig
    active_version_number: Optional[int] = 0
    folder_name: Optional[str] = None
    type: Optional[str] = "Workflow"

class WorkflowExecutionStreamBase(BaseModel):
    node_name: str
    stream_type: str
    content: Dict[str, Any]

class WorkflowExecutionStreamCreate(WorkflowExecutionStreamBase):
    execution_id: int

class WorkflowExecutionStreamInDB(WorkflowExecutionStreamBase):
    id: int
    execution_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class WorkflowResponse(BaseModel):
    id: int
    apps_execution_id: int
    created_at: datetime
    updated_at: datetime
    data: List[Dict[str, Any]]
    streams: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class WorkflowExecutionRead(BaseModel):
    id: int
    status: str
    error_message: Optional[str] = None
    raw_execution_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 