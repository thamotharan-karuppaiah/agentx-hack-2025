import { Bot, Network, TowerControl as Tool, LineChart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onHandleCreateAgent: () => void;
}

export function ITSMEmptyState({ onHandleCreateAgent }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center px-4">
      <div className="space-y-6 max-w-[600px]">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Build Your Enterprise AI Workforce</h1>
          <p className="text-muted-foreground">
            Create specialized AI agents to transform your enterprise operations. From IT service management to HR and finance, 
            automate workflows across departments for enhanced efficiency and employee experience.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 max-w-[500px] mx-auto">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Bot className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">IT Service Management</h3>
            <p className="text-sm text-muted-foreground">
              Automate incident response, change management, and service requests
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Network className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">HR & Employee Experience</h3>
            <p className="text-sm text-muted-foreground">
              Streamline onboarding, benefits, and employee support
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Tool className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Finance & Operations</h3>
            <p className="text-sm text-muted-foreground">
              Handle expense processing, budgeting, and compliance tasks
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <LineChart className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Enterprise Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Monitor KPIs and generate insights across departments
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
            Create Your First Enterprise Agent
          </Button>
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Learn more about enterprise automation →
          </a>
        </div>
      </div>
    </div>
  );
} 