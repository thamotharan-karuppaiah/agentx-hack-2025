import { Agent } from '../types';
import { MessageSquare } from 'lucide-react';

interface EmptyStateProps {
  agent: Agent;
}

export const EmptyState = ({ agent }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
      <div className="w-16 h-16 mb-4 text-muted-foreground/50">
        <MessageSquare className="w-full h-full" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium mb-2">Start a New Task</h3>
      <p className="text-muted-foreground text-sm max-w-md">
        Type your message below to start a new conversation with {agent.name}
      </p>
    </div>
  );
}; 