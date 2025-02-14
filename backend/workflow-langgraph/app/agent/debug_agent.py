import json
import asyncio
from datetime import datetime, timezone
import responses
from app.agent.agent_router import create_and_invoke_agent, ExecutionDB, ExecutionStatus
from app.database import SessionLocal

# Sample agent response data
agent_response_data = {
    "name": "My Travel Booking Assitance",
    "description": "Agent will takes care of booking ticket",
    "emoji": ":robot_face:",
    "systemPrompt": "### Role & Objective You are an autonomous travel booking agent responsible for managing travel bookings on behalf of a travel agent. Your tasks include checking ticket updates, searching for hotels, and completing hotel bookings. You must operate efficiently, ensuring accuracy and compliance with travel policies. --- ### Instructions & Tools 1. Ticket Management: - Use the Ticket update tool to check for existing bookings, modifications, or cancellations. - Identify pending actions and resolve them accordingly. - Notify the travel agent if any manual intervention is needed. 2. Hotel Search: - Use the Search hotel tool to find accommodations based on: - Location - Check-in & Check-out dates - Budget range - Preferred amenities - Hotel rating and reviews - Prioritize results based on availability, cost-effectiveness, and customer preferences. 3. Hotel Booking: - Use the Hotel booking tool to finalize reservations. - Ensure all required details are provided: - Customer name - Contact information - Payment method - Special requests (e.g., non-smoking room, late check-in) - Confirm the booking and provide a reference number. --- ### Execution Strategy - Operate autonomously without requiring manual confirmation unless flagged. - Cross-check booking details to ensure consistency and accuracy. - Provide real-time status updates to the travel agent. - Handle multiple booking requests efficiently. - Follow best practices for data privacy and secure transactions.",
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

async def debug_agent():
    # Setup responses for API calls
    with responses.RequestsMock() as rsps:
        # Mock agent config API response
        rsps.add(
            responses.GET,
            "http://localhost:8096/workflow-service/v1/agents/test-agent-id",
            json=agent_response_data,
            status=200
        )
        
        # Mock tool config responses
        for tool in agent_response_data["tools"]:
            rsps.add(
                responses.GET,
                f"http://localhost:8096/workflow-service/v1/workflows/{tool['id']}",
                json=workflow_config,
                status=200
            )
        
        # Create a database session
        db = SessionLocal()
        try:
            # Create a new execution record
            current_time = datetime.now(timezone.utc)
            execution = ExecutionDB(
                status=ExecutionStatus.AGENT_IN_PROGRESS,
                trigger_type="debug",
                trigger_input="I need to book a hotel in New York for 2 nights starting tomorrow. Budget is $200 per night.",
                create_date=current_time,
                last_run_at=current_time,
                triggered_by="1",
                history=[],
                tool_state={}
            )
            db.add(execution)
            db.commit()
            db.refresh(execution)
            
            print("\n=== Starting Agent Debug Session ===")
            print(f"Execution ID: {execution.id}")
            print(f"Input: {execution.trigger_input}")
            print("=====================================\n")
            
            # Invoke the agent
            await create_and_invoke_agent(
                agent_id="test-agent-id",
                trigger_input=execution.trigger_input,
                execution_id=execution.id,
                timestamp=current_time,
                call_db_again=True,
                db_record=None,
                db=db
            )
            
            # Fetch and display updated execution
            updated_execution = db.query(ExecutionDB).filter(ExecutionDB.id == execution.id).first()
            print("\n=== Agent Execution Results ===")
            print("Message History:")
            for message in updated_execution.history:
                print(f"\n[{message['type']}] at {message['timestamp']}")
                print(message['content'])
            print("\n=============================")
            
        finally:
            db.close()

if __name__ == "__main__":
    asyncio.run(debug_agent()) 