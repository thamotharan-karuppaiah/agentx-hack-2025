import { Edge } from 'reactflow';
import { useCallback } from 'react';

interface UseEdgeFormattingProps {
  onEdgesChange: (changes: any) => void;
  draggedEdge?: Edge | null;
  styles?: {
    highlightedEdge?: string;
    highlightColor?: string;
    highlightWidth?: number;
  };
}

export const useEdgeFormatting = ({
  onEdgesChange,
  draggedEdge,
  styles = {
    highlightedEdge: '',
    highlightColor: '#6366f1',
    highlightWidth: 3
  }
}: UseEdgeFormattingProps) => {
  const formatEdges = useCallback((edges: Edge[]) => {
    return edges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        onDelete: (id: string) => onEdgesChange([{ type: 'remove', id }])
      },
      className: draggedEdge?.id === edge.id ? styles.highlightedEdge : '',
      style: {
        ...edge.style,
        stroke: draggedEdge?.id === edge.id ? styles.highlightColor : undefined,
        strokeWidth: draggedEdge?.id === edge.id ? styles.highlightWidth : undefined,
      }
    }));
  }, [draggedEdge, onEdgesChange, styles]);

  return formatEdges;
}; 