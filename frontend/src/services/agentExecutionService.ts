import { formatDistanceToNow } from 'date-fns';
import api from './apiService';

const BASE_URL = 'http://localhost:8000';

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
  status: 'AGENT_IN_PROGRESS' | 'CLOSED' | 'TOOL_IN_PROGRESS' | 'IDLE' | 'TOOL_REVIEW';
  result?: any;
  error?: string;
  create_date: string;
  last_run_at: string;
  updatedAt: string;
  triggered_by: string;
  trigger_type: string;
  tool_state?: {
    [key: string]: any;
  };
  history: Array<{
    content: string;
    type: 'human' | 'assistant' | 'system';
    timestamp: string;
    tool?: Tool;
  }>;
}

// Mock data generator
const generateMockExecution = (id: string, agentId: string): AgentExecution => ({
  id,
  agentId,
  title: `Task ${id}`,
  status: ['running', 'completed', 'failed', 'pending'][Math.floor(Math.random() * 4)] as AgentExecution['status'],
  create_date: new Date().toISOString(),
  last_run_at: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  triggeredBy: 'Agent',
  history: []
});

export const agentExecutionService = {
  getExecutions: async (agentId: string): Promise<AgentExecution[]> => {
    const response = await api.get(`${BASE_URL}/agent/${agentId}/executions`, { headers });
    return response.data;
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
      create_date: new Date().toISOString(),
      last_run_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggeredBy: 'Agent',
        history: []
    };
  },

  createNewExecution: async (agentId: string, message: string): Promise<AgentExecution> => {
    try {
      const response = await api.post(
        `${BASE_URL}/agent/${agentId}/createExecution`,
        {
          trigger_input: message,
          trigger_type: "manual",
          triggered_by: "1"
        },
        { headers }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  continueExecution: async (agentId: string, executionId: string, message: string): Promise<AgentExecution> => {
    try {
      const response = await api.post(
        `${BASE_URL}/agent/${agentId}/continueChat/${executionId}`,
        {
          trigger_input: message,
          trigger_type: "manual",
          triggered_by: "1"
        },
        { headers }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteExecution: async (executionId: string): Promise<void> => {
    try {
      await api.delete(`${BASE_URL}/agent/${executionId}`, { headers });
    } catch (error) {
      throw error;
    }
  },
}; 