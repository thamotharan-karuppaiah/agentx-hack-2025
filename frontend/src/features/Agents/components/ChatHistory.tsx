import { TaskHeader } from './TaskHeader';
import { ChatMessage } from './ChatMessage';
import { ToolUsage } from './ToolUsage';
import { AgentExecution } from '@/services/agentExecutionService';
import { Agent } from '../types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BotIcon } from 'lucide-react';

interface ChatHistoryProps {
  execution: AgentExecution;
  agent: Agent | null;
}

export function ChatHistory({ execution, agent }: ChatHistoryProps) {
  // Get all messages except the first one (trigger message)
  const messages = execution.history.slice(1);

  return (
    <div className="w-full flex-grow max-w-[760px] pt-[24px]">
      <div className="w-full">
        <div className="flex flex-col w-full">
          <TaskHeader
            title={execution.title}
            triggeredBy={'Agent'}
            timestamp={execution.create_date}
            content={execution.history[0]?.content || ''}
          />

          {messages.length > 0 && (
            <div className="w-[36px] flex flex-col h-full">
              <div className="inline-flex mx-auto border-r-2 border-border-default h-full flex-grow min-h-[24px] relative z-10 transition-[height]">
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={message.timestamp}>
              {message.type !== 'system' ? (
                <ChatMessage
                  agent={agent}
                  message={message}
                  showAvatar={true}
                  showTimestamp={true}
                  isLast={index === messages.length - 1}
                />
              ) : (
                <ToolUsage
                  timestamp={message.timestamp}
                  tool={message.tool || undefined}
                />
              )}
            </div>
          ))}

          {/* Typing indicator with placeholder to prevent layout shifts */}
          {execution.status === 'AGENT_IN_PROGRESS' && (
            <div className="h-[76px] relative">
              <div className="absolute w-full flex items-start gap-3 px-4 py-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10">
                    <BotIcon className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {agent?.name || 'Agent'}
                    </span>
                    <span className="text-xs text-muted-foreground">is typing</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce [animation-delay:0.2s]">●</span>
                    <span className="animate-bounce [animation-delay:0.4s]">●</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 