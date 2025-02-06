import { Bot, Network, TowerControl as Tool, LineChart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onHandleCreateAgent: () => void;
}

export function ServiceDeskEmptyState({ onHandleCreateAgent }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center px-4">
      <div className="space-y-6 max-w-[600px]">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Service Desk Automation</h1>
          <p className="text-muted-foreground">
            Deploy AI agents to enhance your service desk operations. Automate ticket handling, user support, and service delivery.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 max-w-[500px] mx-auto">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Bot className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Ticket Triage</h3>
            <p className="text-sm text-muted-foreground">
              Automatically categorize and route incoming tickets
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Network className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Knowledge Base</h3>
            <p className="text-sm text-muted-foreground">
              Provide instant answers from your knowledge base
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Tool className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Password Reset</h3>
            <p className="text-sm text-muted-foreground">
              Automate common password reset requests
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <LineChart className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Performance Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Monitor resolution times and satisfaction rates
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button 
            size="lg" 
            onClick={onHandleCreateAgent}
            className="px-8"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Service Desk Agent
          </Button>
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Learn more about service desk automation →
          </a>
        </div>
      </div>
    </div>
  );
} 