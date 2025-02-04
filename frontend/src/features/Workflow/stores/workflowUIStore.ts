import { create } from 'zustand';
import { Node } from 'reactflow';

export interface WorkflowUIState {
  isSaving: boolean;
  selectedNode: Node | null;
  isConfigPanelOpen: boolean;
  setIsSaving: (isSaving: boolean) => void;
  setSelectedNode: (node: Node | null) => void;
  setIsConfigPanelOpen: (isOpen: boolean) => void;
  resetUIState: () => void;
}

const initialState: Omit<WorkflowUIState, 'setIsSaving' | 'setSelectedNode' | 'setIsConfigPanelOpen' | 'resetUIState'> = {
  isSaving: false,
  selectedNode: null,
  isConfigPanelOpen: false,
};

export const useWorkflowUIStore = create<WorkflowUIState>((set) => ({
  ...initialState,

  setIsSaving: (isSaving: boolean) => set({ isSaving }),
  
  setSelectedNode: (node: Node | null) => {
    set({ 
      selectedNode: node,
      isConfigPanelOpen: !!node 
    });
  },
  
  setIsConfigPanelOpen: (isOpen: boolean) => {
    set({ isConfigPanelOpen: isOpen });
    if (!isOpen) {
      set({ selectedNode: null });
    }
  },

  resetUIState: () => set(initialState),
})); 