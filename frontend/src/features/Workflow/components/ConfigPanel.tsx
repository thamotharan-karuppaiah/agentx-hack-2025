import { useReactFlow } from 'reactflow';
import { X } from 'lucide-react';
import { nodeConfigMap } from './nodes/nodeTypes';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { NodeConfig } from '../types';
import { updateNodeData } from '../utils/flowUtils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Node } from 'reactflow';
import { useDebounce } from 'use-debounce';

interface ConfigPanelProps {
  nodeId: string;
  onClose: () => void;
}

// Store selectors
const selectNode = (nodes: Node[], nodeId: string) => nodes.find(n => n.id === nodeId);

export const ConfigPanel = ({ nodeId, onClose }: ConfigPanelProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { getNodes, setNodes } = useReactFlow();

  // Memoize node selection
  const node = useMemo(() => selectNode(getNodes(), nodeId), [getNodes, nodeId]);
  const ConfigComponent = useMemo(() =>
    node?.type ? nodeConfigMap[node.type] : null
    , [node?.type]);

  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 0);
    return () => {
      clearTimeout(timer);
      setIsVisible(false);
    };
  }, []);

  // Memoize handlers
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  const updateNodeDataDebounced = useCallback((nodeId: string, data: Partial<NodeConfig>) => {
    updateNodeData(nodeId, data, getNodes(), setNodes);
  }, [getNodes, setNodes]);

  const [handleConfigChange] = useDebounce(
    (nodeId: string, data: Partial<NodeConfig>) => {
      updateNodeDataDebounced(nodeId, data);
    },
    300
  );

  const handleErrorBehaviorChange = useCallback((value: 'terminate' | 'continue') => {
    if (!node) return;

    const newData = {
      ...node.data,
      errorBehavior: value
    };

    handleConfigChange(node.id, newData);
  }, [node, handleConfigChange]);

  if (!ConfigComponent || !node) {
    return null;
  }

  const showErrorHandling = node.type !== 'start' && node.type !== 'end';

  return (
    <div
      className={`absolute right-0 top-0 h-full w-[720px] border-l border-gray-200 bg-white transition-all duration-200 ease-in-out transform overflow-y-auto ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
    >
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold">Configure Node</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6 flex-1">
          <ConfigComponent
            id={nodeId}
            data={node.data}
            onChange={(data: Partial<NodeConfig>) => handleConfigChange(nodeId, data)}
          />
        </div>
        {showErrorHandling && (
          <div className="border-t p-4 space-y-3 bg-white">
            <div className="flex items-center gap-2">
              <Label>When the step fails:</Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full"
                onClick={() => handleErrorBehaviorChange('terminate')}
              >
                ?
              </Button>
            </div>
            <RadioGroup
              defaultValue={node.data?.errorBehavior || 'terminate'}
              onValueChange={handleErrorBehaviorChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="terminate" id="terminate" />
                <Label htmlFor="terminate">Terminate Workflow</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="continue" id="continue" />
                <Label htmlFor="continue">Continue</Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  );
}; 