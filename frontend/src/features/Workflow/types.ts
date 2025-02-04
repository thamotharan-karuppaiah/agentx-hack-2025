import { Node, Edge, NodeProps } from 'reactflow';

export type WorkflowStatus = 'draft' | 'published';

export interface NodeConfig {
  name: string;
  title: string;
  [key: string]: any;
}

export interface WorkflowConfig {
  nodes: Node<NodeConfig>[];
  edges: Edge[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  config: WorkflowConfig;
  defaultVersion: number;
  defaultVersionId?: string;
  totalVersions?: number;
  status: WorkflowStatus;
  uuid: string;
  workspaceId: string;
  public: boolean;
  color: string;
  emoji: string;
  readme: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  totalRuns: number;
  linkedGrids: number;
  lastEdited: string;
}

export interface CreateWorkflowPayload {
  name?: string;
  description?: string;
  public?: boolean;
  color?: string;
  emoji?: string;
}

export type SortConfig = {
  key: keyof Workflow | null;
  direction: 'asc' | 'desc';
};

export interface WorkflowFilters {
  status?: WorkflowStatus;
  name?: string;
  linkedSheets?: boolean;
  hasRuns?: boolean;
} 


export interface BaseNodeProps {
  type: string;
  icon: React.ForwardRefExoticComponent<any>;
  step?: string | number;
  children: React.ReactNode;
  hasInputHandle?: boolean;
  hasOutputHandle?: boolean;
  className?: string;
  contentClassName?: string;
}

export interface ConfigComponentProps {
  data: NodeConfig;
  onChange: (data: Partial<NodeConfig>) => void;
}

export interface NodeDetailProps extends NodeProps<NodeConfig> {
  data: NodeConfig;
}