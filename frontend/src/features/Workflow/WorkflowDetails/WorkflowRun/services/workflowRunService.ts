import { WorkflowRunState, WorkflowStep } from '../types';
import api from '@/services/apiService';

const mockWorkflowSteps: WorkflowStep[] = [
  { id: 1, name: 'Initialize workflow', status: 'pending' },
  { id: 2, name: 'Search intent analysis', status: 'pending' },
  { id: 3, name: 'Title generation', status: 'pending' },
  { id: 4, name: 'Content structure', status: 'pending' },
  { id: 5, name: 'Research gathering', status: 'pending' },
  { id: 6, name: 'Content draft', status: 'pending' },
  { id: 7, name: 'SEO optimization', status: 'pending' },
  { id: 8, name: 'Review suggestions', status: 'pending' },
  { id: 9, name: 'Final formatting', status: 'pending' },
  { id: 10, name: 'Output preparation', status: 'pending' }
];

let currentRunId: string | null = null;
let currentState: WorkflowRunState | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock history store
const mockHistoryStore: {
  [workflowId: string]: {
    id: string;
    timestamp: string;
    input: Record<string, any>;
    output: any;
    status: 'running' | 'completed' | 'failed' | 'canceled' | 'reviewing';
    state?: WorkflowRunState;
  }[]
} = {};

const BASE_URL = 'http://localhost:8000/workflows';

export const workflowRunService = {
  runWorkflow: async (workflowId: string, input: Record<string, any>): Promise<string> => {
    currentRunId = `run-${Date.now()}`;
    
    // Initialize history entry with 'running' status
    if (!mockHistoryStore[workflowId]) {
      mockHistoryStore[workflowId] = [];
    }
    
    mockHistoryStore[workflowId].unshift({
      id: currentRunId,
      timestamp: new Date().toISOString(),
      input,
      output: null,
      status: 'running' // Start with running status
    });

    currentState = {
      currentStep: 1,
      totalSteps: mockWorkflowSteps.length,
      status: 'running',
      steps: mockWorkflowSteps.map((step, index) => ({
        ...step,
        status: index === 0 ? 'running' : 'pending'
      }))
    };
    return currentRunId;
  },

  checkRunStatus: async (runId: string): Promise<WorkflowRunState | null> => {
    // First check current run
    if (currentRunId === runId && currentState) {
      return currentState;
    }

    // Check history for saved states
    for (const history of Object.values(mockHistoryStore)) {
      const run = history.find(r => r.id === runId);
      if (run?.state) {
        return run.state;
      }
    }

    return null;
  },

  updateStepStatus: async (runId: string, stepId: number, status: WorkflowStep['status'], reviewData?: any) => {
    if (!currentState || runId !== currentRunId) return;
    
    const newStatus = status === 'needs_review' ? 'reviewing' : 'running';
    currentState = {
      ...currentState,
      status: newStatus,
      steps: currentState.steps.map(step =>
        step.id === stepId ? { ...step, status, reviewData } : step
      )
    };

    // Update history with current state
    Object.values(mockHistoryStore).forEach(history => {
      const run = history.find(r => r.id === runId);
      if (run) {
        run.status = newStatus;
        run.state = currentState ? {
          currentStep: currentState.currentStep,
          totalSteps: currentState.totalSteps,
          steps: [...currentState.steps],
          status: currentState.status
        } : undefined;
      }
    });

    if (status === 'completed') {
      const nextStep = currentState.steps.find(s => s.status === 'pending');
      if (nextStep) {
        currentState.currentStep = nextStep.id;
        nextStep.status = 'running';
      } else {
        currentState.status = 'completed';
        // Update history status when workflow completes
        Object.values(mockHistoryStore).forEach(history => {
          const run = history.find(r => r.id === runId);
          if (run) {
            run.status = 'completed';
          }
        });
      }
    }
  },

  cancelRun: async (runId: string) => {
    if (!currentState || runId !== currentRunId) return;
    
    // Update history status
    Object.values(mockHistoryStore).forEach(history => {
      const run = history.find(r => r.id === runId);
      if (run) {
        run.status = 'canceled';
      }
    });

    currentState.status = 'failed';
    currentState = null;
    currentRunId = null;
  },

  getRunOutput: async (runId: string): Promise<any> => {
    const output = {
      title: "What Is the Meaning of 1234 in Numerology?",
      sections: [
        {
          heading: "Introduction",
          content: "..."
        }
      ]
    };

    // Update history with output
    Object.values(mockHistoryStore).forEach(history => {
      const run = history.find(r => r.id === runId);
      if (run) {
        run.output = output;
      }
    });

    return output;
  },

  submitFeedback: async (runId: string, isPositive: boolean): Promise<void> => {
    console.log(`Feedback submitted for run ${runId}: ${isPositive ? 'positive' : 'negative'}`);
  },

  getRunHistory: async (workflowId: string) => {
    await delay(500);
    return mockHistoryStore[workflowId] || [];
  },

  runWorkflowSync: async (workflowId: string, input: Record<string, any>): Promise<any> => {
    try {
      const response = await api.post(`${BASE_URL}/${workflowId}/sync`, {
        initial_inputs: input
      });
      return response.data;
    } catch (error) {
      console.error('Error running workflow:', error);
      throw error;
    }
  },

  validateRequiredFields: (inputNode: any, input: Record<string, any>): string[] => {
    const requiredFields: string[] = [];
    
    inputNode?.data?.groups?.forEach((group: any) => {
      group.fields?.forEach((field: any) => {
        if (field.required && field.variableName) {
          requiredFields.push(field.variableName);
        }
      });
    });

    return requiredFields.filter(field => !input[field]);
  }
}; 