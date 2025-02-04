import api from './apiService';
import type { Agent } from '@/features/Agents/types';

// Add headers configuration
const headers = {
    'x-user-id': '1',
    'x-workspace-id': '1'
};

const BASE_URL = 'http://localhost:8096/workflow-service/v1';

export const agentService = {
    getAgents: async (): Promise<Agent[]> => {
        try {
            const response = await api.get<Agent[]>(`${BASE_URL}/agents`, { headers });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAgent: async (agentId: string): Promise<Agent> => {
        try {
            const response = await api.get<Agent>(`${BASE_URL}/agents/${agentId}`, { headers });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createAgent: async (data: Omit<Agent, 'id'>) => {
        const response = await api.post(`${BASE_URL}/agents`, data, { headers });
        return response.data;
    },

    updateAgent: async (id: string, data: Partial<Agent>) => {
        const response = await api.put(`${BASE_URL}/agents/${id}`, data, { headers });
        return response.data;
    },

    deleteAgent: async (agentId: string): Promise<void> => {
        try {
            await api.delete(
                `${BASE_URL}/agents/${agentId}`,
                { headers }
            );
        } catch (error) {
            throw error;
        }
    }
}; 