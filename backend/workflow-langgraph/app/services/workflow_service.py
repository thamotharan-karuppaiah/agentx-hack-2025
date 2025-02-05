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

    def build_workflow_graph(self, workflow_config: schemas.WorkflowConfig) -> StateGraph:
        """Build a StateGraph from workflow configuration"""
        workflow = StateGraph(WorkflowState)
        
        # First check for start node
        try:
            start_node = next(node.id for node in workflow_config.nodes if node.type == "start")
        except StopIteration:
            raise ValueError("No start node found in workflow configuration")
        
        # Add nodes with type-specific functions
        for node in workflow_config.nodes:
            if node.type == "start":
                def node_function(state: WorkflowState):
                    state["current_node"] = node.id
                    state["output"][node.id] = {"type": "start", "status": "executed"}
                    return state
            
            elif node.type == "code":
                def node_function(state: WorkflowState):
                    state["current_node"] = node.id
                    result = self.code_handler.execute(state, node.data.code)
                    state["output"][node.id] = {
                        "type": "code",
                        "result": result,
                        "status": "executed"
                    }
                    return state
            
            elif node.type == "llm":
                def node_function(state: WorkflowState):
                    state["current_node"] = node.id
                    result = self.llm_handler.execute(state, node.data.prompt)
                    state["output"][node.id] = {
                        "type": "llm",
                        "result": result,
                        "status": "executed"
                    }
                    return state
            
            elif node.type == "api":
                def node_function(state: WorkflowState):
                    state["current_node"] = node.id
                    result = self.api_handler.execute(state, node.data.endpoint)
                    state["output"][node.id] = {
                        "type": "api",
                        "result": result,
                        "status": "executed"
                    }
                    return state
            
            elif node.type == "end":
                def node_function(state: WorkflowState):
                    state["current_node"] = node.id
                    state["output"][node.id] = {"type": "end", "status": "executed"}
                    return state
            
            workflow.add_node(node.id, node_function)

        # Add edges
        for edge in workflow_config.edges:
            workflow.add_edge(edge.source, edge.target)

        # Connect end node to END state
        end_node = next(node.id for node in workflow_config.nodes if node.type == "end")
        workflow.add_edge(end_node, END)

        # Set entry point
        workflow.set_entry_point(start_node)

        # Print detailed graph structure
        print("\nDetailed Workflow Graph Structure:")
        print("--------------------------------")
        print("Nodes:")
        for node_id, node_func in workflow.nodes.items():
            node_type = next((n.type for n in workflow_config.nodes if n.id == node_id), "system")
            print(f"  {node_id}:")
            print(f"    Type: {node_type}")
            print(f"    Function: {node_func}")
        
        print("\nEdges:")
        for edge in workflow.edges:
            print(f"  {edge[0]} -> {edge[1]}")
        
        print(f"\nEntry Point: {workflow.entry_point}")
        print("--------------------------------\n")
        # Setting xray to 1 will show the internal structure of the nested graph
        return workflow.compile()

    async def create_workflow(self, workflow: schemas.Workflow) -> models.WorkflowExecution:
        """Create and execute a new workflow"""
        try:
            # Create workflow execution record
            workflow_execution = models.WorkflowExecution(
                apps_execution_id=str(workflow.id),
                status="RUNNING",
                raw_execution_json=workflow.model_dump(),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # self.db.add(workflow_execution)
            # self.db.commit()
            # self.db.refresh(workflow_execution)

            # Execute workflow using orchestrator
            async with WorkflowOrchestrator() as orchestrator:
                # Fix: Access dictionary key with ['type'] instead of .type
                start_node = next((node for node in workflow.config.nodes if node['type'] == "start"), None)
                initial_inputs = {}
                if start_node:
                    for group in start_node['data']['groups']:
                        for field in group['fields']:
                            initial_inputs[field['variableName']] = ""

                # Execute workflow
                execution_states = await orchestrator.execute_workflow(
                    workflow_execution.id,
                    workflow.config.dict(),
                    initial_inputs
                )

                # Update workflow execution status
                workflow_execution.status = "COMPLETED"
                workflow_execution.raw_execution_json = {
                    "config": workflow.config.dict(),
                    "execution_states": execution_states
                }

                if any(state.get("error") for state in execution_states):
                    workflow_execution.status = "ERROR"
                    workflow_execution.error_message = next(
                        state["error"] for state in execution_states if state.get("error")
                    )

                # self.db.commit()
                return workflow_execution

        except Exception as e:
            if workflow_execution:
                workflow_execution.status = "ERROR"
                workflow_execution.error_message = str(e)
                self.db.commit()
            print(f"Error in create_workflow: {str(e)}")
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