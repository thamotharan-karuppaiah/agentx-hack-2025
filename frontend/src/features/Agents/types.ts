export interface Agent {
    id: string;
    name: string;
    description: string;
    emoji: string;
    tools: {
        id: string,
        name: string,
        icon: string,
        approvalMode: "required" | "none" | "optional",
        maxApprovals: number,
        prompt: string
    }[];
    triggers: {
        type: string,
        config: any
    }[];
    lastRunDate: string;
    lastModified: string;
    created: string;
    tasksDone: number;
    systemPrompt: string;
    actions: AgentAction[];
    workspaceId: string;
    createdBy: string;
    connectedAgents?: Array<{
        id: string;
        name: string;
    }>;
}

export interface AgentAction {
    id: string;
    title: string;
    description: string;
} 