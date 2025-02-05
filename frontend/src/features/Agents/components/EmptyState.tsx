import { Agent } from '../types';

interface EmptyStateProps {
  agent: Agent;
}

export function EmptyState({ agent }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-[560px] mx-auto px-4">
      {/* Agent Avatar */}
      <div className="w-20 h-20 rounded-lg bg-background-secondary flex items-center justify-center mb-6">
        <span className="text-4xl">{agent.emoji}</span>
      </div>

      {/* Agent Info */}
      <h1 className="text-2xl font-semibold text-center mb-2">{agent.name}</h1>
      <p className="text-muted-foreground text-center mb-8">{agent.description}</p>

      {/* Connected Tools */}
      <div className="flex flex-wrap gap-2 justify-center">
        {agent.tools.map((tool) => (
          <div 
            key={tool.id}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50"
          >
            {tool.icon ? (
              <span role="img" aria-label={tool.name}>{tool.icon}</span>
            ) : (
              <div className="h-5 w-5 rounded-sm bg-muted flex items-center justify-center">
                {tool.name[0]}
              </div>
            )}
            <span className="text-sm">{tool.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 