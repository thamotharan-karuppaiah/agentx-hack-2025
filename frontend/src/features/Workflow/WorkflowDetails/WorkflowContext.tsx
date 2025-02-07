import { createContext, useContext, ReactNode } from 'react';
import type { Workflow } from '@/features/Workflow/types';

interface WorkflowContextType {
  workflow: Workflow | null;
  loading: boolean;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider = WorkflowContext.Provider; 