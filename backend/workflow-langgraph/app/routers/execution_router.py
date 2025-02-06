from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import WorkflowExecution
from ..schemas import WorkflowExecutionRead

router = APIRouter()

@router.get("/{execution_id}", response_model=WorkflowExecutionRead)
async def get_execution(execution_id: int, db: Session = Depends(get_db)):
    execution = db.query(WorkflowExecution).filter(WorkflowExecution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution 