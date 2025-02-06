from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models import WorkflowExecution, WorkflowExecutionStep, WorkflowExecutionStream
from app.schemas import WorkflowExecutionRead
from app.services.workflow_service import WorkflowService
from app.orchestrator.workflow_orchestrator import WorkflowOrchestrator

router = APIRouter()

@router.get("/{execution_id}", response_model=WorkflowExecutionRead)
async def get_execution(execution_id: int, db: Session = Depends(get_db)):
    # Query execution with related steps and streams
    execution = (
        db.query(WorkflowExecution)
        .options(
            joinedload(WorkflowExecution.steps),
            joinedload(WorkflowExecution.streams)
        )
        .filter(WorkflowExecution.id == execution_id)
        .first()
    )
    
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return execution

@router.post("/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: int,
    initial_inputs: Dict[str, Any] = Body(default={}),
    db: Session = Depends(get_db)
):
    """Execute a workflow with the given inputs"""
    workflow_service = WorkflowService(db)
    try:
        # Get workflow configuration
        workflow = await workflow_service.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
        
        # Create workflow execution record
        execution = await workflow_service.create_workflow(workflow, initial_inputs)
        
        # Initialize orchestrator with database session
        orchestrator = WorkflowOrchestrator(db)
        
        # Execute workflow
        result = await orchestrator.execute_workflow(
            workflow_id=workflow_id,
            workflow_config=workflow.config.model_dump(),
            execution_id=execution.id,
            initial_inputs=initial_inputs
        )
        
        # Update execution record with results
        await workflow_service.update_execution(
            execution_id=execution.id,
            status="COMPLETED",
            result=result["result"],
            node_executions=result["node_executions"]
        )
        
        return {
            "execution_id": result["execution_id"],
            "result": result["result"],
            "node_executions": result["node_executions"]
        }
        
    except Exception as e:
        # Update execution record with error if it exists
        if 'execution' in locals():
            await workflow_service.update_execution(
                execution_id=execution.id,
                status="FAILED",
                error=str(e)
            )
        raise HTTPException(status_code=500, detail=str(e)) 