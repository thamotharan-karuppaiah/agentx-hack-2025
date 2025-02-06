import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { PlusCircle, GitBranch, Workflow, Bot, ArrowRight, MessageSquare } from 'lucide-react';

interface FlowBuilderProps {
  form: UseFormReturn<any>;
}

export default function FlowBuilder({ form }: FlowBuilderProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Flow Builder</h2>
          <p className="text-sm text-muted-foreground">
            Define how your agents work together and handle different scenarios
          </p>
        </div>
        <Button variant="outline" disabled>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Flow
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="mb-6 relative">
          {/* Visual representation of a workflow */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center">
              <Bot className="h-6 w-6 text-muted-foreground" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Workflow className="h-24 w-24 text-muted-foreground/20" />
          </div>
        </div>

        <h3 className="text-lg font-medium mb-2 text-center">
          Design Your Agent Workflow
        </h3>
        
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          Create sophisticated workflows by connecting multiple agents. Define conditions, 
          branching logic, and collaboration patterns between agents.
        </p>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Route tasks based on content or metadata</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Create approval workflows and escalation paths</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Enable agent collaboration and task handoffs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Set conditional logic and decision trees</span>
          </div>
        </div>

        <Button className="mt-8" disabled>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Your First Flow
        </Button>
      </div>
    </div>
  );
} 