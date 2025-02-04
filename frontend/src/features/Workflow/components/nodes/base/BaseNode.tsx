import { Handle, NodeProps, Position, useReactFlow } from 'reactflow';
import { Trash2, Copy, HelpCircle, FileText, Play, AlertTriangle } from 'lucide-react';
import { BaseNodeProps } from '../../../types';
import { deleteNode, updateNodeData, hasPathToEnd, hasPathToStart } from '../../../utils/flowUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export const BaseNode = ({
  icon,
  children,
  hasInputHandle = true,
  hasOutputHandle = true,
  type = 'default',
  id,
  data,
  contentClassName,
}: BaseNodeProps & NodeProps) => {
  const { setNodes, setEdges, getEdges, getNodes, getNode } = useReactFlow();
  const node = getNode(id);

  // Check if this node has a path to an end node
  const hasValidPathToEnd = useMemo(() => {
    return hasPathToEnd(id, type, getNodes(), getEdges());
  }, [id, type]);

  const hasValidPathToStart = useMemo(() => {
    return hasPathToStart(id, type, getNodes(), getEdges());
  }, [id, type]);

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (type === 'start' || type === 'end') return;
    deleteNode(id, getNodes(), getEdges(), setNodes, setEdges);
  };

  const handleClone = () => {
    // TODO: Implement clone functionality
  };

  const handleExplainStep = () => {
    // TODO: Implement explain step functionality
  };

  const handleAddNote = () => {
    // TODO: Implement add note functionality
  };

  const handleTest = () => {
    // TODO: Implement test functionality
  };

  const isStartOrEnd = type === 'start' || type === 'end';

  const Icon = useMemo(() => icon, [icon]);

  return (
    <div className="w-[426px] relative bg-white rounded-lg shadow-md border border-gray-200 group/node">
      {/* Header with handles */}
      <div className="relative flex items-center justify-between h-10 px-4 border-b border-gray-100">
        {/* Input Handle */}
        <div className="absolute -left-6 top-1/2 -translate-y-1/2">
          {hasInputHandle && (
            <Handle
              type="target"
              position={Position.Left}
              style={{ width: '12px', height: '12px', left: '-6px', background: 'white', border: '2px solid #d1d5db' }}
            />
          )}
        </div>

        {/* Output Handle */}
        <div className="absolute -right-6 top-1/2 -translate-y-1/2">
          {hasOutputHandle && (
            <Handle
              type="source"
              position={Position.Right}
              style={{ width: '12px', height: '12px', right: '-6px', background: 'white', border: '2px solid #d1d5db' }}
            />
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {Icon && (
            <div className="text-xs flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            type="text"
            defaultValue={node?.data?.title}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => {
              const nodes = getNodes();
              updateNodeData(id, { title: e.target.value }, nodes, setNodes);
            }}
            onBlur={(e) => {
              if (e.target.value.trim() === '') {
                const nodes = getNodes();
                updateNodeData(id, { title: node?.data?.label }, nodes, setNodes);
              }
            }}
            className="font-medium text-gray-900 bg-transparent border-none hover:cursor-text focus:outline-none focus:border-b focus:border-gray-300 min-w-[60px] p-0"
          />
        </div>

        <div className="flex items-center flex-shrink-0">
          <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
            {data?.name}
          </span>
          <div className="flex items-center ml-0.5">
            <div className="hidden group-hover/node:flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleExplainStep}
                      className="p-1 hover:bg-gray-50 rounded text-gray-500 hover:text-gray-700"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Explain Step</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleAddNote}
                      className="p-1 hover:bg-gray-50 rounded text-gray-500 hover:text-gray-700"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Note</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {!isStartOrEnd && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleClone}
                          className="p-1 hover:bg-gray-50 rounded text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clone Step</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleDelete}
                          className="p-1 hover:bg-gray-50 rounded text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Step</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
            {type !== 'end' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleTest}
                      className="p-1 hover:bg-gray-50 rounded text-gray-500 hover:text-gray-700"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Test Step</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>

      {/* Validation Banner */}
      {(!hasValidPathToEnd || !hasValidPathToStart) && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="text-[15px] font-medium text-amber-800">Step has errors</h3>
            <ul className="list-disc pl-4 text-[13px] text-amber-700">
              {!hasValidPathToEnd && <li>Must have a path to the end step</li>}
              {!hasValidPathToStart && <li>Must have a path to the start step</li>}
            </ul>
          </div>
        </div>
      )}
      {/* Content */}
      <div className={cn('p-4', contentClassName)}>
        {children}
      </div>

      {/* Configure Button */}
      {type !== 'end' && (
        <div className="px-4 pb-3">
          <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm font-medium transition-colors">
            Configure
          </button>
        </div>
      )}
    </div>
  );
}; 