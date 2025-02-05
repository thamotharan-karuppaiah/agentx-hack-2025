from typing import Dict, Any
from ..schemas import Workflow, WorkflowConfig, Position, NodeData

def create_test_workflow() -> Dict[str, Any]:
    """Create a test workflow configuration"""
    workflow_config = {
        "nodes": [
            {
                "id": "start_node",
                "type": "start",
                "data": {
                    "name": "Start",
                    "title": "Start Node",
                    "groups": [
                        {
                            "id": "group1",
                            "name": "Input Group",
                            "fields": [
                                {
                                    "id": "field1",
                                    "type": "text",
                                    "label": "Input Text",
                                    "variableName": "input_text",
                                    "required": True
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "id": "llm_node",
                "type": "llm",
                "data": {
                    "name": "LLM Node",
                    "title": "Process Text",
                    "systemPrompt": "You are a helpful assistant.",
                    "messages": []
                }
            },
            {
                "id": "end_node",
                "type": "end",
                "data": {
                    "name": "End",
                    "title": "End Node",
                    "outputType": "text"
                }
            }
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "start_node",
                "target": "llm_node"
            },
            {
                "id": "edge2",
                "source": "llm_node",
                "target": "end_node"
            }
        ]
    }
    
    return workflow_config