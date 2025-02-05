import { formatDistanceToNow } from 'date-fns';

export interface Tool {
  id: string;
  input: string;
  output: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  title: string;
  status: 'ongoing' | 'finished' | 'review_required';
  createdAt: string;
  triggeredBy: {
    name: string;
    avatar?: string;
  };
  messages: Array<{
    id: string;
    content: string;
    type: 'user' | 'agent' | 'system';
    timestamp: string;
    sender: {
      name: string;
      avatar?: string;
    };
    tool?: Tool;
  }>;
}

// Mock data
const mockExecutions: AgentExecution[] = [
  {
    id: '1',
    agentId: 'agent-1',
    title: 'Greeting',
    status: 'ongoing',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    triggeredBy: {
      name: 'Thamotharan K',
    },
    messages: [
      {
        id: 'm1',
        content: 'Hi',
        type: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        sender: {
          name: 'Thamotharan K'
        }
      },
      {
        id: 'm2',
        content: 'Hello! How can I assist you today?',
        type: 'agent',
        timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        sender: {
          name: 'Agent',
          avatar: 'https://cdn.jsdelivr.net/gh/RelevanceAI/content-cdn@latest/agents/agent_avatars/agent_avatar_15.svg'
        }
      }
    ]
  },
  {
    id: '2',
    agentId: 'agent-1',
    title: 'Simple Math Question',
    status: 'finished',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    triggeredBy: {
      name: 'Thamotharan K',
    },
    messages: []
  }
];

export const agentExecutionService = {
  getExecutions: async (agentId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockExecutions.filter(e => e.agentId === agentId);
  },

  getExecution: async (executionId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockExecutions.find(e => e.id === executionId);
  },

  createExecution: async (agentId: string, title: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newExecution: AgentExecution = {
      id: Math.random().toString(36).substring(7),
      agentId,
      title,
      status: 'ongoing',
      createdAt: new Date().toISOString(),
      triggeredBy: {
        name: 'Thamotharan K',
      },
      messages: []
    };
    mockExecutions.push(newExecution);
    return newExecution;
  }
}; 