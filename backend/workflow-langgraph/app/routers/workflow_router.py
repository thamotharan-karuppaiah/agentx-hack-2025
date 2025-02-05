from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, Dict, List
from ..database import get_db
from .. import schemas, models
from ..services.workflow_service import WorkflowService
import json

router = APIRouter()

@router.get("")  # Add a test endpoint
async def test_endpoint():
    return {"message": "Workflow router is working"}

@router.post("", response_model=schemas.WorkflowExecutionInDB)
async def create_workflow(
    workflow: schemas.Workflow,
    initial_inputs: Dict[str, Any] = None,
    db: Session = Depends(get_db)
):
    """Create and execute a new workflow"""
    workflow_service = WorkflowService(db)
    
    # Step 1: Create the workflow execution record
    workflow_execution = await workflow_service.create_workflow(workflow, initial_inputs)
    
    # Step 2: Execute the workflow
    return await workflow_service.execute_workflow(workflow_execution, workflow, initial_inputs)

@router.post("/{workflow_id}/execute", response_model=schemas.WorkflowExecutionInDB)
async def execute_workflow(
    workflow_id: int,
    initial_inputs: Dict[str, Any] = None,
    db: Session = Depends(get_db)
):
    """Execute an existing workflow"""
    workflow_service = WorkflowService(db)
    
    # Get the existing workflow execution
    workflow_execution = db.query(models.WorkflowExecution).filter(
        models.WorkflowExecution.apps_execution_id == str(workflow_id)
    ).first()
    
    if not workflow_execution:
        raise HTTPException(
            status_code=404,
            detail=f"Workflow execution {workflow_id} not found"
        )
    
    # Get the workflow configuration
    workflow = schemas.Workflow(
        id=workflow_id,
        config=json.loads(workflow_execution.raw_execution_json)
    )
    
    # Execute the workflow
    return await workflow_service.execute_workflow(workflow_execution, workflow, initial_inputs)

@router.get("/workflows/{apps_execution_id}/logs", response_model=schemas.WorkflowResponse)
async def get_workflow_logs(
    apps_execution_id: int,
    db: Session = Depends(get_db)
):
    """Get logs for a specific workflow execution"""
    workflow_service = WorkflowService(db)
    return await workflow_service.get_workflow_logs(apps_execution_id)

@router.post("/workflows/{apps_execution_id}/steps", response_model=schemas.WorkflowStepInDB)
async def log_step_execution(
    apps_execution_id: int,
    step: schemas.WorkflowStepCreate,
    db: Session = Depends(get_db)
):
    """Log a new step execution"""
    workflow_service = WorkflowService(db)
    return await workflow_service.log_step_execution(apps_execution_id, step)

@router.put("/workflows/{apps_execution_id}/steps/{step_id}", response_model=schemas.WorkflowStepInDB)
async def update_step(
    apps_execution_id: int,
    step_id: int,
    step_update: schemas.WorkflowStepUpdate,
    db: Session = Depends(get_db)
):
    """Update a step execution (finish or error)"""
    workflow_service = WorkflowService(db)
    return await workflow_service.update_step(apps_execution_id, step_id, step_update) 