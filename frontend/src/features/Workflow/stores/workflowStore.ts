import { create } from 'zustand';
import { workflowService } from '@/services/workflowService';
import { Workflow, WorkflowConfig } from '../types';
import { useWorkflowUIStore } from './workflowUIStore';

export interface WorkflowState {
  id: string | null;
  name: string;
  description: string;
  createdBy: string;
  config: WorkflowConfig;
  defaultVersion: number;
  defaultVersionId: string | null;
  totalVersions: number;
  status: 'draft' | 'published';
  uuid: string;
  workspaceId: string;
  public: boolean;
  color: string;
  emoji: string;
  readme: string;
  createdAt: string;
  updatedAt: string;
  totalRuns: number;
  linkedGrids: number;
  lastEdited: string;
  setWorkflow: (workflow: Workflow) => void;
  updateWorkflowField: (field: keyof Workflow, value: any) => void;
  resetWorkflow: () => void;
}

const AUTOSAVE_DELAY = 1000; // 1 second delay for autosave

const initialState: Omit<WorkflowState, 'setWorkflow' | 'updateWorkflowField' | 'resetWorkflow'> = {
  id: null,
  name: '',
  description: '',
  createdBy: '',
  config: { nodes: [], edges: [] },
  defaultVersion: 0,
  defaultVersionId: null,
  totalVersions: 0,
  status: 'draft',
  uuid: '',
  workspaceId: '',
  public: false,
  color: '',
  emoji: '',
  readme: '',
  createdAt: '',
  updatedAt: '',
  totalRuns: 0,
  linkedGrids: 0,
  lastEdited: '',
};

export const useWorkflowStore = create<WorkflowState>((set, get) => {
  let saveTimeout: NodeJS.Timeout | null = null;

  const triggerAutosave = async () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // aacess workflowUIStore
    const { setIsSaving } = useWorkflowUIStore.getState();
    setIsSaving(true);
    saveTimeout = setTimeout(async () => {
      const state = get();
      if (!state.id) return;

      try {
        const workflowData = {
          name: state.name,
          description: state.description,
          config: state.config,
          status: state.status,
          public: state.public,
          color: state.color,
          emoji: state.emoji,
          readme: state.readme,
        };

        await workflowService.updateWorkflow(state.id, workflowData);
      } catch (error) {
        console.error('Failed to save workflow:', error);
      }
      finally {
        setIsSaving(false);
      }
    }, AUTOSAVE_DELAY);
  };

  return {
    ...initialState,
    setWorkflow: (workflow: Workflow) => {
      set(workflow);
      triggerAutosave();
    },
    updateWorkflowField: (field: keyof Workflow, value: any) => {
      set({ [field]: value });
      triggerAutosave();
    },
    resetWorkflow: () => {
      set(initialState);
    },
  };
}); 