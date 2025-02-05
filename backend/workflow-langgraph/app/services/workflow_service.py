from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
from .. import models, schemas
from ..orchestrator.workflow_orchestrator import WorkflowOrchestrator

class WorkflowService:
    def __init__(self, db: Session):
        self.db = db
        self.orchestrator = WorkflowOrchestrator()

    async def create_workflow(self, workflow_config: schemas.WorkflowConfig) -> models.WorkflowExecution:
        """Create and start a new workflow execution"""
        # Create workflow execution record
        db_workflow = models.WorkflowExecution(
            apps_execution_id=len(list(self.db.query(models.WorkflowExecution).all())) + 1,
            status="RUNNING",
            raw_execution_json=workflow_config.dict()
        )
        self.db.add(db_workflow)
        self.db.commit()
        self.db.refresh(db_workflow)

        # Start workflow execution in background
        await self.orchestrator.start_workflow(db_workflow.id, workflow_config)
        
        return db_workflow

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