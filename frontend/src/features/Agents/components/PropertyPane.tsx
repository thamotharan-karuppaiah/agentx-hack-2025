import { AgentExecution } from '@/services/agentExecutionService';
import { Button } from '@/components/ui/button';
import { Pause, CheckCircle, Zap, Settings2, Clock, Coins, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Agent } from '../types';

interface PropertyPaneProps {
  execution: AgentExecution | null;
  agent: Agent | null;
}

export function PropertyPane({ execution, agent }: PropertyPaneProps) {
  if (!execution) return null;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Properties</h2>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Button variant="outline" className="flex-1 text-xs w-auto min-w-auto">
            <Pause className="h-4 w-4 mr-1 text-destructive" />
            Pause Task
          </Button>
          <Button variant="outline" className="flex-1 text-xs w-auto min-w-auto">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            Mark as complete
          </Button>
        </div>

        {/* Triggered By */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">Triggered by</span>
          </div>
          <span className="text-xs">{ execution.trigger_type === 'manual' ? 'You' : execution.trigger_type}</span>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">Status</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-xs">{execution.status}</span>
        </div>
      </div>

      {/* Date Created */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">Date created</span>
        </div>
        <span className="text-xs">
          {format(new Date(execution.create_date), 'MMM d yyyy @ h:mm a')}
        </span>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Schedule</h3>
        <span className="text-xs text-muted-foreground">No scheduled actions</span>
      </div>

      {/* Connected Tools */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Connected tools</h3>
        <div className="space-y-2">
          {agent?.tools?.map((tool) => (
            <div key={tool.id} className="flex items-center gap-2">
              {tool.icon ? (
                <span role="img" aria-label={tool.name}>{tool.icon}</span>
              ) : (
                <div className="h-5 w-5 rounded-sm bg-muted flex items-center justify-center">
                  {tool.name[0]}
                </div>
              )}
              <span className="text-xs">{tool.name}</span>
            </div>
          ))}
          {(!agent?.tools || agent.tools.length === 0) && (
            <span className="text-xs text-muted-foreground">No connected tools</span>
          )}
        </div>
      </div>

      {/* Connected Agents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Connected agents</h3>
        {(!agent?.connectedAgents || agent.connectedAgents.length === 0) && (
          <span className="text-xs text-muted-foreground">No connected agents</span>
        )}
      </div>
    </div>
  );
} 