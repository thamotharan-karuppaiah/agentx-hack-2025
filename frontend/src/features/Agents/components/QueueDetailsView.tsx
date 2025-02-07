import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Agent } from '../types';
import { AgentExecution } from '@/services/agentExecutionService';

interface QueueItem {
  name: string;
  moduleType: string;
  status: 'active';
}

interface QueueGroup {
  name: string;
  status: 'active' | 'finished';
  items: QueueItem[];
}

interface QueueDetailsViewProps {
  onBack: () => void;
  onItemClick: (item: QueueItem, groupName: string) => void;
  agent: Agent;
  executions: AgentExecution[];
}

export function QueueDetailsView({ onBack, onItemClick, agent }: QueueDetailsViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Ongoing': true,
    'Finished': true
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const queueGroups: QueueGroup[] = [
    {
      name: 'Ongoing',
      status: 'active',
      items: agent.integrations?.map(integration => ({
        name: integration.triggerName,
        triggerType: integration.triggerType,
        moduleType: integration.moduleName,
        status: 'active'
      })) || []
    },
    {
      name: 'Finished',
      status: 'finished',
      items: []
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <button
        onClick={onBack}
        className="w-full p-4 text-sm text-muted-foreground hover:text-primary group/back"
      >
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-accent/40 hover:bg-accent/60 transition-colors w-full">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover/back:-translate-x-0.5" />
          <span className="font-medium">Back to task view</span>
        </div>
      </button>

      {/* Queue Groups */}
      <div className="flex-1 p-4">
        {queueGroups.map((group) => (
          <div key={group.name} className="mb-6">
            <button
              onClick={() => toggleGroup(group.name)}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-2 hover:text-primary transition-colors w-full p-2 rounded-md hover:bg-accent/50"
            >
              {expandedGroups[group.name] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {group.name}
            </button>
            <div 
              className={cn(
                "space-y-2 transition-all duration-200",
                expandedGroups[group.name] ? "block" : "hidden"
              )}
            >
              {group.items.map((item, idx) => (
                <button 
                  key={`${group.name}-${item.name}-${idx}`}
                  className="p-4 rounded-md border border-border bg-background w-full text-left transition-all duration-200 hover:bg-accent/50 hover:border-primary hover:shadow-sm"
                  onClick={() => onItemClick(item, group.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-muted-foreground">
                        {item.moduleType}
                      </span>
                      <span className="font-medium">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-green-700 text-sm">Active</span>
                    </div>
                  </div>
                </button>
              ))}
              {group.items.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No items in this group
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 