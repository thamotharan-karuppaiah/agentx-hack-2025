import { useEffect, useCallback } from 'react';
import { useKeyPress, useReactFlow } from 'reactflow';
import { useWorkflowUIStore } from '../stores/workflowUIStore';
import { useToolbarStore } from '../stores/toolbarStore';
import { deleteNode } from '../utils/flowUtils';

// Store selectors
const selectSelectedNode = (state: any) => state.selectedNode;
const selectSetSelectedNode = (state: any) => state.setSelectedNode;
const selectIsLocked = (state: any) => state.isLocked;

export const useNodeDeletion = () => {
  const deletePressed = useKeyPress('Delete');
  const backspacePressed = useKeyPress('Backspace');

  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const selectedNode = useWorkflowUIStore(selectSelectedNode);
  const setSelectedNode = useWorkflowUIStore(selectSetSelectedNode);
  const isLocked = useToolbarStore(selectIsLocked);

  const handleDelete = useCallback((id: string) => {
    if (isLocked) return;

    const nodes = getNodes();
    const edges = getEdges();
    
    const node = nodes.find(n => n.id === id);
    if (!node || node.type === 'start' || node.type === 'end') return;

    deleteNode(id, nodes, edges, setNodes, setEdges);
    
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
  }, [getNodes, getEdges, setNodes, setEdges, isLocked, selectedNode, setSelectedNode]);

  useEffect(() => {
    if (!selectedNode || isLocked) return;
    if (selectedNode.type === 'start' || selectedNode.type === 'end') return;
    
    if (deletePressed || backspacePressed) {
      handleDelete(selectedNode.id);
    }
  }, [deletePressed, backspacePressed, selectedNode, isLocked, handleDelete]);

  return {
    handleDelete,
  };
}; 