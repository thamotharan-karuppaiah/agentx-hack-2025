import { useState, useEffect } from 'react';
import { Connection, OnConnectStartParams, useReactFlow } from 'reactflow';
import { generateUniqueEdgeId } from '../utils/edgeUtils';
import { useToolbarStore } from '../stores/toolbarStore';

// Store selectors
const selectIsLocked = (state: any) => state.isLocked;

export const useConnectionHandling = () => {
  const [connectionStartHandle, setConnectionStartHandle] = useState<OnConnectStartParams | null>(null);
  const [validConnectionHandle, setValidConnectionHandle] = useState<string | null>(null);
  const [, setIsDragging] = useState(false);
  const isLocked = useToolbarStore(selectIsLocked);
  const { 
    getNodes, 
    getEdges, 
    setNodes, 
    setEdges,
    screenToFlowPosition 
  } = useReactFlow();

  const isValidConnection = (connection: Connection): boolean => {
    if (!connection.source || !connection.target) return false;
    const sourceHandle = connection.sourceHandle;
    const targetHandle = connection.targetHandle;
    if (sourceHandle?.includes('target') || targetHandle?.includes('source')) {
      console.warn('Invalid connection: Can only connect from output to input');
      return false;
    }
    return true;
  };

  const wouldCreateCycle = (newEdge: Connection): boolean => {
    const graph: { [key: string]: string[] } = {};
    const edges = getEdges();

    edges.forEach(edge => {
      if (!graph[edge.source]) graph[edge.source] = [];
      graph[edge.source].push(edge.target);
    });

    if (!graph[newEdge.source!]) graph[newEdge.source!] = [];
    graph[newEdge.source!].push(newEdge.target!);

    const hasCycle = (node: string, visited: Set<string>, path: Set<string>): boolean => {
      if (path.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      path.add(node);

      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor, visited, path)) return true;
      }

      path.delete(node);
      return false;
    };

    return hasCycle(newEdge.source!, new Set(), new Set());
  };

  const handleConnect = (connection: Connection) => {
    if (!isLocked) {
      const isValid = isValidConnection(connection);
      const wouldCycle = wouldCreateCycle(connection);

      if (isValid && !wouldCycle) {
        const newEdge = {
          id: generateUniqueEdgeId(),
          source: connection.source!,
          target: connection.target!,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        };
        setEdges(edges => [...edges, newEdge]);
      }
    }
  };

  const onConnectStart = (_event: React.MouseEvent | React.TouchEvent, params: OnConnectStartParams) => {
    const sourceHandle = document.querySelector(
      `[data-handleid="${params.handleId}"]`
    );
    sourceHandle?.classList.add('connecting');
    setConnectionStartHandle(params);
    setIsDragging(false);
  };

  const onConnectEnd = (event: MouseEvent | TouchEvent) => {
    const targetHandle = (event.target as Element)?.closest('.react-flow__handle');
    const sourceHandle = connectionStartHandle?.handleId
      ? document.querySelector(`[data-handleid="${connectionStartHandle.handleId}"]`)
      : null;
    sourceHandle?.classList.remove('connecting');
    
    if (targetHandle) {
      targetHandle.classList.remove('valid-connection');
      targetHandle.classList.remove('invalid-connection');
      setConnectionStartHandle(null);
      setValidConnectionHandle(null);
      return;
    }

    // Only create ghost node if we're starting from a handle and not ending on another handle
    if (connectionStartHandle && !validConnectionHandle && !targetHandle) {
      const { clientX, clientY } = event instanceof MouseEvent ? event : event.touches[0];
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      const nodes = getNodes();
      
      const ghostNode = {
        id: `${connectionStartHandle?.nodeId}-${nodes.length + 1}`,
        type: 'ghost',
        position,
        data: { 
          label: 'Add Step',
          onReplace: (ghostId: string, type: string, label: string) => {
            const newNode = {
              id: ghostId,
              type,
              position: nodes.find(n => n.id === ghostId)?.position || position,
              data: {
                title: label,
                step: nodes.length + 1,
              }
            };

            setNodes(nodes => nodes.filter(n => n.id !== ghostId).concat(newNode));
          }
        }
      };

      setNodes(nodes => [...nodes, ghostNode]);

      const newEdge = {
        id: generateUniqueEdgeId(),
        source: connectionStartHandle.nodeId!,
        target: ghostNode.id,
        sourceHandle: connectionStartHandle.handleId,
        targetHandle: 'target'
      };

      setEdges(edges => [...edges, newEdge]);
    }

    setConnectionStartHandle(null);
    setValidConnectionHandle(null);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (connectionStartHandle) {
        setIsDragging(true);
        
        const targetHandle = document.elementFromPoint(event.clientX, event.clientY);
        if (targetHandle?.hasAttribute('data-handleid')) {
          const handleId = targetHandle.getAttribute('data-handleid');
          if (handleId !== validConnectionHandle) {
            if (validConnectionHandle) {
              const prevHandle = document.querySelector(
                `[data-handleid="${validConnectionHandle}"]`
              );
              prevHandle?.classList.remove('valid-connection', 'invalid-connection');
            }

            const connection = {
              source: connectionStartHandle.nodeId,
              sourceHandle: connectionStartHandle.handleId,
              target: targetHandle.closest('.react-flow__node')?.getAttribute('data-id'),
              targetHandle: handleId,
            };

            const isValid = isValidConnection(connection as Connection);
            const wouldCycle = connection.target ? wouldCreateCycle(connection as Connection) : false;

            targetHandle.classList.remove('valid-connection', 'invalid-connection');
            targetHandle.classList.add(isValid && !wouldCycle ? 'valid-connection' : 'invalid-connection');

            setValidConnectionHandle(handleId);
          }
        } else if (validConnectionHandle) {
          const prevHandle = document.querySelector(
            `[data-handleid="${validConnectionHandle}"]`
          );
          prevHandle?.classList.remove('valid-connection', 'invalid-connection');
          setValidConnectionHandle(null);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [connectionStartHandle, validConnectionHandle]);

  return {
    handleConnect,
    onConnectStart,
    onConnectEnd,
  };
}; 