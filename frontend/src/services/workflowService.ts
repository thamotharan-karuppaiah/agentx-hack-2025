import api from './apiService';
import type { Workflow, CreateWorkflowPayload, WorkflowConfig } from '@/features/Workflow/types';

// Add headers configuration
const headers = {
    'x-user-id': '1',
    'x-workspace-id': '1',
    'ngrok-skip-browser-warning': 'false'
};

const BASE_URL = 'http://localhost:8096/workflow-service/v1';
// const BASE_URL = 'https://0a50-182-73-13-166.ngrok-free.app/workflow-service/v1';

// // Mock data for development
// const mockWorkflows: Workflow[] = [
//     {
//         id: "1",
//         name: "Write Article Content Brief",
//         description: "Workflow for generating article content briefs",
//         createdBy: "user123",
//         config: {
//             nodes: [],
//             edges: [],
//         },
//         currentVersion: 1,
//         status: 'published',
//         uuid: "abc-123",
//         workspaceId: "12345",
//         public: false,
//         color: "blue",
//         emoji: "📝",
//         readme: "",
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         totalRuns: 0,
//         linkedGrids: 0,
//         lastEdited: new Date().toISOString()
//     },
//     {
//         id: "2",
//         name: "Content Generation",
//         description: "AI content generation workflow",
//         createdBy: "user123",
//         config: {
//             nodes: [],
//             edges: []
//         },
//         currentVersion: 0,
//         status: 'draft',
//         uuid: "def-456",
//         workspaceId: "12345",
//         public: false,
//         color: "green",
//         emoji: "🤖",
//         readme: "",
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         totalRuns: 0,
//         linkedGrids: 0,
//         lastEdited: new Date().toISOString()
//     }
// ];

export const workflowService = {
    getWorkflows: async (): Promise<Workflow[]> => {
        try {
            const response = await api.get<Workflow[]>(`${BASE_URL}/workflows`, { headers });
            return response.data;
        } catch (error) {
            // throw error
            throw error;
        }
    },

    getWorkflow: async (workflowId: string): Promise<Workflow> => {
        try {
            const response = await api.get<Workflow>(`${BASE_URL}/workflows/${workflowId}`, { headers });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createWorkflow: async (payload: CreateWorkflowPayload): Promise<Workflow> => {
        try {
            const response = await api.post<Workflow>(`${BASE_URL}/workflows`, payload, { headers });
            return response.data;
        } catch (error) {
            throw error;
            // // Return mock created workflow
            // return {
            //     id: Date.now().toString(),
            //     name: payload.name,
            //     description: payload.description,
            //     createdBy: "user123",
            //     config: {
            //         nodes: [],
            //         edges: []
            //     },
            //     currentVersion: 0,
            //     status: 'draft',
            //     uuid: require('crypto').randomUUID(),
            //     workspaceId: payload.workspaceId,
            //     public: payload.public || false,
            //     color: payload.color || "blue",
            //     emoji: payload.emoji || "📋",
            //     readme: "",
            //     createdAt: new Date().toISOString(),
            //     updatedAt: new Date().toISOString(),
            //     totalRuns: 0,
            //     linkedGrids: 0,
            //     lastEdited: new Date().toISOString()
            // };
        }
    },

    updateWorkflow: async (workflowId: string, payload: Partial<Workflow>): Promise<Workflow> => {
        try {
            const response = await api.patch<Workflow>(
                `${BASE_URL}/workflows/${workflowId}`,
                payload,
                { headers }
            );
            return response.data;
        } catch (error) {
            throw error;
            // // Return mock updated workflow
            // const workflow = mockWorkflows.find(w => w.id === workflowId);
            // if (!workflow) throw new Error('Workflow not found');
            // return {
            //     ...workflow,
            //     ...payload,
            //     updatedAt: new Date().toISOString()
            // };
        }
    },

    deleteWorkflow: async (workflowId: string): Promise<void> => {
        try {
            await api.delete(
                `${BASE_URL}/workflows/${workflowId}`,
                { headers }
            );
        } catch (error) {
            throw error;
            // // Suppress error in development
            // console.log('Workflow deleted (mock)');
        }
    },

    runWorkflow: async (workflowId: string): Promise<void> => {
        try {
            await api.post(`${BASE_URL}/workflows/${workflowId}/run`, {}, { headers });
        } catch (error) {
            // Suppress error in development
            console.log('Workflow run started (mock)');
        }
    },

    getLinkedSheets: async (workflowId: string): Promise<{ id: string; name: string; }[]> => {
        try {
            const response = await api.get(`${BASE_URL}/workflows/${workflowId}/sheets`, { headers });
            return response.data;
        } catch (error) {
            // Return mock linked sheets
            return [
                { id: '1', name: 'Sheet 1' },
                { id: '2', name: 'Sheet 2' }
            ];
        }
    },

    duplicateWorkflow: async (workflowId: string): Promise<Workflow> => {
        try {
            const response = await api.post<Workflow>(
                `${BASE_URL}/workflows/${workflowId}/duplicate`,
                {},
                { headers }
            );
            return response.data;
        } catch (error) {
            throw error;
            // // Return mock duplicated workflow
            // const workflow = mockWorkflows.find(w => w.id === workflowId);
            // if (!workflow) throw new Error('Workflow not found');
            // return {
            //     ...workflow,
            //     id: Date.now().toString(),
            //     name: `${workflow.name} (Copy)`,
            // };
        }
    },

    getWorkflowConfig: async (workflowId: string): Promise<WorkflowConfig | null> => {
        try {
            const response = await api.get<Workflow>(`${BASE_URL}/workflows/${workflowId}`, { headers });
            return response.data.config;
        } catch (error) {
            // For development, try to get from localStorage
            const savedConfig = localStorage.getItem(`workflow-config-${workflowId}`);
            if (!savedConfig) {
                console.log('No saved configuration found');
                return null;
            }

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            return JSON.parse(savedConfig);
        }
    },

    saveWorkflowConfig: async (workflowId: string, config: WorkflowConfig): Promise<boolean> => {
        try {
            await api.patch<Workflow>(
                `${BASE_URL}/workflows/${workflowId}`,
                { config },
                { headers }
            );
            return true;
        } catch (error) {
            // For development, save to localStorage
            localStorage.setItem(`workflow-config-${workflowId}`, JSON.stringify(config));

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('Workflow configuration saved successfully');
            return true;
        }
    },

    publishWorkflow: async (workflowId: string): Promise<Workflow> => {
        try {
            const response = await api.post<Workflow>(
                `${BASE_URL}/workflows/${workflowId}/publish`,
                {},
                { headers }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getWorkflowVersions: async (workflowId: string): Promise<any[]> => {
        try {
            const response = await api.get(
                `${BASE_URL}/workflows/${workflowId}/versions`,
                { headers }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getWorkflowVersion: async (workflowId: string, versionId: string): Promise<any> => {
        try {
            const response = await api.get(
                `${BASE_URL}/workflows/${workflowId}/versions/${versionId}`,
                { headers }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    restoreVersion: async (workflowId: string, versionId: string): Promise<Workflow> => {
        try {
            const response = await api.post<Workflow>(
                `${BASE_URL}/workflows/${workflowId}/versions/${versionId}/restore`,
                {},
                { headers }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    setDefaultVersion: async (workflowId: string, versionId: string): Promise<Workflow> => {
        try {
            const response = await api.post<Workflow>(
                `${BASE_URL}/workflows/${workflowId}/versions/${versionId}/set-default`,
                {},
                { headers }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },
}; 