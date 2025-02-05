from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from .. import models, schemas
from IPython.display import Image, display
from ..orchestrator.workflow_orchestrator import WorkflowOrchestrator

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

    async def create_workflow(self, workflow: schemas.Workflow, initial_inputs: Dict[str, Any] = None) -> models.WorkflowExecution:
        """Create a new workflow execution record and prepare the workflow"""
        try:
            # Create workflow execution record
            workflow_execution = models.WorkflowExecution(
                apps_execution_id=str(workflow.id),
                status="CREATED",
                raw_execution_json=workflow.model_dump(),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # self.db.add(workflow_execution)
            # self.db.commit()
            # self.db.refresh(workflow_execution)

            return workflow_execution

        except Exception as e:
            print(f"Error in create_workflow: {str(e)}")
            raise

    async def execute_workflow(self, workflow_execution: models.WorkflowExecution, workflow: schemas.Workflow, initial_inputs: Dict[str, Any] = None) -> models.WorkflowExecution:
        """Execute a prepared workflow"""
        try:
            workflow_execution.status = "RUNNING"
            workflow_execution.updated_at = datetime.utcnow()

            async with WorkflowOrchestrator() as orchestrator:
                # Step 1: Create the workflow graph
                graph = await orchestrator.create_workflow_graph(workflow.config.dict())

                # Initialize inputs if not provided
                if initial_inputs is None:
                    initial_inputs = {}
                    # Only set empty values if no initial inputs were provided
                    start_node = next((node for node in workflow.config.nodes if node['type'] == "start"), None)
                    if start_node:
                        for group in start_node['data']['groups']:
                            for field in group['fields']:
                                initial_inputs[field['variableName']] = ""

                # Step 2: Initialize workflow state
                initial_state = await orchestrator.initialize_workflow_state(
                    workflow_execution.id,
                    initial_inputs
                )

                print("\nInitial Inputs being passed to workflow:")
                print(initial_inputs)

                # Step 3: Execute the workflow
                result = await orchestrator.execute_workflow(
                    workflow_execution.id,
                    workflow.config.dict(),
                    initial_inputs
                )

                # Update workflow execution status
                workflow_execution.status = "COMPLETED"
                workflow_execution.raw_execution_json = {
                    "config": workflow.config.dict(),
                    "result": result.model_dump() if hasattr(result, 'model_dump') else result
                }

                if hasattr(result, 'error') and result.error:
                    workflow_execution.status = "ERROR"
                    workflow_execution.error_message = result.error

                return workflow_execution

        except Exception as e:
            print(f"Error in execute_workflow: {str(e)}")
            workflow_execution.status = "ERROR"
            workflow_execution.error_message = str(e)
            raise

    async def get_workflow_logs(self, apps_execution_id: int) -> schemas.WorkflowResponse:
        """Get logs for a specific workflow execution"""
        workflow = self.db.query(models.WorkflowExecution).filter(
            models.WorkflowExecution.apps_execution_id == apps_execution_id
        ).first()
        
        if not workflow:
            raise ValueError(f"Workflow execution {apps_execution_id} not found")

        steps = self.db.query(models.WorkflowExecutionStep).filter(
            models.WorkflowExecutionStep.execution_id == workflow.id
        ).all()

        return schemas.WorkflowResponse(
            id=workflow.id,
            apps_execution_id=workflow.apps_execution_id,
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
                "logs": step.logs,
                "traces": step.traces,
                "credits_used": step.credits_used
            } for step in steps]
        )

    async def log_step_execution(
        self, apps_execution_id: int, step: schemas.WorkflowStepCreate
    ) -> models.WorkflowExecutionStep:
        """Log a new step execution"""
        workflow = self.db.query(models.WorkflowExecution).filter(
            models.WorkflowExecution.apps_execution_id == apps_execution_id
        ).first()
        
        if not workflow:
            raise ValueError(f"Workflow execution {apps_execution_id} not found")

        db_step = models.WorkflowExecutionStep(
            execution_id=workflow.id,
            step_name=step.step_name,
            input_data=step.input_data,
            start_time=datetime.utcnow()
        )
        self.db.add(db_step)
        self.db.commit()
        self.db.refresh(db_step)
        
        return db_step

    async def update_step(
        self, apps_execution_id: int, step_id: int, step_update: schemas.WorkflowStepUpdate
    ) -> models.WorkflowExecutionStep:
        """Update a step execution (finish or error)"""
        workflow = self.db.query(models.WorkflowExecution).filter(
            models.WorkflowExecution.apps_execution_id == apps_execution_id
        ).first()
        
        if not workflow:
            raise ValueError(f"Workflow execution {apps_execution_id} not found")

        db_step = self.db.query(models.WorkflowExecutionStep).filter(
            models.WorkflowExecutionStep.step_id == step_id,
            models.WorkflowExecutionStep.execution_id == workflow.id
        ).first()
        
        if not db_step:
            raise ValueError(f"Step {step_id} not found in workflow {apps_execution_id}")

        for key, value in step_update.dict(exclude_unset=True).items():
            setattr(db_step, key, value)

        if step_update.finished:
            db_step.end_time = datetime.utcnow()

        self.db.commit()
        self.db.refresh(db_step)
        
        return db_step 