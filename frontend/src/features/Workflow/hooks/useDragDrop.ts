import { useState } from 'react';
import { Edge, useReactFlow } from 'reactflow';
import { pointToLineDistance } from '../utils/edgeUtils';
import { addNode, addNodeBetweenEdge } from '../utils/flowUtils';

export const useDragDrop = () => {
  const [draggedEdge, setDraggedEdge] = useState<Edge | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const { 
    getNodes, 
    getEdges, 
    setNodes, 
    setEdges,
    project 
  } = useReactFlow();

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const pos = project({ x: event.clientX, y: event.clientY });
    const nodes = getNodes();
    const edges = getEdges();

    const hoveredEdge = edges.find(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return false;

      const sourceX = sourceNode.position.x + (sourceNode.width || 0) / 2;
      const sourceY = sourceNode.position.y + (sourceNode.height || 0) / 2;
      const targetX = targetNode.position.x + (targetNode.width || 0) / 2;
      const targetY = targetNode.position.y + (targetNode.height || 0) / 2;

      const threshold = 20;
      const distance = pointToLineDistance(
        pos.x,
        pos.y,
        sourceX,
        sourceY,
        targetX,
        targetY
      );

      return distance < threshold;
    });

    setDraggedEdge(hoveredEdge || null);
    setIsDraggingOver(!!hoveredEdge);
  };

  const onDragLeave = () => {
    setDraggedEdge(null);
    setIsDraggingOver(false);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    try {
      const { type: nodeType, label } = JSON.parse(type);
      const position = project({ x: event.clientX, y: event.clientY });
      const nodes = getNodes();
      const edges = getEdges();

      if (draggedEdge) {
        addNodeBetweenEdge(
          nodeType,
          label,
          draggedEdge,
          nodes,
          edges,
          setNodes,
          setEdges
        );
      } else {
        addNode(
          nodeType,
          label,
          position,
          nodes,
          setNodes
        );
      }
    } catch (error) {
      console.error('Error adding new node:', error);
    }

    setDraggedEdge(null);
    setIsDraggingOver(false);
  };

  return {
    draggedEdge,
    isDraggingOver,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}; 