from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, models
from ..services.workflow_service import WorkflowService

router = APIRouter()

@router.get("")  # Add a test endpoint
async def test_endpoint():
    return {"message": "Workflow router is working"}

@router.post("", response_model=schemas.WorkflowExecutionInDB)
async def create_workflow(
    workflow: schemas.Workflow,
    db: Session = Depends(get_db)
):
    """Create and execute a new workflow"""
    workflow_service = WorkflowService(db)
    return await workflow_service.create_workflow(workflow)

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