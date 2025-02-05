import { TaskHeader } from './TaskHeader';
import { ChatMessage } from './ChatMessage';
import { ToolUsage } from './ToolUsage';
import { AgentExecution } from '@/services/agentExecutionService';

interface ChatHistoryProps {
  execution: AgentExecution | null;
}

// Mock conversation for testing
const mockExecution = {
  id: '1',
  title: 'Greeting',
  triggeredBy: {
    name: 'Thamotharan K'
  },
  createdAt: new Date().toISOString(),
  messages: [
    {
      id: '1',
      type: 'user',
      content: 'hi',
      timestamp: new Date().toISOString(),
      sender: {
        name: 'Thamotharan K'
      }
    },
    {
      id: '2',
      type: 'system',
      content: 'Used Google search',
      timestamp: new Date().toISOString(),
      sender: {
        name: 'System'
      },
      tool: {
        id: 'google_search',
        input: 'Google search',
        messageId: '1'
      }
    },
    {
      id: '3',
      type: 'agent',
      content: 'Hello! How can I assist you today?',
      timestamp: new Date().toISOString(),
      sender: {
        name: 'my agent',
        avatar: ''
      }
    }
  ]
};

export function ChatHistory({ execution = mockExecution }: ChatHistoryProps) {
  if (!execution) return null;
  execution = mockExecution as AgentExecution;

  return (
    <div className="w-full flex-grow max-w-[760px] pt-[24px]">
      <div className="w-full">
        <div className="flex flex-col w-full">
          <TaskHeader
            title={execution.title}
            triggeredBy={execution.triggeredBy.name}
            timestamp={execution.createdAt}
            content={execution.messages[0]?.content}
          />
          {execution.messages.length && <>
            <div className="w-[36px] flex flex-col h-full">
              <div className="inline-flex mx-auto border-r-2 border-border-default h-full flex-grow min-h-[24px] relative z-10 transition-[height]">
              </div>
            </div>
          </>}
          {execution.messages.map((message, index) => (
            <div key={message.id}>
              {message.type !== 'system' ? (
                <ChatMessage
                  message={message}
                  showAvatar={true}
                  showTimestamp={true}
                  isLast={index === execution.messages.length - 1}
                />) : (
                <ToolUsage
                  timestamp={message.timestamp}
                  tool={message.tool}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 