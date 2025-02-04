import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface TriggerOption {
  id: string;
  name: string;
  icon: string;
  description?: string;
  isPremium?: boolean;
}

const standardTriggers: TriggerOption[] = [
  { id: 'outlook', name: 'Outlook', icon: '📧' },
  { id: 'gmail', name: 'Gmail', icon: '📨' },
  { id: 'gcalendar', name: 'Google Calendar', icon: '📅' },
  { id: 'hubspot', name: 'HubSpot', icon: '🎯' },
  { id: 'freshdesk', name: 'Freshdesk', icon: '🎫' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️' },
  { id: 'zoominfo', name: 'ZoomInfo', icon: '🔍' },
  { id: 'whatsapp', name: 'WhatsApp for Business', icon: '💬' },
];

const premiumTriggers: TriggerOption[] = [
  { id: 'whatsapp-premium', name: 'WhatsApp', icon: '💬', isPremium: true },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', isPremium: true },
];

const customTriggers: TriggerOption[] = [
  { id: 'webhook', name: 'Custom webhook', icon: '🔗' },
  { id: 'zapier', name: 'Zapier', icon: '⚡' },
  { id: 'api', name: 'API', icon: '🔌' },
];

interface AgentProfileProps {
  form: UseFormReturn<any>;
}

export default function AgentProfile({ form }: AgentProfileProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Agent profile</h2>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent name</FormLabel>
              <FormControl>
                <Input placeholder="Enter agent name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what this agent does"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Integrations</h3>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Triggers</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Allow tasks to be created for your agent from other places. Allow enables threading, such as with emails or WhatsApp into the same task.
          </p>
          
          <div className="grid grid-cols-4 gap-4">
            {standardTriggers.map((trigger) => (
              <Card 
                key={trigger.id}
                className="cursor-pointer hover:border-primary"
                onClick={() => {
                  // Handle trigger selection
                }}
              >
                <CardContent className="p-4 flex items-center gap-2">
                  <span>{trigger.icon}</span>
                  <span className="text-sm">{trigger.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Premium triggers</h4>
          <p className="text-sm text-muted-foreground mb-4">
            These triggers are accessible for Teams and Business plan users. They incur an additional 5000 credits per month for each connected account in your organization.
          </p>
          
          <div className="grid grid-cols-4 gap-4">
            {premiumTriggers.map((trigger) => (
              <Card 
                key={trigger.id}
                className="cursor-pointer hover:border-primary"
              >
                <CardContent className="p-4 flex items-center gap-2">
                  <span>{trigger.icon}</span>
                  <span className="text-sm">{trigger.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Build your own triggers</h4>
          <div className="grid grid-cols-4 gap-4">
            {customTriggers.map((trigger) => (
              <Card 
                key={trigger.id}
                className="cursor-pointer hover:border-primary"
              >
                <CardContent className="p-4 flex items-center gap-2">
                  <span>{trigger.icon}</span>
                  <span className="text-sm">{trigger.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 