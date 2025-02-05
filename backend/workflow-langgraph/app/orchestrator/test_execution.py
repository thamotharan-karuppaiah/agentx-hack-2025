import asyncio
from typing import Dict, Any
from .workflow_orchestrator import WorkflowOrchestrator
from .test_workflow import create_test_workflow
from ..schemas import Workflow, WorkflowConfig

async def execute_test_workflow():
    """Execute a test workflow using the WorkflowOrchestrator"""
    # Create workflow configuration
    workflow_config = create_test_workflow()
    
    # Create a test workflow object
    workflow = Workflow(
        id="test_workflow_1",
        name="Test Workflow",
        config=WorkflowConfig(**workflow_config)
    )
    
    # Initial inputs for the workflow
    initial_inputs = {
        "input_text": "Hello, this is a test input!"
    }
    
    try:
        # Initialize the orchestrator
        async with WorkflowOrchestrator() as orchestrator:
            # Build and execute the workflow
            execution_states = await orchestrator.execute_workflow(
                workflow_id=1,  # Test workflow ID
                workflow_config=workflow_config,
                initial_inputs=initial_inputs
            )
            
            print("\nExecution States:")
            for i, state in enumerate(execution_states):
                print(f"\nState {i + 1}:")
                print(f"Current Node: {state.get('current_node')}")
                print(f"Outputs: {state.get('node_outputs', {})}")
                if state.get('error'):
                    print(f"Error: {state.get('error')}")
            
            return execution_states
            
    except Exception as e:
        print(f"Error executing workflow: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(execute_test_workflow()) 