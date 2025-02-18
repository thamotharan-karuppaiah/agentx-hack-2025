from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional
from ..database import get_db
from .. import schemas, models
from ..services.workflow_service import WorkflowService
import json
from datetime import datetime
from fastapi import BackgroundTasks
import httpx

router = APIRouter()

@router.get("/test")  # Move test endpoint to /test
async def test_endpoint():
    return {"message": "Workflow router is working"}


@router.post("")  # Root POST endpoint for workflow creation
async def create_workflow(
    workflow: schemas.Workflow,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    initial_inputs: Dict[str, Any] = None
):
    """Create and execute a new workflow"""
    workflow_service = WorkflowService(db)
    try:
        # Step 1: Create the workflow execution record
        workflow_execution = await workflow_service.create_workflow(workflow, initial_inputs)
        print(f"Created workflow execution with ID: {workflow_execution.id}")
        
        # Step 2: Start workflow execution in background
        # Create a new service instance for background task to ensure proper DB session
        background_service = WorkflowService(db)
        background_tasks.add_task(
            background_service.execute_workflow,
            workflow_execution,
            workflow,
            initial_inputs
        )
        print(f"Added workflow execution to background tasks")
        
        # Return immediately with execution ID and initial status
        return {
            "execution_id": workflow_execution.id,
            "status": "CREATED",
            "message": "Workflow execution started",
            "links": {
                "status": f"/executions/{workflow_execution.id}",
                "streams": f"/executions/{workflow_execution.id}/streams"
            }
        }
    except Exception as e:
        print(f"Error creating workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/executions")
async def list_executions(
    status: Optional[str] = Query(None, description="Filter by status (CREATED, RUNNING, COMPLETED, ERROR)"),
    limit: int = Query(10, description="Number of executions to return"),
    offset: int = Query(0, description="Number of executions to skip"),
    db: Session = Depends(get_db)
):
    """List all workflow executions with optional filtering"""
    workflow_service = WorkflowService(db)
    executions = await workflow_service.list_executions(status=status, limit=limit, offset=offset)
    return [
        {
            "execution_id": execution.id,
            "apps_execution_id": execution.apps_execution_id,
            "status": execution.status,
            "created_at": execution.created_at,
            "updated_at": execution.updated_at
        }
        for execution in executions
    ]

