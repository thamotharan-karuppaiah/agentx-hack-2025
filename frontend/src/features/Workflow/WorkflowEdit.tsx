import {
  Node,
  Edge,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore, WorkflowState } from './stores/workflowStore';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect, useRef, useCallback, useState, useLayoutEffect } from 'react';
import { WorkflowDesigner } from './components/WorkflowDesigner';
import { workflowService } from '@/services/workflowService';
import { useParams } from 'react-router-dom';
import { processFlowConfig } from './utils/flowUtils';
import { ConfigPanel } from './components/ConfigPanel';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarBlocks } from './components/SidebarBlocks';
import { WorkflowHeader } from './components/WorkflowHeader';
import styles from './WorkflowEdit.module.css';
import { NodeConfig } from './types';
import { ToolbarState, useToolbarStore } from './stores/toolbarStore';
import { useWorkflowUIStore, WorkflowUIState } from './stores/workflowUIStore';

// Store selectors
const selectSelectedNode = (state: WorkflowUIState) => state.selectedNode;
const selectSetWorkflow = (state: WorkflowState) => state.setWorkflow;
const selectSetSelectedNode = (state: WorkflowUIState) => state.setSelectedNode;
const selectUpdateWorkflowField = (state: WorkflowState) => state.updateWorkflowField;
const selectResetWorkflow = (state: WorkflowState) => state.resetWorkflow;

const selectResetToolbar = (state: ToolbarState) => state.resetToolbar;

export const WorkflowEdit = () => {
  const { state, setOpen } = useSidebar();
  const nodesRef = useRef<Node<NodeConfig>[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const { workflowId } = useParams();

  // Use selectors for store access
  const selectedNode = useWorkflowUIStore(selectSelectedNode);
  const setWorkflow = useWorkflowStore(selectSetWorkflow);
  const setSelectedNode = useWorkflowUIStore(selectSetSelectedNode);
  const updateWorkflowField = useWorkflowStore(selectUpdateWorkflowField);
  const resetWorkflow = useWorkflowStore(selectResetWorkflow);
  const resetToolbar = useToolbarStore(selectResetToolbar);

  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    resetWorkflow();
    resetToolbar();
  }, [workflowId, resetWorkflow, resetToolbar]);

  useEffect(() => { 
    setOpen(false);
    let sidebar = document.body.querySelector('[data-variant="sidebar"]');
    if (sidebar) {
      sidebar.classList.add('hidden');
      (sidebar as HTMLElement).style.setProperty('--sidebar-width', '0px');
      (sidebar as HTMLElement).style.setProperty('--sidebar-width-icon', '0px');
      (sidebar as HTMLElement).style.setProperty('visibility', 'hidden');
    }

    return () => {
      if (sidebar) {
        sidebar.classList.remove('hidden');
        (sidebar as HTMLElement).style.setProperty('--sidebar-width', '16rem');
        (sidebar as HTMLElement).style.setProperty('--sidebar-width-icon', '3rem');
        (sidebar as HTMLElement).style.removeProperty('visibility');
      }
      if (state === 'expanded') {
        setOpen(true);
      }
    }
  }, []);

  const handleConfigChange = useCallback((config: { nodes: Node[], edges: Edge[] }) => {
    nodesRef.current = config.nodes;
    edgesRef.current = config.edges;

    updateWorkflowField('config', config);
  }, [updateWorkflowField]);

  useEffect(() => {
    if (!workflowId) return;
    const fetchWorkflow = async () => {
      try {
        const workflowData = await workflowService.getWorkflow(workflowId);
        setWorkflow(workflowData);
        let config = processFlowConfig(workflowData.config);
        nodesRef.current = config.nodes;
        edgesRef.current = config.edges;
      } catch (error) {
        console.error('Failed to fetch workflow:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, [workflowId, setWorkflow]);

  if (!workflowId) return <div>Workflow not found</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <ReactFlowProvider>
      <TooltipProvider delayDuration={0}>
        <div className="ignore-layout-padding w-full h-screen flex flex-col ignore-layout-padding">
          <WorkflowHeader />
          <div className="flex-1 flex relative">
            <SidebarBlocks />
            <div className={`flex-1 h-full relative ${styles.workflow} group`}>
              <WorkflowDesigner
                initialNodes={nodesRef.current}
                initialEdges={edgesRef.current}
                onConfigChange={handleConfigChange}
              />
            </div>
            {selectedNode && (
              <ConfigPanel
                nodeId={selectedNode.id}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>
        </div>
      </TooltipProvider>
    </ReactFlowProvider>
  );
};
