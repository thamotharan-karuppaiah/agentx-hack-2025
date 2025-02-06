import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Search, Copy, Trash2, Bot } from 'lucide-react';
import { cn } from "@/lib/utils";
import { agentService } from '@/services/agentService';
import type { Agent } from '../../types';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubAgentConfig {
  id: string;
  name: string;
  description: string;
  role: 'assistant' | 'specialist' | 'supervisor';
  triggerMode: 'manual' | 'auto' | 'conditional';
  prompt: string;
}

function AddSubAgentView({ onAddAgent, existingAgents }: { 
  onAddAgent: (agent: SubAgentConfig) => void; 
  existingAgents: SubAgentConfig[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agents = await agentService.getAgents();
        setAvailableAgents(agents);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      }
    };

    fetchAgents();
  }, []);

  const filteredAgents = availableAgents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAgentAdded = (agentId: string) => {
    return existingAgents.some(a => a.id === agentId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Add sub-agent</h2>
        <p className="text-sm text-muted-foreground">
          Connect other agents to work together
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-accent/40 flex items-center justify-center">
                <Bot className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddAgent({
                id: agent.id,
                name: agent.name,
                description: agent.description || '',
                role: 'assistant',
                triggerMode: 'manual',
                prompt: `Default instructions for ${agent.name}`
              })}
              disabled={isAgentAdded(agent.id)}
            >
              {isAgentAdded(agent.id) ? 'Added' : 'Add'}
            </Button>
          </div>
        ))}

        {filteredAgents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No agents found matching your search
          </div>
        )}
      </div>
    </div>
  );
}

interface SubAgentsProps {
  form: UseFormReturn<any>;
}

export default function SubAgents({ form }: SubAgentsProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const subAgents = form.watch('subAgents') || [];

  const handleDeleteAgent = (agentId: string) => {
    const newAgents = subAgents.filter(a => a.id !== agentId);
    form.setValue('subAgents', newAgents);
    if (selectedAgent === agentId) {
      setSelectedAgent(null);
    }
  };

  const handleAddAgent = (agent: SubAgentConfig) => {
    form.setValue('subAgents', [...subAgents, agent]);
    setSelectedAgent(agent.id);
  };

  return (
    <div className="flex h-full">
      {subAgents.length === 0 && selectedAgent !== 'add-new' ? (
        // Full width empty state
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center justify-center text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-accent/40 flex items-center justify-center mb-6">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No sub-agents added</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Connect multiple agents to work together. Sub-agents can help with specialized tasks, 
              provide oversight, or assist the main agent with complex operations.
            </p>
            <Button
              onClick={() => setSelectedAgent('add-new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first sub-agent
            </Button>
          </div>
        </div>
      ) : (
        // Split view layout with list or add view
        <div className="flex w-full">
          {selectedAgent === 'add-new' ? (
            <div className="flex-1 p-6">
              <AddSubAgentView onAddAgent={handleAddAgent} existingAgents={subAgents} />
            </div>
          ) : (
            <>
              {/* Left Sidebar - Agent List */}
              <div className="w-64 border-r">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Sub-agent settings
                    </h3>
                  </div>

                  {/* Agents List */}
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-1">
                      {subAgents.length > 0 ? (
                        subAgents.map((agent: SubAgentConfig) => (
                          <div
                            key={agent.id}
                            className={cn(
                              "flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent/50 group",
                              selectedAgent === agent.id && "bg-accent"
                            )}
                            onClick={() => setSelectedAgent(agent.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              <span className="text-sm">{agent.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAgent(agent.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="w-12 h-12 rounded-full bg-accent/40 flex items-center justify-center mb-4">
                            <Bot className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="text-sm font-medium mb-1">No sub-agents added</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Add other agents to work together with this agent
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAgent('add-new')}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add your first sub-agent
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Add Agent Button */}
                  <div className="p-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedAgent('add-new')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add sub-agent
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Content - Agent Configuration or Add Agent View */}
              <div className="flex-1">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {selectedAgent === 'add-new' ? (
                    <div className="p-6">
                      <AddSubAgentView onAddAgent={handleAddAgent} existingAgents={subAgents} />
                    </div>
                  ) : selectedAgent ? (
                    <div className="p-6 space-y-6">
                      {/* Agent Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5" />
                          <h3 className="text-lg font-semibold">
                            {subAgents.find(a => a.id === selectedAgent)?.name}
                          </h3>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const newAgents = subAgents.filter(a => a.id !== selectedAgent);
                            form.setValue('subAgents', newAgents);
                            setSelectedAgent(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Agent Configuration Form */}
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name={`subAgents.${subAgents.findIndex(a => a.id === selectedAgent)}.role`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormDescription>
                                Define how this agent will collaborate with the main agent
                              </FormDescription>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="assistant">Assistant</SelectItem>
                                  <SelectItem value="specialist">Specialist</SelectItem>
                                  <SelectItem value="supervisor">Supervisor</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`subAgents.${subAgents.findIndex(a => a.id === selectedAgent)}.triggerMode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trigger mode</FormLabel>
                              <FormDescription>
                                Choose when this agent should be activated
                              </FormDescription>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">Manual trigger</SelectItem>
                                  <SelectItem value="auto">Auto trigger</SelectItem>
                                  <SelectItem value="conditional">Conditional</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`subAgents.${subAgents.findIndex(a => a.id === selectedAgent)}.prompt`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instructions</FormLabel>
                              <FormDescription>
                                Provide specific instructions for this sub-agent
                              </FormDescription>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter instructions for how this agent should assist..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Select a sub-agent to configure or add a new one
                    </div>
                  )}
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 