@router.get("/executions/{execution_id}")
async def get_workflow_execution(
    execution_id: int,
    include_streams: bool = Query(False, description="Include streaming data in response"),
    db: Session = Depends(get_db)
):
    """Get detailed workflow execution status and results"""
    workflow_service = WorkflowService(db)
    try:
        execution = await workflow_service.get_execution(execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")

        # Get steps and streams
        logs = await workflow_service.get_workflow_logs(execution_id)
        
        # Calculate execution progress
        total_steps = len(logs.data) if logs.data else 0
        completed_steps = len([step for step in logs.data if step.get("finished")]) if logs.data else 0
        current_step = next((step["name"] for step in reversed(logs.data) if not step.get("finished")), None) if logs.data else None
        has_errors = any(step.get("error") for step in logs.data) if logs.data else False

        response = {
            "execution_id": execution.id,
            "status": execution.status,
            "created_at": execution.created_at,
            "updated_at": execution.updated_at,
            "execution_progress": {
                "total_steps": total_steps,
                "completed_steps": completed_steps,
                "current_step": current_step,
                "percentage": (completed_steps / total_steps * 100) if total_steps > 0 else 0,
                "has_errors": has_errors
            },
            "steps": [{
                "name": step["name"],
                "status": "COMPLETED" if step.get("finished") else "RUNNING" if step["name"] == current_step else "PENDING",
                "error": step.get("error"),
                "start_time": step.get("start_time"),
                "end_time": step.get("end_time"),
                "duration": (step["end_time"] - step["start_time"]).total_seconds() if step.get("end_time") and step.get("start_time") else None,
                "input": step.get("input"),
                "output": step.get("output") if step.get("finished") else None,
                "logs": step.get("logs", []),
                "traces": step.get("traces", []),
                "messages": step.get("messages", []),
                "tools": step.get("tools", [])
            } for step in logs.data] if logs.data else []
        }

        if include_streams:
            # Group streams by node and type for better organization
            streams_by_node = {}
            for stream in logs.streams:
                node_name = stream["node_name"]
                if node_name not in streams_by_node:
                    streams_by_node[node_name] = {
                        "node_name": node_name,
                        "messages": [],
                        "tools": [],
                        "other": []
                    }
                
                content = stream["content"]
                if isinstance(content, dict):
                    if content.get("type") in ["human_message", "ai_message", "system_message"]:
                        streams_by_node[node_name]["messages"].append({
                            "type": content["type"],
                            "content": content.get("content"),
                            "timestamp": stream["timestamp"],
                            "metadata": content.get("metadata", {})
                        })
                    elif content.get("type") == "tool_call":
                        streams_by_node[node_name]["tools"].append({
                            "tool_name": content.get("tool_name"),
                            "inputs": content.get("inputs"),
                            "outputs": content.get("outputs"),
                            "timestamp": stream["timestamp"],
                            "status": content.get("status"),
                            "error": content.get("error")
                        })
                    else:
                        streams_by_node[node_name]["other"].append({
                            "type": stream["stream_type"],
                            "content": content,
                            "timestamp": stream["timestamp"]
                        })
                else:
                    streams_by_node[node_name]["other"].append({
                        "type": stream["stream_type"],
                        "content": content,
                        "timestamp": stream["timestamp"]
                    })
            
            response["streams"] = list(streams_by_node.values())

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/executions/{execution_id}/streams")
async def get_workflow_streams(
    execution_id: int,
    node_name: Optional[str] = Query(None, description="Filter streams by node name"),
    stream_type: Optional[str] = Query(None, description="Filter streams by type (input, output, error)"),
    db: Session = Depends(get_db)
):
    """Get streaming data for a workflow execution with optional filtering"""
    workflow_service = WorkflowService(db)
    try:
        # First check if execution exists
        execution = await workflow_service.get_execution(execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")

        # Then get streams
        result = await workflow_service.get_workflow_logs(execution_id)
        streams = result.streams
        
        # Apply filters if provided
        if node_name:
            streams = [s for s in streams if s["node_name"] == node_name]
        if stream_type:
            streams = [s for s in streams if s["stream_type"] == stream_type]
            
        return {
            "execution_id": execution.id,
            "status": execution.status,
            "total_streams": len(streams),
            "streams": streams
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@router.post("/{workflow_id}/sync")
async def execute_workflow_sync(
    workflow_id: str,
    db: Session = Depends(get_db),
    initial_inputs: Dict[str, Any] = None
):
    url = f"http://localhost:8096/workflow-service/v1/workflows/{workflow_id}"
    headers = {
        "x-workspace-id": "1",
        "x-user-id": "2"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch workflow")

    workflow = schemas.Workflow(**response.json())  # Convert dict to Pydantic model

    print(f"workflow: {workflow}")
    """Execute a workflow synchronously and return the result"""
    workflow_service = WorkflowService(db)
    try:
        # Create and execute the workflow synchronously
        workflow_execution = await workflow_service.create_workflow(workflow, initial_inputs)
        result = await workflow_service.execute_workflow_sync(workflow_execution, workflow, initial_inputs)
        
        # The result from orchestrator contains the actual graph execution result
        return {
            "execution_id": workflow_execution.id,
            "status": "COMPLETED",
            "result": result.get("result", {}),  # Graph execution result
            "node_executions": result.get("node_executions", []),  # Individual node results
            "error": None
        }
    except Exception as e:
        print(f"Error executing workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/executions/{execution_id}/steps")
async def get_execution_steps(
    execution_id: int,
    include_details: bool = Query(False, description="Include detailed step data like logs, traces, etc."),
    db: Session = Depends(get_db)
):
    """Get detailed progress of workflow execution steps"""
    workflow_service = WorkflowService(db)
    try:
        # Verify execution exists
        execution = await workflow_service.get_execution(execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")
        
        # Get all steps for this execution
        steps = db.query(models.WorkflowExecutionStep).filter(
            models.WorkflowExecutionStep.execution_id == execution_id
        ).order_by(models.WorkflowExecutionStep.start_time).all()
        
        # Calculate execution progress
        total_steps = len(steps)
        completed_steps = len([step for step in steps if step.finished])
        current_step = next((step.step_name for step in steps if not step.finished), None)
        
        response = {
            "execution_id": execution_id,
            "status": execution.status,
            "progress": {
                "total_steps": total_steps,
                "completed_steps": completed_steps,
                "current_step": current_step,
                "percentage": (completed_steps / total_steps * 100) if total_steps > 0 else 0,
                "has_errors": any(step.error_message for step in steps)
            },
            "steps": []
        }
        
        # Build step details
        for step in steps:
            step_info = {
                "step_id": step.step_id,
                "name": step.step_name,
                "status": "COMPLETED" if step.finished else "RUNNING" if step.step_name == current_step else "PENDING",
                "start_time": step.start_time,
                "end_time": step.end_time,
                "duration": (step.end_time - step.start_time).total_seconds() if step.end_time and step.start_time else None,
                "error": step.error_message
            }
            
            if include_details:
                step_info.update({
                    "input_data": step.input_data,
                    "output_data": step.output_data,
                    "logs": step.logs or [],
                    "traces": step.traces or [],
                    "messages": step.messages or [],
                    "tools": step.tools or []
                })
            
            response["steps"].append(step_info)
        
        # Add timing information with safety checks
        steps_with_start_time = [step for step in steps if step.start_time is not None]
        steps_with_end_time = [step for step in steps if step.end_time is not None]
        
        response["timing"] = {
            "started_at": min(step.start_time for step in steps_with_start_time) if steps_with_start_time else None,
            "completed_at": max(step.end_time for step in steps_with_end_time) if steps_with_end_time and completed_steps == total_steps else None,
            "total_duration": sum(
                (step.end_time - step.start_time).total_seconds() 
                for step in steps 
                if step.end_time and step.start_time
            ) if steps_with_end_time else 0
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))