from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.orm import joinedload

from ..database import get_db
from ..models import WorkflowExecution, WorkflowExecutionStep, WorkflowExecutionStream
from ..schemas import WorkflowExecutionRead

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