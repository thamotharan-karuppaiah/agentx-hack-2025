import { Bot, Network, TowerControl as Tool, LineChart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onHandleCreateAgent: () => void;
}

export function CRMEmptyState({ onHandleCreateAgent }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center px-4">
      <div className="space-y-6 max-w-[600px]">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Sales & CRM AI Assistants</h1>
          <p className="text-muted-foreground">
            Create AI agents to supercharge your sales and customer relationship management. Automate lead nurturing and customer engagement.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 max-w-[500px] mx-auto">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Bot className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Lead Qualification</h3>
            <p className="text-sm text-muted-foreground">
              Automatically qualify and score incoming leads
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Network className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Customer Outreach</h3>
            <p className="text-sm text-muted-foreground">
              Personalized follow-ups and engagement
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Tool className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Deal Management</h3>
            <p className="text-sm text-muted-foreground">
              Track and update deal progress automatically
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <LineChart className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Sales Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Generate insights from sales activities
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
            Create Your First Sales Agent
          </Button>
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Learn more about sales automation →
          </a>
        </div>
      </div>
    </div>
  );
} 