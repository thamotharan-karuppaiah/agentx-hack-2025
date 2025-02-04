import ReactFlow, {
  useNodesState,
  useEdgesState,
  Background,
  ConnectionMode,
  ProOptions,
  Node,
  MiniMap,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { WorkflowToolbar } from './WorkflowToolbar';
import { ToolbarState, useToolbarStore } from '../stores/toolbarStore';
import styles from '../WorkflowEdit.module.css';
import { nodeTypes } from './nodes/nodeTypes';
import { useConnectionHandling } from '../hooks/useConnectionHandling';
import { useDragDrop } from '../hooks/useDragDrop';
import { useZoomHandling } from '../hooks/useZoomHandling';
import { useEdgeFormatting } from '../hooks/useEdgeFormatting';
import { useWorkflowStore } from '../stores/workflowStore';
import { useWorkflowUIStore } from '../stores/workflowUIStore';
import { useEffect, useCallback } from 'react';

// Store selectors
const selectSelectedVersion = (state : ToolbarState) => state.selectedVersion;
const selectIsLocked = (state: ToolbarState) => state.isLocked;
const selectShowMinimap = (state: ToolbarState) => state.showMinimap;

export const WorkflowDesigner = ({ initialNodes, initialEdges, onConfigChange }: { initialNodes: Node[], initialEdges: Edge[], onConfigChange: (config: { nodes: Node[], edges: Edge[] }) => void }) => {
  // Use selectors for store access
  const selectedVersion = useToolbarStore(selectSelectedVersion);
  const isLocked = useToolbarStore(selectIsLocked);
  const showMinimap = useToolbarStore(selectShowMinimap);
  
  const updateWorkflowField = useWorkflowStore(state => state.updateWorkflowField);
  const setSelectedNode = useWorkflowUIStore(state => state.setSelectedNode);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when version changes
  useEffect(() => {
    if (selectedVersion?.config) {
      setNodes(selectedVersion.config.nodes || []);
      setEdges(selectedVersion.config.edges || []);
    } else {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [selectedVersion, initialNodes, initialEdges]);

  useEffect(() => {
    if (nodes === initialNodes && edges === initialEdges) return;
    // Only trigger config change if we're not viewing a version
    if (!selectedVersion) {
      onConfigChange({ nodes, edges });
    }
  }, [nodes, edges, updateWorkflowField, selectedVersion, initialNodes, initialEdges]);

  const { handleConnect, onConnectStart, onConnectEnd } = useConnectionHandling();

  const { onDragOver, onDragLeave, onDrop } = useDragDrop();

  const { handleWheel } = useZoomHandling();

  const proOptions: ProOptions = {
    hideAttribution: true
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    event.preventDefault();
    // Only allow node selection if not viewing a version
    if (!selectedVersion) {
      setSelectedNode(node);
    }
  }, [selectedVersion, setSelectedNode]);

  const formatEdges = useEdgeFormatting({
    onEdgesChange,
    draggedEdge: undefined,
    styles: {
      highlightedEdge: styles.highlightedEdge
    }
  });

  // Determine if interactions should be disabled
  const isInteractionDisabled = selectedVersion || isLocked;

  return (
    <ReactFlow
      nodes={nodes}
      edges={formatEdges(edges)}
      onNodesChange={isInteractionDisabled ? undefined : onNodesChange}
      onEdgesChange={isInteractionDisabled ? undefined : onEdgesChange}
      onConnect={isInteractionDisabled ? undefined : handleConnect}
      onConnectStart={isInteractionDisabled ? undefined : onConnectStart}
      onConnectEnd={isInteractionDisabled ? undefined : onConnectEnd}
      nodeTypes={nodeTypes}
      connectionMode={ConnectionMode.Strict}
      onNodeClick={onNodeClick}
      nodesDraggable={!isInteractionDisabled}
      nodesConnectable={!isInteractionDisabled}
      elementsSelectable={!isInteractionDisabled}
      proOptions={proOptions}
      className={styles.reactFlow}
      onDragOver={isInteractionDisabled ? undefined : onDragOver}
      onDragLeave={isInteractionDisabled ? undefined : onDragLeave}
      onDrop={isInteractionDisabled ? undefined : onDrop}
      minZoom={0.2}
      maxZoom={2}
      zoomOnScroll={false}
      zoomOnPinch={true}
      preventScrolling={false}
      onWheel={handleWheel}
      fitView
    >
      <Background />
      <WorkflowToolbar />
      {showMinimap && (
        <MiniMap
          nodeColor="#6366f1"
          maskColor="rgb(243, 244, 246, 0.7)"
          className="rounded-lg"
        />
      )}
    </ReactFlow>
  );
};
