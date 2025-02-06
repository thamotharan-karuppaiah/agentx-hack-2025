import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { workflowService } from '@/services/workflowService';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
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

  // Calculate category counts dynamically
  const getCategoryCounts = () => {
    const counts: Record<string, number> = {
      'your-tools': workflows.length,
      'all-templates': mockTools.length
    };

    mockTools.forEach(tool => {
      tool.category.forEach(cat => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    return counts;
  };

  const categories = [
    { id: 'your-tools', label: 'Your tools' },
    { id: 'all-templates', label: 'All templates' },
    { id: 'popular', label: 'Popular' },
    { id: 'knowledge', label: 'Knowledge Integration' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'operations', label: 'Operations' },
  ].map(cat => ({
    ...cat,
    count: getCategoryCounts()[cat.label] || 0
  }));

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

      <div className="relative w-full overflow-hidden">
        <ScrollArea className="w-full" orientation="horizontal">
          <Tabs
            defaultValue="your-tools"
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-max" // Allow tabs to expand beyond container
          >
            <TabsList className="flex gap-2 p-1">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex gap-2 whitespace-nowrap"
                >
                  {category.label}
                  {category.count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {category.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="your-tools" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                {filteredTools(workflows.filter(w => w.status === 'published')).map((workflow) => (
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
        </ScrollArea>
      </div>
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
    setSelectedTool(tool.id);
  };

  const handleDeleteTool = (toolId: string) => {
    const newTools = tools.filter(t => t.id !== toolId);
    form.setValue('tools', newTools);
    if (selectedTool === toolId) {
      setSelectedTool(null);
    }
  };

  return (
    <div className="flex h-full">
      {tools.length === 0 && selectedTool !== 'add-new' ? (
        // Full width empty state
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center justify-center text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-accent/40 flex items-center justify-center mb-6">
              <div className="text-3xl">🛠️</div>
            </div>
            <h3 className="text-lg font-medium mb-2">No tools configured</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tools help your agent perform specific actions. Add tools to enhance your agent's capabilities
              and automate various tasks.
            </p>
            <Button
              onClick={() => setSelectedTool('add-new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first tool
            </Button>
          </div>
        </div>
      ) : (
        // Split view layout with list or add view
        <div className="flex w-full">
          {selectedTool === 'add-new' ? (
            <div className="flex-1 p-6">
              <AddToolView onAddTool={handleAddTool} existingTools={tools} />
            </div>
          ) : (
            <>
              {/* Left Sidebar - Tool List */}
              <div className="w-64 border-r">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Tool settings / All tools
                    </h3>
                  </div>

                  {/* Tools List */}
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-1">
                      {tools.length > 0 ? (
                        tools.map((tool: Tool) => (
                          <div
                            key={tool.id}
                            className={cn(
                              "flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent/50 group",
                              selectedTool === tool.id && "bg-accent"
                            )}
                            onClick={() => setSelectedTool(tool.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span>{tool.icon}</span>
                              <span className="text-sm">{tool.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTool(tool.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="w-12 h-12 rounded-full bg-accent/40 flex items-center justify-center mb-4">
                            <div className="text-2xl">🛠️</div>
                          </div>
                          <h3 className="text-sm font-medium mb-1">No tools configured</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Add tools to enhance your agent's capabilities
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTool('add-new')}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add your first tool
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Add Tool Button */}
                  <div className="p-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedTool('add-new')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add tool
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {selectedTool === 'add-new' ? (
                    <div className="p-6">
                      <AddToolView onAddTool={handleAddTool} existingTools={tools} />
                    </div>
                  ) : selectedTool ? (
                    <div className="p-6 space-y-6">
                      {/* Tool Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {tools.find(t => t.id === selectedTool)?.icon && (
                            <span className="text-xl">{tools.find(t => t.id === selectedTool)?.icon}</span>
                          )}
                          <h3 className="text-lg font-semibold">
                            {tools.find(t => t.id === selectedTool)?.name || 'New Tool'}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTool(selectedTool)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Tool Configuration Form */}
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name={`tools.${tools.findIndex(t => t.id === selectedTool)}.approvalMode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Approval mode</FormLabel>
                              <FormDescription>
                                Decide whether or not user approval is required to run
                              </FormDescription>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="required">Approval required</SelectItem>
                                  <SelectItem value="optional">Approval optional</SelectItem>
                                  <SelectItem value="none">No approval needed</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`tools.${tools.findIndex(t => t.id === selectedTool)}.maxApprovals`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max approvals asked before auto-run</FormLabel>
                              <FormDescription>
                                Enter the number of times this tool will ask for approval within a task before running automatically.
                              </FormDescription>
                              <FormControl>
                                <Input
                                  placeholder="No limit"
                                  type="number"
                                  {...field}
                                  onChange={e => field.onChange(e.target.value === '' ? 'no-limit' : Number(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`tools.${tools.findIndex(t => t.id === selectedTool)}.prompt`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prompt for how to use</FormLabel>
                              <FormDescription>
                                Describe how your agent should use this tool.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Defaults to: Completes a Google search for a query and returns the results."
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
                      Select a tool to configure or add a new one
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