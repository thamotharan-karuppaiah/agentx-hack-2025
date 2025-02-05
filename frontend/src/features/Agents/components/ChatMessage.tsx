import { Edit, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { BotIcon } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    type: 'user' | 'agent' | 'system';
    timestamp: string;
    sender: {
      name: string;
      avatar?: string;
    };
  };
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isLast?: boolean;
}

export function ChatMessage({ message, showAvatar = true, showTimestamp = true , isLast = false }: ChatMessageProps) {
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between space-x-4 w-full relative">
        <div className="flex space-x-2 w-full">
          {showAvatar && (
            <div className="shrink-0 w-[36px] hidden md:flex flex-col h-full">
              <div className="flex items-center justify-center shrink-0 relative rounded-md bg-background-primary elevation-bulge h-[36px]">
                {message.type === 'agent' ? (
                  <BotIcon className="h-6 w-6" />
                ) : (
                  <div className="flex items-center uppercase">
                    <span className="text-lg font-bold">{message.sender.name[0]}</span>
                  </div>
                )}
              </div>
             { !isLast && <div className="inline-flex mx-auto border-r-2 border-border-default h-full flex-grow min-h-[14px] relative z-10 transition-[height] mt-1" />}
            </div>
          )}
          
          <div className="shrink flex flex-col w-full group/action relative px-2 mb-[36px]">
            <div className="truncate flex items-center h-[36px]">
              <span className="text-sm font-medium">
                <span className="text-link">{message.sender.name}</span>
                {message.type === 'agent' ? ' provided an update: ' : ' replied with the following: '}
              </span>
            </div>
            
            <div className="w-full flex flex-col mt-2">
              <div className="flex flex-col rounded-md bg-background-primary elevation-bulge">
                <div className="flex items-start space-x-2 p-4">
                  <div className="flex flex-col w-full">
                    <div className="prose prose-sm">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 w-full mt-2 hidden">
              <div className="flex items-center w-full justify-between">
                <div className="flex items-center space-x-1 opacity-0 group-hover/action:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Good
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Bad
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showTimestamp && (
          <div className="hidden md:flex items-center absolute right-2 h-[36px]">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 