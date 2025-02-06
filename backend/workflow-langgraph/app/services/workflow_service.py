from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from .. import models, schemas
from IPython.display import Image, display
from ..orchestrator.workflow_orchestrator import WorkflowOrchestrator
import json
import asyncio

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

class WorkflowState(dict):
    """State object for the workflow"""
    def __init__(self, workflow_config: Dict = None):
        super().__init__()
        config = workflow_config or {}
        self.update({
            "current_node": None,
            "output": {},
            "error": None,
            "workflow": config
        })

    @classmethod
    def create(cls, workflow: schemas.Workflow):
        return cls({
            "id": workflow.id,
            "nodes": [node.model_dump() for node in workflow.config.nodes],
            "edges": [edge.model_dump() for edge in workflow.config.edges]
        })

class WorkflowService:
    def __init__(self, db: Session):
        self.db = db

    def _serialize_workflow_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Serialize workflow data to handle datetime objects and ensure proper JSON format"""
        try:
            if isinstance(data, str):
                # If data is already a JSON string, parse it to dict
                return json.loads(data)
            # Convert to JSON-compatible dict, handling datetime objects
            return json.loads(json.dumps(data, cls=DateTimeEncoder))
        except Exception as e:
            print(f"Error serializing data: {str(e)}")
            # Return a safe default if serialization fails
            return {}

    async def create_workflow(self, workflow: schemas.Workflow, initial_inputs: Dict[str, Any] = None) -> models.WorkflowExecution:
        try:
            # Prepare the execution data
            execution_data = {
                "config": workflow.model_dump(),
                "initial_inputs": initial_inputs or {}
            }
            
            # Create new workflow execution
            workflow_execution = models.WorkflowExecution(
                status="CREATED",
                raw_execution_json=self._serialize_workflow_data(execution_data)
            )
            
            self.db.add(workflow_execution)
            self.db.commit()
            self.db.refresh(workflow_execution)
            
            return workflow_execution
            
        except Exception as e:
            self.db.rollback()
            print(f"Error creating workflow: {str(e)}")
            raise e

    async def execute_workflow(self, workflow_execution: models.WorkflowExecution, workflow: schemas.Workflow, initial_inputs: Dict[str, Any] = None) -> models.WorkflowExecution:
        """Execute a prepared workflow"""
        try:
            # Update status to RUNNING with retry logic
            retries = 3
            for attempt in range(retries):
                try:
                    workflow_execution.status = "RUNNING"
                    self.db.commit()
                    print(f"Starting execution of workflow {workflow_execution.id}")
                    break
                except Exception as db_error:
                    print(f"Database error on attempt {attempt + 1}: {str(db_error)}")
                    self.db.rollback()
                    if attempt == retries - 1:  # Last attempt
                        raise
                    await asyncio.sleep(1)  # Wait before retrying

            async with WorkflowOrchestrator(self.db) as orchestrator:
                try:
                    # Execute the workflow with streaming support
                    result = await orchestrator.execute_workflow(
                        workflow_execution.id,
                        workflow.config.dict(),
                        workflow_execution.id,
                        initial_inputs
                    )

                    # Update workflow execution status and serialize the result
                    workflow_execution.status = "COMPLETED"
                    workflow_execution.raw_execution_json = self._serialize_workflow_data({
                        "config": workflow.config.dict(),
                        "initial_inputs": initial_inputs or {},
                        "result": result
                    })
                    
                    # Commit with retry logic
                    for attempt in range(retries):
                        try:
                            self.db.commit()
                            print(f"Workflow {workflow_execution.id} completed successfully")
                            break
                        except Exception as db_error:
                            print(f"Database error on attempt {attempt + 1}: {str(db_error)}")
                            self.db.rollback()
                            if attempt == retries - 1:  # Last attempt
                                raise
                            await asyncio.sleep(1)  # Wait before retrying

                except Exception as exec_error:
                    print(f"Error executing workflow {workflow_execution.id}: {str(exec_error)}")
                    workflow_execution.status = "ERROR"
                    workflow_execution.error_message = str(exec_error)
                    workflow_execution.raw_execution_json = self._serialize_workflow_data({
                        "config": workflow.config.dict(),
                        "initial_inputs": initial_inputs or {},
                        "error": str(exec_error)
                    })
                    
                    # Commit error status with retry logic
                    for attempt in range(retries):
                        try:
                            self.db.commit()
                            break
                        except Exception as db_error:
                            print(f"Database error on attempt {attempt + 1}: {str(db_error)}")
                            self.db.rollback()
                            if attempt == retries - 1:  # Last attempt
                                raise
                            await asyncio.sleep(1)  # Wait before retrying
                    
                    raise exec_error

                return workflow_execution

        except Exception as e:
            print(f"Error in execute_workflow: {str(e)}")
            # Ensure status is updated even if there's an error
            try:
                workflow_execution.status = "ERROR"
                workflow_execution.error_message = str(e)
                workflow_execution.raw_execution_json = self._serialize_workflow_data({
                    "error": str(e)
                })
                self.db.commit()
            except:
                self.db.rollback()
            raise

    async def get_execution(self, execution_id: int) -> Optional[models.WorkflowExecution]:
        """Get a workflow execution by ID"""
        return self.db.query(models.WorkflowExecution).filter(
            models.WorkflowExecution.id == execution_id
        ).first()

    async def get_workflow_logs(self, execution_id: int) -> schemas.WorkflowResponse:
        """Get logs and streams for a specific workflow execution with enhanced detail"""
        workflow = await self.get_execution(execution_id)
        
        if not workflow:
            raise ValueError(f"Workflow execution {execution_id} not found")

        # Get execution steps with all details
        steps = self.db.query(models.WorkflowExecutionStep).filter(
            models.WorkflowExecutionStep.execution_id == workflow.id
        ).order_by(models.WorkflowExecutionStep.start_time).all()

        # Get execution streams
        streams = self.db.query(models.WorkflowExecutionStream).filter(
            models.WorkflowExecutionStream.execution_id == workflow.id
        ).order_by(models.WorkflowExecutionStream.timestamp).all()

        return schemas.WorkflowResponse(
            id=workflow.id,
            created_at=workflow.created_at,
            updated_at=workflow.updated_at,
            data=[{
                "name": step.step_name,
                "error": step.error_message,
                "input": step.input_data,
                "output": step.output_data,
                "start_time": step.start_time,
                "end_time": step.end_time,
                "finished": step.finished,
                "logs": step.logs or [],
                "traces": step.traces or [],
                "messages": step.messages or [],
                "tools": step.tools or [],
                "credits_used": step.credits_used
            } for step in steps],
            streams=[{
                "node_name": stream.node_name,
                "stream_type": stream.stream_type,
                "content": stream.content,
                "timestamp": stream.timestamp
            } for stream in streams]
        )

    async def log_step_execution(
        self, execution_id: int, step: schemas.WorkflowStepCreate
    ) -> models.WorkflowExecutionStep:
        """Log a new step execution"""
        workflow = await self.get_execution(execution_id)
        
        if not workflow:
            raise ValueError(f"Workflow execution {execution_id} not found")

        try:
            # Prepare step data with message and tool tracking
            step_data = {
                "execution_id": workflow.id,
                "step_name": step.step_name,
                "input_data": self._serialize_workflow_data(step.input_data) if step.input_data else {},
                "logs": [],
                "traces": [],
                "messages": [],
                "tools": [],
                "finished": False
            }

            db_step = models.WorkflowExecutionStep(**step_data)
            self.db.add(db_step)
            self.db.commit()
            self.db.refresh(db_step)
            
            return db_step
        except Exception as e:
            print(f"Error creating step: {str(e)}")
            self.db.rollback()
            raise

    async def update_step(
        self, execution_id: int, step_id: int, step_update: schemas.WorkflowStepUpdate
    ) -> models.WorkflowExecutionStep:
        """Update a step execution (finish or error)"""
        workflow = await self.get_execution(execution_id)
        
        if not workflow:
            raise ValueError(f"Workflow execution {execution_id} not found")

        db_step = self.db.query(models.WorkflowExecutionStep).filter(
            models.WorkflowExecutionStep.step_id == step_id,
            models.WorkflowExecutionStep.execution_id == workflow.id
        ).first()
        
        if not db_step:
            raise ValueError(f"Step {step_id} not found in workflow {execution_id}")

        try:
            # Update step fields
            update_data = step_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                if key in ['output_data', 'messages', 'tools', 'logs', 'traces'] and value is not None:
                    value = self._serialize_workflow_data(value)
                setattr(db_step, key, value)

            if step_update.finished:
                db_step.end_time = datetime.utcnow()
                db_step.finished = True
            
            # Update workflow status
            workflow.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(db_step)
            
            return db_step
        except Exception as e:
            print(f"Error updating step: {str(e)}")
            self.db.rollback()
            raise

    async def log_stream(
        self,
        execution_id: int,
        node_name: str,
        stream_type: str,
        content: Dict[str, Any]
    ) -> models.WorkflowExecutionStream:
        """Log a stream event with enhanced content structure"""
        workflow = await self.get_execution(execution_id)
        
        if not workflow:
            raise ValueError(f"Workflow execution {execution_id} not found")
        
        try:
            # Structure and serialize the content
            structured_content = self._serialize_workflow_data({
                "type": stream_type,
                "content": content,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            stream = models.WorkflowExecutionStream(
                execution_id=workflow.id,
                node_name=node_name,
                stream_type=stream_type,
                content=structured_content
            )
            
            self.db.add(stream)
            self.db.commit()
            self.db.refresh(stream)
            
            return stream
        except Exception as e:
            print(f"Error creating stream: {str(e)}")
            self.db.rollback()
            raise

    async def _handle_stream(self, event: Dict[str, Any]):
        """Handle streaming events from the graph"""
        if not isinstance(event, dict):
            return
        
        try:
            state = event.get("state")
            if not state or not isinstance(state, WorkflowState):
                return
            
            execution_id = state.execution_id
            if not execution_id:
                return
            
            # Save stream data
            node_name = state.current_node or "unknown"
            stream_type = event.get("type", "output")
            
            # Structure the content
            content = {
                "state": state.model_dump(),
                "event_type": event.get("type"),
                "timestamp": datetime.utcnow().isoformat(),
                "node_name": node_name,
                "data": self._serialize_workflow_data(event.get("data", {}))
            }
            
            await self._save_stream(execution_id, node_name, stream_type, content)
        except Exception as e:
            print(f"Error handling stream: {str(e)}")

    async def list_executions(
        self,
        status: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> List[models.WorkflowExecution]:
        """List workflow executions with optional filtering"""
        query = self.db.query(models.WorkflowExecution)
        
        # Apply status filter if provided
        if status:
            query = query.filter(models.WorkflowExecution.status == status)
            
        # Apply pagination
        query = query.order_by(models.WorkflowExecution.created_at.desc())
        query = query.offset(offset).limit(limit)
        
        return query.all() 