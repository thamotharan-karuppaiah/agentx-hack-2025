import json
import responses
from .agent_router import init_tools_definition

# Sample response data
response_data = {
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

# Sample workflow config response
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

# Mock the API responses
@responses.activate
def test_init_tools_definition():
    # Add mock responses for each tool
    for tool in response_data["tools"]:
        responses.add(
            responses.GET,
            f"http://localhost:8096/workflow-service/v1/workflows/{tool['id']}",
            json=workflow_config,
            status=200
        )
    
    # Call the function
    tools_definition = init_tools_definition(response_data)
    
    # Print the result
    print("\nGenerated Tool Definitions:")
    print(json.dumps(tools_definition, indent=2))

if __name__ == "__main__":
    test_init_tools_definition() 