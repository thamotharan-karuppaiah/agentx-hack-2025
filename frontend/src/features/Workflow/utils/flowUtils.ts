import { WorkflowConfig } from "../types";
import { Edge, Node } from "reactflow";
import { NodeConfig } from "../types";
import { generateUniqueEdgeId } from './edgeUtils';
import { v4 as uuidv4 } from 'uuid';

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 100, y: 50 },
    data: { 
      name: 'start',
      title: 'Start',
    },
    deletable: false,
  },
  {
    id: 'end',
    type: 'end',
    position: { x: 800, y: 50 },
    data: { 
      name: 'end',
      title: 'End',
      outputType: 'autodetect'
    },
    deletable: false,
  },
];

const initialEdges: Edge[] = [
  { id: 'edge-1', source: 'start', target: 'end' },
];

export const processFlowConfig = (config: WorkflowConfig | undefined) => {
  if (!config) return { nodes: initialNodes, edges: initialEdges };
  return {
    ...config,
    nodes: !config.nodes?.length ? initialNodes : config.nodes,
    edges: !config.edges?.length ? initialEdges : config.edges,
  }
};

export const deleteNode = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void
) => {
  // Find incoming and outgoing edges
  const incomingEdges = edges.filter(edge => edge.target === nodeId);
  const outgoingEdges = edges.filter(edge => edge.source === nodeId);

  // Remove edges connected to the deleted node
  let newEdges = edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);

  // Connect incoming edges to outgoing edges
  incomingEdges.forEach(inEdge => {
    outgoingEdges.forEach(outEdge => {
      newEdges.push({
        id: generateUniqueEdgeId(),
        source: inEdge.source,
        target: outEdge.target,
        sourceHandle: inEdge.sourceHandle ?? null,
        targetHandle: outEdge.targetHandle ?? null
      });
    });
  });

  // Remove the node and update edges
  setNodes(nodes.filter(n => n.id !== nodeId));
  setEdges(newEdges);
};

const generateUniqueStepName = (nodes: Node[]): string => {
  let counter = 1;
  let stepName = `step_${counter}`;
  
  while (nodes.some(node => node.data?.name === stepName)) {
    counter++;
    stepName = `step_${counter}`;
  }
  
  return stepName;
};

export const addNode = (
  nodeType: string,
  label: string,
  position: { x: number; y: number },
  nodes: Node[],
  setNodes: (nodes: Node[]) => void
): Node => {
  const uniqueName = generateUniqueStepName(nodes);
  const newNode = {
    id: uuidv4(),
    type: nodeType,
    position,
    data: {
      title: label,
      name: uniqueName
    }
  };

  setNodes([...nodes, newNode]);
  return newNode;
};

export const addNodeBetweenEdge = (
  nodeType: string,
  label: string,
  edge: Edge,
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void
): Node => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) {
    throw new Error('Source or target node not found');
  }

  // Calculate midpoint position
  const position = {
    x: (sourceNode.position.x + targetNode.position.x) / 2,
    y: (sourceNode.position.y + targetNode.position.y) / 2,
  };

  // Add the new node
  const newNode = addNode(nodeType, label, position, nodes, setNodes);

  // Create new edges
  const sourceToNew = {
    id: generateUniqueEdgeId(),
    source: edge.source,
    target: newNode.id,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: 'target'
  };

  const newToTarget = {
    id: generateUniqueEdgeId(),
    source: newNode.id,
    target: edge.target,
    sourceHandle: 'source',
    targetHandle: edge.targetHandle ?? null
  };

  // Replace old edge with new connections
  setEdges([
    ...edges.filter(e => e.id !== edge.id),
    sourceToNew,
    newToTarget
  ]);

  return newNode;
};

export const addEdge = (
  sourceId: string,
  targetId: string,
  sourceHandle: string | null,
  targetHandle: string | null,
  edges: Edge[],
  setEdges: (edges: Edge[]) => void
): Edge => {
  const newEdge: Edge = {
    id: generateUniqueEdgeId(),
    source: sourceId,
    target: targetId,
    sourceHandle,
    targetHandle,
  };

  setEdges([...edges, newEdge]);
  return newEdge;
};

export const updateNodeData = (nodeId: string, data: Partial<NodeConfig>, nodes: Node[], setNodes: (nodes: Node[]) => void) => {
  setNodes(
    nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            ...data
          }
        };
      }
      return n;
    })
  );
};

export function hasPathToEnd(
  nodeId: string, 
  type: string,
  nodes: Node<NodeConfig>[],
  edges: Edge[]
): boolean {
  if (type === 'end') return true;
  
  const visited = new Set<string>();

  function dfs(currentNodeId: string): boolean {
    if (visited.has(currentNodeId)) return false;
    visited.add(currentNodeId);

    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    
    for (const edge of outgoingEdges) {
      const targetNode = nodes.find(n => n.id === edge.target);
      if (targetNode?.type === 'end') return true;
      if (targetNode && dfs(targetNode.id)) return true;
    }

    return false;
  }

  return dfs(nodeId);
}

export function hasPathToStart(
  nodeId: string, 
  type: string,
  nodes: Node<NodeConfig>[],
  edges: Edge[]
): boolean {
  if (type === 'start') return true;

  const visited = new Set<string>();

  function dfs(currentNodeId: string): boolean {
    if (visited.has(currentNodeId)) return false;
    visited.add(currentNodeId);

    const incomingEdges = edges.filter(edge => edge.target === currentNodeId);
    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode?.type === 'start') return true;
      if (sourceNode && dfs(sourceNode.id)) return true;
    }

    return false;
  }

  return dfs(nodeId);
}