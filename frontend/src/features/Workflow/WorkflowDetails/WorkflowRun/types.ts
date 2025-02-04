export interface WorkflowOutput {
  [key: string]: any;
}

export interface WorkflowRun {
  id: string;
  timestamp: string;
  input: Record<string, any>;
  output: WorkflowOutput;
}

export type PreviewMode = 'code' | 'markdown' | 'html' | 'raw'; 

export type WorkflowStepStatus = 'pending' | 'running' | 'needs_review' | 'completed' | 'failed';

export interface WorkflowStep {
  id: number;
  name: string;
  status: WorkflowStepStatus;
  output?: any;
  needsReview?: boolean;
  reviewData?: {
    title: string;
    subtitle?: string;
    description?: string;
    options: string[];
    selectedOption?: string;
  };
}

export interface WorkflowRunState {
  currentStep: number;
  totalSteps: number;
  steps: WorkflowStep[];
  status: 'running' | 'reviewing' | 'completed' | 'failed';
} 