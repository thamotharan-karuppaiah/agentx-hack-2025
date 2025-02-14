import json
import pytest
import responses
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
from app.agent.agent_router import create_and_invoke_agent, ExecutionDB, ExecutionStatus
from langchain_core.messages import AIMessage

# Sample agent response data
agent_response_data = {
    "name": "My Travel Booking Assitance",
    "description": "Agent will takes care of booking ticket",
    "emoji": ":robot_face:",
    "systemPrompt": "### Role & Objective You are an autonomous travel booking agent...",
    "tools": [
        {
            "id": "67a43ed80c44279c06c36f82",
            "name": "Hotel booking tool",
            "icon": ":arrows_counterclockwise:",
            "approvalMode": "required",
            "maxApprovals": "no-limit",
            "prompt": "Defaults to: \"Completes a Hotel booking tool and returns the results.\"",
            "_id": "67a4c787f13bcbe061e47e1c"
        },
        {
            "id": "67a4811f0c44279c06c374a5",
            "name": "Search hotel",
            "icon": ":arrows_counterclockwise:",
            "approvalMode": "required",
            "maxApprovals": "no-limit",
            "prompt": "Defaults to: \"Completes a Search hotel and returns the results.\"",
            "_id": "67a4c787f13bcbe061e47e1d"
        },
        {
            "id": "67a4aeb0f13bcbe061e47c09",
            "name": "Ticket update tool",
            "icon": ":arrows_counterclockwise:",
            "approvalMode": "required",
            "maxApprovals": "no-limit",
            "prompt": "Defaults to: \"Completes a Ticket update tool and returns the results.\"",
            "_id": "67a4c787f13bcbe061e47e1e"
        }
    ]
}

# Sample workflow config for tools
workflow_config = {
    "_id": "67a34a29aa308a33af2702b7",
    "config": {
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "data": {
                    "name": "start",
                    "title": "Start",
                    "groups": [
                        {
                            "id": "group-1738754737045",
                            "name": "",
                            "fields": [
                                {
                                    "id": "field-1738754764762",
                                    "type": "short_text",
                                    "label": "FirstName",
                                    "variableName": "firstname",
                                    "hint": "",
                                    "placeholder": "",
                                    "required": True
                                },
                                {
                                    "id": "field-1738779872090",
                                    "type": "short_text",
                                    "label": "Second Name",
                                    "variableName": "second_name",
                                    "hint": "",
                                    "placeholder": "",
                                    "required": False
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    }
}

@pytest.fixture
def mock_db():
    db = Mock(spec=Session)
    return db

@pytest.fixture
def mock_execution_db():
    current_time = datetime.now(timezone.utc)
    return ExecutionDB(
        id=1,
        status=ExecutionStatus.AGENT_IN_PROGRESS,
        trigger_type="test",
        trigger_input="Book a hotel",
        create_date=current_time,
        last_run_at=current_time,
        triggered_by="1",
        history=[],
        tool_state={}
    )

@responses.activate
@patch('app.agent.agent_router.init_llm')
@patch('app.agent.agent_router.create_react_agent')
@pytest.mark.asyncio
async def test_create_and_invoke_agent(mock_create_react_agent, mock_init_llm, mock_db, mock_execution_db):
    # Mock the agent response
    mock_agent_response = {
        'messages': [
            AIMessage(
                content="I'll help you book a hotel.",
                response_metadata={'timestamp': datetime.now(timezone.utc).isoformat()}
            )
        ]
    }
    
    # Setup mock agent
    mock_agent = Mock()
    mock_agent.invoke.return_value = mock_agent_response
    mock_create_react_agent.return_value = mock_agent
    
    # Mock LLM
    mock_llm = Mock()
    mock_init_llm.return_value = mock_llm
    
    # Mock API responses
    responses.add(
        responses.GET,
        "http://localhost:8096/workflow-service/v1/agents/test-agent-id",
        json=agent_response_data,
        status=200
    )
    
    # Mock tool config responses
    for tool in agent_response_data["tools"]:
        responses.add(
            responses.GET,
            f"http://localhost:8096/workflow-service/v1/workflows/{tool['id']}",
            json=workflow_config,
            status=200
        )
    
    # Mock database operations
    mock_db.query.return_value.filter.return_value.first.return_value = mock_execution_db
    
    # Test the function
    await create_and_invoke_agent(
        agent_id="test-agent-id",
        trigger_input="Book a hotel",
        execution_id=1,
        timestamp=datetime.now(timezone.utc),
        call_db_again=True,
        db_record=None,
        db=mock_db
    )
    
    # Assertions
    assert mock_create_react_agent.called
    assert mock_agent.invoke.called
    assert mock_db.commit.called
    assert mock_db.refresh.called
    
    # Verify the history was updated
    assert len(mock_execution_db.history) == 2  # Should have input message and response
    assert mock_execution_db.history[0]['type'] == 'human'
    assert mock_execution_db.history[1]['type'] == 'assistant'

if __name__ == "__main__":
    pytest.main([__file__]) 