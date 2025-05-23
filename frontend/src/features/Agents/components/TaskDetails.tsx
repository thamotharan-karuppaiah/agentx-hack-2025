import { Agent } from '../types';
import { AgentExecution } from '@/services/agentExecutionService';
import { Button } from '@/components/ui/button';
import { Share, InfoIcon, MoreHorizontal, Menu, BotIcon, Settings } from 'lucide-react';
import { ChatHistory } from './ChatHistory';
import { EmptyState } from './EmptyState';
import { ChatInput } from './ChatInput';
import { PropertyPane } from './PropertyPane';
import { formatDistanceToNow } from 'date-fns';
import { agentExecutionService } from '@/services/agentExecutionService';
import { useEffect, useRef } from 'react';

interface TaskDetailsProps {
  agent: Agent | null;
  selectedExec: AgentExecution | null;
  onEditClick: () => void;
  onExecutionUpdate: (execution: AgentExecution) => void;
  onRefreshExecutions: () => Promise<void>;
}

export const TaskDetails = ({ 
  agent, 
  selectedExec, 
  onEditClick, 
  onExecutionUpdate,
  onRefreshExecutions 
}: TaskDetailsProps) => {
  const pollingInterval = useRef<NodeJS.Timeout>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedExec?.history]);

  const startPolling = () => {
    if (!selectedExec) return;

    const pollExecution = async () => {
      try {
        const updatedExecution = await agentExecutionService.getExecution(selectedExec.id);
        
        if (onExecutionUpdate) {
          onExecutionUpdate(updatedExecution);
        }

        // Stop polling when execution is complete or idle
        if (updatedExecution.status === 'CLOSED' || updatedExecution.status === 'IDLE') {
          stopPolling();
        }
      } catch (error) {
        console.error('Failed to poll execution:', error);
        stopPolling();
      }
    };

    pollingInterval.current = setInterval(pollExecution, 2000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = undefined;
    }
  };

  useEffect(() => {
    if (selectedExec?.status === 'AGENT_IN_PROGRESS' || selectedExec?.status === 'TOOL_IN_PROGRESS') {
      startPolling();
    }

    return () => stopPolling();
  }, [selectedExec?.id, selectedExec?.status]);

  const handleInitialMessage = async (message: string) => {
    if (!agent?.id) return;
    
    try {
      // Create temporary execution with initial message
      const tempExecution: AgentExecution = {
        id: `temp-${Date.now()}`,
        agentId: agent.id,
        title: message.slice(0, 50), // Use first 50 chars as temp title
        status: 'AGENT_IN_PROGRESS',
        create_date: new Date().toISOString(),
        last_run_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        triggered_by: '1',
        history: [{
          type: 'human',
          content: message,
          timestamp: new Date().toISOString()
        }],
        tool_state: {}
      };

      // Update UI immediately
      onExecutionUpdate(tempExecution);

      // Make actual API call
      const newExecution = await agentExecutionService.createNewExecution(
        agent.id,
        message
      );
      
      // Update with real execution data
      onExecutionUpdate(newExecution);
      await onRefreshExecutions();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleContinueChat = async (message: string) => {
    if (!agent?.id || !selectedExec?.id) return;

    try {
      // Create temporary message in current execution
      const tempExecution: AgentExecution = {
        ...selectedExec,
        status: 'AGENT_IN_PROGRESS',
        last_run_at: new Date().toISOString(),
        history: [
          ...selectedExec.history,
          {
            type: 'human',
            content: message,
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Update UI immediately
      onExecutionUpdate(tempExecution);

      // Make actual API call
      const updatedExecution = await agentExecutionService.continueExecution(
        agent.id,
        selectedExec.id,
        message
      );

      // Update with real execution data
      onExecutionUpdate(updatedExecution);
      await onRefreshExecutions();
    } catch (error) {
      console.error('Failed to continue chat:', error);
    }
  };

  return (
    <div className="flex flex-col justify-start w-full h-full bg-background-secondary">
      {/* Header */}
      <header className="w-[calc(100%-8px)] mt-2 px-2 xl:px-0 bg-white">
        <div className="w-full min-h-0 h-[48px] flex items-center px-4 md:px-6 lg:px-8 bg-background-primary border border-border-default rounded-t-sm">
          <div className="block xl:hidden mr-2">
            <Button variant="ghost" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Breadcrumb */}
          <div className="group/title flex items-center justify-center space-x-2 shrink truncate">
            <div className="flex items-center h-full">
              <div className="rounded-sm aspect-square shrink-0 flex items-center justify-center overflow-hidden bg-background-primary bg-cover h-6 w-6 mr-2">
                <BotIcon className="h-4 w-4" />
              </div>
              <span className="text-muted-foreground truncate shrink transition-colors">
                {agent?.name}
              </span>
            </div>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground truncate max-w-xs lg:max-w-sm">
              {selectedExec?.title || 'New Task'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-1 ml-auto shrink-0">
            <Button variant="ghost" className="hidden md:flex">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <InfoIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={onEditClick}
            >
              <Settings className="h-4 w-4 mr-2" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full flex flex-1 min-h-0 xl:pl-0 pr-2 pt-0 bg-white">
        {/* Center Content */}
        <div className="flex-grow h-full flex flex-col elevation-raw-bulge bg-background-primary relative xl:rounded-r-none border border-t-0 border-border-default">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto flex-grow flex flex-col px-m py-m 2xl:py-xl items-center hide-scroll-bar" 
            id="scroll-container"
          >
            {selectedExec ? (
              <ChatHistory execution={selectedExec} agent={agent} />
            ) : (
              agent && <EmptyState agent={agent} />
            )}
            <div className="sticky z-40 w-full px-xxs py-m bg-gradient-to-t from-white via-white via-90% to-transparent -bottom-xl">
              <div className="relative">
                <ChatInput 
                  onSubmit={selectedExec ? handleContinueChat : handleInitialMessage}
                  placeholder={selectedExec ? "Type a message..." : "Start a new task..."}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-[380px] h-full shrink-0 hidden xl:block elevation-raw-bulge border border-border-default border-l-0 border-t-0 bg-background-primary overflow-y-auto">
          <PropertyPane execution={selectedExec} agent={agent} />
        </div>
      </div>

      {/* Footer */}
      <div className="mb-2 pr-2 w-full bg-white">
        <footer className="w-full flex items-center justify-center border border-t-0 rounded-b-sm border-border-default bg-background-primary h-[33px]">
          <div className="hidden lg:inline-flex">
            <span className="text-muted-foreground text-sm">
              Last updated {formatDistanceToNow(new Date(selectedExec?.last_run_at || new Date().toISOString()), { addSuffix: true })}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}; 