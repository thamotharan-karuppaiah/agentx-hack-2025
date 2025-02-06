import { Wrench, Zap, Bot, Workflow, Blocks, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onHandleCreateTool: () => void;
}

export function ToolsEmptyState({ onHandleCreateTool }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center px-4">
      <div className="space-y-6 max-w-[600px]">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Build Tools for Your AI Workforce</h1>
          <p className="text-muted-foreground">
            Create specialized tools to empower your AI agents. From data processing to system integrations, 
            build the capabilities your agents need to automate complex workflows effectively.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 max-w-[500px] mx-auto">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Wrench className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">System Integration Tools</h3>
            <p className="text-sm text-muted-foreground">
              Connect with enterprise systems, databases, and third-party services
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Bot className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Agent Capabilities</h3>
            <p className="text-sm text-muted-foreground">
              Extend agent abilities with specialized processing tools
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Workflow className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Workflow Automation</h3>
            <p className="text-sm text-muted-foreground">
              Create tools for complex multi-step business processes
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <Blocks className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Data Processing</h3>
            <p className="text-sm text-muted-foreground">
              Build tools for data transformation and analysis
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button 
            size="lg" 
            onClick={onHandleCreateTool}
            className="px-8"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Enterprise Tool
          </Button>
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Learn more about building enterprise tools →
          </a>
        </div>
      </div>
    </div>
  );
} 