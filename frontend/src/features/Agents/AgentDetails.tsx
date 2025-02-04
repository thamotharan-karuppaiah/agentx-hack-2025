import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { agentService } from '@/services/agentService';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from './types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AgentDetails() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId) return;
      
      try {
        setLoading(true);
        const data = await agentService.getAgent(agentId);
        setAgent(data);
      } catch (error) {
        console.error('Failed to fetch agent:', error);
        toast({
          title: "Error",
          description: "Failed to fetch agent details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [agentId, toast]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
        <div className="grid gap-4 mt-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return <div>Agent not found</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{agent.emoji}</span>
        <h1 className="text-2xl font-bold">{agent.name}</h1>
      </div>
      <p className="text-muted-foreground">{agent.description}</p>
      
      <div className="mt-6 space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">System Prompt</h2>
          <div className="border rounded-lg p-4 bg-muted/50">
            {agent.systemPrompt}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Tools</h2>
          <div className="grid gap-2">
            {agent.tools.map((tool) => (
              <div key={tool.id} className="flex items-center gap-2 p-2 border rounded-md">
                <span>{tool.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 