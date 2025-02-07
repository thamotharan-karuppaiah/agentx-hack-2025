import { Agent } from '../types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, ChevronDown, BotIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { AgentExecution } from '@/services/agentExecutionService';
import { formatDistanceToNow } from 'date-fns';

interface QueueItemDetailsProps {
  agent: Agent;
  selectedQueue: {
    name: string;
    moduleType: string;
    triggerType: string;
    status: 'active';
  } | null;
  executions: AgentExecution[];
  onEditClick: () => void;
}

export function QueueItemDetails({ agent, selectedQueue, executions, onEditClick }: QueueItemDetailsProps) {
  const [expandedSections, setExpandedSections] = useState({
    inProgress: true,
    upcoming: true,
    failed: true,
    processed: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!selectedQueue) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a queue to view details
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b">
        <div className="px-6 h-[60px] flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{agent.name}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="truncate">{selectedQueue.moduleType}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="truncate text-foreground">{selectedQueue.name}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onEditClick} className="shrink-0">
            Edit Integration
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <div className="px-6 py-6 space-y-6">
              {/* In Progress Section */}
              <div>
                <button
                  onClick={() => toggleSection('inProgress')}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors w-full text-left mb-4"
                >
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    !expandedSections.inProgress && "-rotate-90"
                  )} />
                  In progress
                </button>
                <div className={cn(
                  "space-y-2 transition-all",
                  expandedSections.inProgress ? "block" : "hidden"
                )}>
                  {executions.filter((execution) => 
                    execution.trigger_type === selectedQueue.triggerType
                  ).length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4 bg-muted/40 rounded-md">
                      No tasks in progress
                    </div>
                  ) : (
                    executions
                      .filter((execution) => 
                        execution.trigger_type === selectedQueue.triggerType
                      )
                      .map((execution) => (
                        <div 
                          key={execution.id}
                          className="flex items-center gap-3 p-3 rounded-md border border-border-default hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <BotIcon className="h-4 w-4 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium truncate">
                                {execution.history?.[0]?.content || 'Untitled Task'}
                              </h4>
                              {execution.status === 'TOOL_IN_PROGRESS' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  Tool Running
                                </span>
                              )}
                              {execution.status === 'AGENT_IN_PROGRESS' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                  Agent Thinking
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>
                                Started {formatDistanceToNow(new Date(execution.create_date), { addSuffix: true })}
                              </span>
                              <span>•</span>
                              <span>
                                Last update {formatDistanceToNow(new Date(execution.last_run_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>

                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Upcoming Queue Section */}
              <div>
                <button
                  onClick={() => toggleSection('upcoming')}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors w-full text-left mb-4"
                >
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    !expandedSections.upcoming && "-rotate-90"
                  )} />
                  Upcoming queue
                </button>
                <div className={cn(
                  "space-y-2 transition-all",
                  expandedSections.upcoming ? "block" : "hidden"
                )}>
                  <div className="text-sm text-muted-foreground text-center py-4 bg-muted/40 rounded-md">
                    No upcoming tasks
                  </div>
                </div>
              </div>

              {/* Failed Section */}
              <div>
                <button
                  onClick={() => toggleSection('failed')}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors w-full text-left mb-4"
                >
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    !expandedSections.failed && "-rotate-90"
                  )} />
                  Failed
                </button>
                <div className={cn(
                  "space-y-2 transition-all",
                  expandedSections.failed ? "block" : "hidden"
                )}>
                  <div className="text-sm text-muted-foreground text-center py-4 bg-muted/40 rounded-md">
                    No failed tasks
                  </div>
                </div>
              </div>

              {/* Processed Section */}
              <div>
                <button
                  onClick={() => toggleSection('processed')}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors w-full text-left mb-4"
                >
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    !expandedSections.processed && "-rotate-90"
                  )} />
                  Processed
                </button>
                <div className={cn(
                  "space-y-2 transition-all",
                  expandedSections.processed ? "block" : "hidden"
                )}>
                  <div className="text-sm text-muted-foreground text-center py-4 bg-muted/40 rounded-md">
                    No processed tasks
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
} 