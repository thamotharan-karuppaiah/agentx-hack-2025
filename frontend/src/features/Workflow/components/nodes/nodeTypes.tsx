import React from 'react';
import { NodeProps } from 'reactflow';
import {
  Brain,
  GitFork,
  Database,
  Repeat,
  FileInput,
  FileOutput,
  LucideProps,
  Bell,
  Code2,
  FileCode,
  Filter,
  ImageIcon,
  RefreshCw,
  Timer,
  Wrench,
  FileJson,
  FileText,
} from "lucide-react";

// Component imports
import { BaseNode } from './base/BaseNode';
import { GhostNode } from './ghost/GhostNode';
import { InputConfig, InputDetail } from './input';
import { OutputDetail } from './output/OutputDetail';
import { CodeConfig } from './code/CodeConfig';
import { CodeDetail } from './code/CodeDetail';
import { ApiConfig } from './api/ApiConfig';
import { ApiDetail } from './api/ApiDetail';
import { LlmDetail } from './llm/LlmDetail';
import { LlmConfig } from './llm/LlmConfig';

// Types
interface NodeBlock {
  id: string;
  label: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  detail?: React.ComponentType<any>;
  config?: React.ComponentType<any>;
  hasInputHandle?: boolean;
  hasOutputHandle?: boolean;
}

interface NodeCategory {
  id: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>
  label: string;
  color: string;
  blocks: NodeBlock[];
}

// Node Component Factory
const createNodeComponent = (block: NodeBlock) => {
  const NodeComponent = React.memo((nodeProps: NodeProps) => (
    <BaseNode
      {...nodeProps}
      type={block.id}
      hasInputHandle={block.hasInputHandle ?? true}
      hasOutputHandle={block.hasOutputHandle ?? true}
      icon={block.icon}
    >
      {block.detail ? <block.detail {...nodeProps} /> : null}
    </BaseNode>
  ));
  NodeComponent.displayName = `${block.id}Node`;
  return NodeComponent;
};

// Sidebar Categories Configuration with Node Details
export const nodeCategories: NodeCategory[] = [
  {
    id: 'ai',
    icon: Brain,
    label: 'AI',
    color: 'text-blue-500',
    blocks: [
      {
        id: 'llm',
        label: 'LLM',
        icon: Brain,
        hasInputHandle: true,
        hasOutputHandle: true,
        detail: LlmDetail,
        config: LlmConfig
      }
    ]
  },
  {
    id: 'code',
    icon: Code2,
    label: 'Code',
    color: 'text-amber-500',
    blocks: [
      {
        id: 'code',
        label: 'Code',
        icon: Code2,
        detail: CodeDetail,
        config: CodeConfig
      },
      {
        id: 'api', 
        label: 'API', 
        icon: FileCode,
        detail: ApiDetail,
        config: ApiConfig
      },
      { id: 'json', label: 'JSON', icon: FileJson },
      { id: 'sql', label: 'SQL Query', icon: Database },
      { id: 'liquid', label: 'Liquid Text', icon: FileText }
    ]
  },
  {
    id: 'flow',
    icon: GitFork,
    label: 'Flow',
    color: 'text-green-500',
    blocks: [
      {
        id: 'condition',
        label: 'Condition',
        icon: GitFork,
        hasInputHandle: true,
        hasOutputHandle: true
      },
      {
        id: 'loop',
        label: 'Loop',
        icon: Repeat,
        hasInputHandle: true,
        hasOutputHandle: true
      }
    ]
  },
  {
    id: 'data',
    icon: Database,
    label: 'Data',
    color: 'text-red-500',
    blocks: []
  },
  {
    id: 'images',
    icon: ImageIcon,
    label: 'Images',
    color: 'text-pink-500',
    blocks: [
      { id: 'process', label: 'Process', icon: ImageIcon },
      { id: 'filter', label: 'Filter', icon: Filter },
      { id: 'convert', label: 'Convert', icon: RefreshCw }
    ]
  },
  {
    id: 'utility',
    icon: Wrench,
    label: 'Utility',
    color: 'text-gray-500',
    blocks: [
      { id: 'timer', label: 'Timer', icon: Timer },
      { id: 'logger', label: 'Logger', icon: Database },
      { id: 'notification', label: 'Notification', icon: Bell }
    ]
  }
];

// Create memoized node components
const InputNode = createNodeComponent({
  id: 'start',
  label: 'Input',
  icon: FileInput,
  detail: InputDetail,
  config: InputConfig,
  hasInputHandle: false,
  hasOutputHandle: true
});

const OutputNode = createNodeComponent({
  id: 'end',
  label: 'End',
  icon: FileOutput,
  detail: OutputDetail,
  hasInputHandle: true,
  hasOutputHandle: false
});

// Generate node types from categories
export const nodeTypes = {
  'ghost': GhostNode,
  'start': InputNode,
  'end': OutputNode,
  ...Object.fromEntries(
    nodeCategories.flatMap(category =>
      category.blocks.map(block => [block.id, createNodeComponent(block)])
    )
  )
} as const;

export const nodeConfigMap: Record<string, React.ComponentType<any>> = {
  ...Object.fromEntries(
    nodeCategories.flatMap(category =>
      category.blocks.map(block => [block.id, block.config])
    )
  ),
  'start': InputConfig
};
