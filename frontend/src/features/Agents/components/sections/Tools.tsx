import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { workflowService } from '@/services/workflowService';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, Copy, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Workflow } from '@/features/Workflow/types';

interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string[];
  approvalMode?: 'required' | 'optional' | 'none';
  maxApprovals?: number | 'no-limit';
  prompt?: string;
}

const mockTools: Tool[] = [
  {
    id: 'google-search',
    name: 'Google search',
    icon: '🔍',
    description: 'Search the web using Google',
    category: ['Popular', 'Knowledge Integration']
  },
  {
    id: 'tone-format',
    name: 'Change Tone and Format',
    icon: '✍️',
    description: "For Satya's Knowledge Q&A agent.",
    category: ['Popular', 'Marketing']
  },
  {
    id: 'hubspot-notes',
    name: 'Create company notes in HubSpot',
    icon: '📝',
    description: 'Create and update company notes in HubSpot',
    category: ['Sales Integrations', 'Operations']
  },
  {
    id: 'extract-content',
    name: 'Extract content from website',
    icon: '🌐',
    description: 'Extracts text content from a website URL.',
    category: ['Research', 'Knowledge Integration']
  },
  // Add more mock tools here
];

const categories = [
  { id: 'your-tools', label: 'Your tools' },
  { id: 'all-templates', label: 'All templates' },
  { id: 'popular', label: 'Popular', count: 1 },
  { id: 'knowledge', label: 'Knowledge Integration', count: 1 },
  { id: 'marketing', label: 'Marketing', count: 3 },
  { id: 'operations', label: 'Operations', count: 40 },
];

interface ToolsProps {
  form: UseFormReturn<any>;
}

function AddToolView({ onAddTool, existingTools }: { onAddTool: (tool: Tool) => void; existingTools: Tool[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('your-tools');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const data = await workflowService.getWorkflows();
        setWorkflows(data);
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
      }
    };

    if (activeCategory === 'your-tools') {
      fetchWorkflows();
    }
  }, [activeCategory]);

  const filteredTools = (tools: Tool[] | Workflow[]) => {
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool as Tool).description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const isToolAdded = (toolId: string) => {
    return existingTools.some(t => t.id === toolId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Add new tool</h2>
        <p className="text-sm text-muted-foreground">
          Equip your agent with a new tool
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for tool..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <Tabs defaultValue="your-tools" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex gap-2">
              {category.label}
              {category.count && (
                <span className="text-xs text-muted-foreground">
                  {category.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="your-tools" className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredTools(workflows).map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{(workflow as Workflow).emoji || '🔄'}</span>
                  <div>
                    <h3 className="font-medium">{workflow.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {workflow.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddTool({
                    id: workflow.id,
                    name: workflow.name,
                    icon: (workflow as Workflow).emoji || '🔄',
                    description: workflow.description || '',
                    category: ['Your tools']
                  })}
                  disabled={isToolAdded(workflow.id)}
                >
                  {isToolAdded(workflow.id) ? 'Added' : 'Add'}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {categories.slice(1).map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredTools(mockTools)
                .filter(tool => (tool as Tool).category.includes(category.label))
                .map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{(tool as Tool).icon}</span>
                      <div>
                        <h3 className="font-medium">{tool.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddTool(tool as Tool)}
                      disabled={isToolAdded(tool.id)}
                    >
                      {isToolAdded(tool.id) ? 'Added' : 'Add'}
                    </Button>
                  </div>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function Tools({ form }: ToolsProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const tools = form.watch('tools') || [];

  const handleAddTool = (tool: Tool) => {
    const newTool = {
      ...tool,
      approvalMode: 'required',
      maxApprovals: 'no-limit',
      prompt: `Defaults to: "Completes a ${tool.name} and returns the results."`,
    };

    form.setValue('tools', [...tools, newTool]);
  };

  const handleDeleteTool = (toolId: string) => {
    form.setValue('tools', tools.filter((t: Tool) => t.id !== toolId));
  };

  const updateToolConfig = (toolId: string, field: keyof Tool, value: any) => {
    form.setValue('tools', tools.map((t: Tool) => 
      t.id === toolId ? { ...t, [field]: value } : t
    ));
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left Sidebar - Tool List */}
      <div className="w-64 border-r">
        <div className="p-4">
          <h3 className="text-sm font-medium mb-4">Tool settings / All tools</h3>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2">
              {tools.map((tool: Tool) => (
                <div
                  key={tool.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                    selectedTool === tool.id && "bg-accent"
                  )}
                  onClick={() => setSelectedTool(tool.id)}
                >
                  <span>{tool.icon}</span>
                  <span className="text-sm">{tool.name}</span>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => setSelectedTool('add-new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add tool
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Content - Tool Configuration */}
      <div className="flex-1 p-4">
        <ScrollArea className="h-[calc(100vh-300px)]">
          {selectedTool === 'add-new' ? (
            <AddToolView onAddTool={handleAddTool} existingTools={tools} />
          ) : selectedTool ? (
            <div className="space-y-6">
              {tools.map((tool: Tool) => {
                if (tool.id !== selectedTool) return null;
                
                return (
                  <div key={tool.id} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{tool.icon}</span>
                        <h2 className="text-lg font-semibold">{tool.name}</h2>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTool(tool.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <FormLabel>Approval mode</FormLabel>
                        <FormDescription>
                          Decide whether or not user approval is required to run
                        </FormDescription>
                        <Select
                          value={tool.approvalMode}
                          onValueChange={(value) => updateToolConfig(tool.id, 'approvalMode', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="required">Approval required</SelectItem>
                            <SelectItem value="optional">Optional</SelectItem>
                            <SelectItem value="none">No approval needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FormLabel>Max approvals asked before auto-run</FormLabel>
                        <FormDescription>
                          Enter the number of times this tool will ask for approval within a task before running automatically.
                        </FormDescription>
                        <Input
                          value={tool.maxApprovals === 'no-limit' ? '' : tool.maxApprovals}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 'no-limit' : parseInt(e.target.value);
                            updateToolConfig(tool.id, 'maxApprovals', value);
                          }}
                          placeholder="No limit"
                        />
                      </div>

                      <div>
                        <FormLabel>Prompt for how to use</FormLabel>
                        <FormDescription>
                          Describe how your agent should use this tool.
                        </FormDescription>
                        <Textarea
                          value={tool.prompt}
                          onChange={(e) => updateToolConfig(tool.id, 'prompt', e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-4">
              Select a tool to configure or add a new one
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
} 