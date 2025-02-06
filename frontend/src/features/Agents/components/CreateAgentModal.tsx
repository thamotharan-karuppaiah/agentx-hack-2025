import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import AgentProfile from './sections/AgentProfile';
import AgentInstructions from './sections/AgentInstructions';
import Tools from './sections/Tools';
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { agentService } from '@/services/agentService';
import { Loader2 } from 'lucide-react';
import { Agent } from '../types';
import Integrations from './sections/Integrations';
import FlowBuilder from './sections/FlowBuilder';
import Schedules from './sections/Schedules';
import KnowledgeBase from './sections/KnowledgeBase';
import SubAgents from './sections/SubAgents';
// import CoreInstructions from './sections/CoreInstructions';
// import FlowBuilder from './sections/FlowBuilder';
// import Abilities from './sections/Abilities';
// import Subagents from './sections/Subagents';
// import Metadata from './sections/Metadata';
// import AdvancedSettings from './sections/AdvancedSettings';
// import ConfigureTemplate from './sections/ConfigureTemplate';
// import TaskViews from './sections/TaskViews';

const formSchema = z.object({
  // Agent Profile
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  emoji: z.string(),
  // Triggers
  triggers: z.array(z.object({
    type: z.string(),
    config: z.record(z.any())
  })).optional(),
  // Instructions
  systemPrompt: z.string(),
  // Tools
  tools: z.array(z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    approvalMode: z.enum(['required', 'optional', 'none']),
    maxApprovals: z.union([z.number(), z.literal('no-limit')]),
    prompt: z.string()
  })),
  // Sub-agents
  subAgents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    role: z.enum(['assistant', 'specialist', 'supervisor']),
    triggerMode: z.enum(['manual', 'auto', 'conditional']),
    prompt: z.string()
  })).optional(),
  // Integrations
  integrations: z.array(z.object({
    id: z.string(),
    moduleId: z.string(),
    moduleName: z.string(),
    moduleIcon: z.string(),
    triggerType: z.string(),
    triggerName: z.string(),
    required: z.boolean().optional()
  })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Create a type for section categories
interface SectionCategory {
  id: string;
  label: string;
  sections: {
    id: string;
    label: string;
    icon: string;
    component: React.ComponentType<any>;
  }[];
}

// Organize sections into categories
const sectionCategories: SectionCategory[] = [
  {
    id: 'profile',
    label: '',  // No label for profile since it's standalone
    sections: [
      {
        id: 'profile',
        label: 'Agent profile',
        icon: '👤',
        component: AgentProfile
      }
    ]
  },
  {
    id: 'instructions',
    label: 'Agent instructions',
    sections: [
      {
        id: 'instructions',
        label: 'Instructions',
        icon: '📝',
        component: AgentInstructions
      },
      {
        id: 'flow',
        label: 'Flow builder',
        icon: '🔄',
        component: FlowBuilder
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: '🔌',
        component: Integrations
      }
    ]
  },
  {
    id: 'abilities',
    label: 'Connected abilities',
    sections: [
      {
        id: 'tools',
        label: 'Tools',
        icon: '🛠️',
        component: Tools
      },
      {
        id: 'subagents',
        label: 'Sub-agents',
        icon: '🤖',
        component: SubAgents
      },
      {
        id: 'knowledge',
        label: 'Knowledge Base',
        icon: '📚',
        component: KnowledgeBase
      }
    ]
  },
  {
    id: 'more',
    label: 'More options',
    sections: [
      {
        id: 'schedules',
        label: 'Schedules',
        icon: '⏰',
        component: Schedules
      },
      {
        id: 'advanced',
        label: 'Advanced settings',
        icon: '⚡',
        component: () => <div>Advanced settings</div>
      },
    ]
  }
];

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent | null;
  onSuccess: (agent: Agent) => void | Promise<void>;
}

export function CreateAgentModal({
  open,
  onOpenChange,
  agent,
  onSuccess
}: CreateAgentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('profile');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      emoji: '🤖',
      triggers: [],
      systemPrompt: '',
      tools: [],
      subAgents: [],
      integrations: []
    }
  });

  // Add this useEffect to update form when agent changes
  React.useEffect(() => {
    if (agent) {
      form.reset({
        name: agent.name,
        description: agent.description,
        emoji: agent.emoji,
        triggers: agent.triggers || [],
        systemPrompt: agent.systemPrompt || '',
        tools: agent.tools || [],
        subAgents: agent.subAgents || [],
        integrations: agent.integrations || []
      });
    } else {
      form.reset({
        name: '',
        description: '',
        emoji: '🤖',
        triggers: [],
        systemPrompt: '',
        tools: [],
        subAgents: [],
        integrations: []
      });
    }
  }, [agent, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      let agentData;;
      if (agent?.id) {
        // Update existing agent
        agentData = await agentService.updateAgent(agent.id, data as any);
        toast({
          title: "Agent updated",
          description: "Your agent has been updated successfully.",
        });
      } else {
        // Create new agent
        agentData = await agentService.createAgent(data as any);
        toast({
          title: "Agent created",
          description: "Your new agent has been created successfully.",
        });
      }

      onSuccess(agentData as Agent);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save agent:', error);
      toast({
        title: "Error",
        description: "Failed to save agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ActiveComponent = sectionCategories
    .flatMap(category => category.sections)
    .find(s => s.id === activeSection)?.component;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {agent ? 'Edit Agent' : 'Create Agent'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-64 border-r bg-muted/20">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {sectionCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      {category.label && (
                        <h3 className="text-sm font-medium text-muted-foreground px-4">
                          {category.label}
                        </h3>
                      )}
                      {category.sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={cn(
                            "flex items-center gap-2 w-full px-4 py-2 text-sm rounded-md",
                            activeSection === section.id
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          )}
                        >
                          <span>{section.icon}</span>
                          <span>{section.label}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Bottom Actions */}
              <div className="absolute bottom-0 left-0 w-64 p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1">
              <ScrollArea className="h-full">
                <div className="">
                  {ActiveComponent && (
                    <ActiveComponent form={form} />
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 