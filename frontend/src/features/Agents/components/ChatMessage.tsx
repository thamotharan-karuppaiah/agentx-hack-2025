import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BotIcon, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Agent } from '../types';
import { MarkdownViewer } from '@/components/ui/markdown-viewer';

interface ChatMessageProps {
  message: {
    content: string;
    type: string;
    timestamp: string;
  };
  agent: Agent | null;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isLast?: boolean;
}

export function ChatMessage({ 
  message, 
  agent,
  showAvatar = true,
  showTimestamp = true,
  isLast = false 
}: ChatMessageProps) {
  const isAgent = message.type === 'assistant';

  return (
    <div className="flex items-start gap-3 px-4 py-3 group">
      {showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className={isAgent ? "bg-primary/10" : "bg-secondary"}>
            {isAgent ? (
              <BotIcon className="h-4 w-4 text-primary" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col flex-1 gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {isAgent ? agent?.name || 'Agent' : 'You'}
          </span>
          {showTimestamp && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <MarkdownViewer content={message.content} />
        </div>
      </div>
    </div>
  );
} 