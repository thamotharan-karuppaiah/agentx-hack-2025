import { formatDistanceToNow } from 'date-fns';
import api from './apiService';

const BASE_URL = 'https://f1cf-13-234-188-229.ngrok-free.app';

const headers = {
  'x-user-id': '1',
  'x-workspace-id': '1'
};

export interface Tool {
  id: string;
  input: string;
  output: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  title: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
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

// Mock data generator
const generateMockExecution = (id: string, agentId: string): AgentExecution => ({
  id,
  agentId,
  title: `Task ${id}`,
  status: ['running', 'completed', 'failed', 'pending'][Math.floor(Math.random() * 4)] as AgentExecution['status'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  triggeredBy: {
    name: 'Thamotharan K',
  },
  messages: []
});

export const agentExecutionService = {
  getExecutions: async (agentId: string): Promise<AgentExecution[]> => {
    // Mock response
    return Array.from({ length: 5 }, (_, i) =>
      generateMockExecution(`exec-${i}`, agentId)
    );
  },

  getExecution: async (executionId: string): Promise<AgentExecution> => {
    // Mock response
    return generateMockExecution(executionId, 'mock-agent-id');
  },

  createExecution: async (agentId: string, title: string): Promise<AgentExecution> => {
    // Mock response
    return {
      id: `exec-${Date.now()}`,
      agentId,
      title,
      status: 'running',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggeredBy: {
        name: 'Thamotharan K',
      },
      messages: []
    };
  }
}; 