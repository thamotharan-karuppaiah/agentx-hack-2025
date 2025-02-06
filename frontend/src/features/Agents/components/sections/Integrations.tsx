import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface TriggerOption {
  id: string;
  name: string;
  icon: string;
  description?: string;
  category: 'communication' | 'crm' | 'custom' | 'calendar' | 'freshservice' | 'freshdesk';
}

const triggers: TriggerOption[] = [
  // Communication
  { id: 'outlook', name: 'Outlook', icon: '📧', category: 'communication' },
  { id: 'gmail', name: 'Gmail', icon: '📨', category: 'communication' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', category: 'communication' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', category: 'communication' },
  { id: 'slack', name: 'Slack', icon: '💭', category: 'communication' },
  
  // Freshservice Modules
  { id: 'fs-tickets', name: 'Tickets', icon: '🎫', category: 'freshservice' },
  { id: 'fs-changes', name: 'Changes', icon: '🔄', category: 'freshservice' },
  { id: 'fs-problems', name: 'Problems', icon: '⚠️', category: 'freshservice' },
  { id: 'fs-assets', name: 'Assets', icon: '💻', category: 'freshservice' },
  { id: 'fs-releases', name: 'Releases', icon: '📦', category: 'freshservice' },
  { id: 'fs-projects', name: 'Projects', icon: '📋', category: 'freshservice' },
  
  // Freshdesk Modules
  { id: 'fd-tickets', name: 'Tickets', icon: '🎫', category: 'freshdesk' },
  { id: 'fd-contacts', name: 'Contacts', icon: '👥', category: 'freshdesk' },
  { id: 'fd-companies', name: 'Companies', icon: '🏢', category: 'freshdesk' },
  { id: 'fd-solutions', name: 'Solutions', icon: '📚', category: 'freshdesk' },
  { id: 'fd-surveys', name: 'Surveys', icon: '📝', category: 'freshdesk' },
  
  // CRM & Sales
  { id: 'hubspot', name: 'HubSpot', icon: '🎯', category: 'crm' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', category: 'crm' },
  { id: 'zoominfo', name: 'ZoomInfo', icon: '🔍', category: 'crm' },
  { id: 'workday', name: 'Workday', icon: '👥', category: 'crm' },
  
  // Custom
  { id: 'webhook', name: 'Custom webhook', icon: '🔗', category: 'custom' },
  { id: 'zapier', name: 'Zapier', icon: '⚡', category: 'custom' },
  { id: 'api', name: 'API', icon: '🔌', category: 'custom' },
];

interface IntegrationsProps {
  form: UseFormReturn<any>;
}

interface Integration {
  id: string;
  moduleId: string;
  moduleName: string;
  moduleIcon: string;
  triggerType: string;
  triggerName: string;
  required?: boolean;
}

interface TriggerType {
  id: string;
  name: string;
  description: string;
  defaultName: string;
}

// Update the moduleTriggers definition with triggers for all modules
const moduleTriggers: Record<string, TriggerType[]> = {
  // Freshservice Triggers
  'fs-tickets': [
    { id: 'ticket-created', name: 'Ticket Created', description: 'Triggers when a new ticket is created', defaultName: 'New ticket created' },
    { id: 'ticket-updated', name: 'Ticket Updated', description: 'Triggers when a ticket is updated', defaultName: 'Ticket updated' },
    { id: 'ticket-resolved', name: 'Ticket Resolved', description: 'Triggers when a ticket is resolved', defaultName: 'Ticket resolved' },
    { id: 'ticket-deleted', name: 'Ticket Deleted', description: 'Triggers when a ticket is deleted', defaultName: 'Ticket deleted' }
  ],
  'fs-changes': [
    { id: 'change-created', name: 'Change Created', description: 'Triggers when a new change is created', defaultName: 'New change created' },
    { id: 'change-approved', name: 'Change Approved', description: 'Triggers when a change is approved', defaultName: 'Change approved' },
    { id: 'change-implemented', name: 'Change Implemented', description: 'Triggers when a change is implemented', defaultName: 'Change implemented' }
  ],
  'fs-problems': [
    { id: 'problem-created', name: 'Problem Created', description: 'Triggers when a new problem is created', defaultName: 'New problem created' },
    { id: 'problem-updated', name: 'Problem Updated', description: 'Triggers when a problem is updated', defaultName: 'Problem updated' },
    { id: 'problem-resolved', name: 'Problem Resolved', description: 'Triggers when a problem is resolved', defaultName: 'Problem resolved' }
  ],
  'fs-assets': [
    { id: 'asset-created', name: 'Asset Created', description: 'Triggers when a new asset is created', defaultName: 'New asset created' },
    { id: 'asset-updated', name: 'Asset Updated', description: 'Triggers when an asset is updated', defaultName: 'Asset updated' },
    { id: 'asset-retired', name: 'Asset Retired', description: 'Triggers when an asset is retired', defaultName: 'Asset retired' }
  ],
  'fs-releases': [
    { id: 'release-created', name: 'Release Created', description: 'Triggers when a new release is created', defaultName: 'New release created' },
    { id: 'release-updated', name: 'Release Updated', description: 'Triggers when a release is updated', defaultName: 'Release updated' },
    { id: 'release-completed', name: 'Release Completed', description: 'Triggers when a release is completed', defaultName: 'Release completed' }
  ],
  'fs-projects': [
    { id: 'project-created', name: 'Project Created', description: 'Triggers when a new project is created', defaultName: 'New project created' },
    { id: 'project-updated', name: 'Project Updated', description: 'Triggers when a project is updated', defaultName: 'Project updated' },
    { id: 'project-completed', name: 'Project Completed', description: 'Triggers when a project is completed', defaultName: 'Project completed' }
  ],

  // Freshdesk Triggers
  'fd-tickets': [
    { id: 'fd-ticket-created', name: 'Ticket Created', description: 'Triggers when a new ticket is created', defaultName: 'New ticket created' },
    { id: 'fd-ticket-updated', name: 'Ticket Updated', description: 'Triggers when a ticket is updated', defaultName: 'Ticket updated' },
    { id: 'fd-ticket-resolved', name: 'Ticket Resolved', description: 'Triggers when a ticket is resolved', defaultName: 'Ticket resolved' }
  ],
  'fd-contacts': [
    { id: 'contact-created', name: 'Contact Created', description: 'Triggers when a new contact is created', defaultName: 'New contact created' },
    { id: 'contact-updated', name: 'Contact Updated', description: 'Triggers when a contact is updated', defaultName: 'Contact updated' }
  ],
  'fd-companies': [
    { id: 'company-created', name: 'Company Created', description: 'Triggers when a new company is created', defaultName: 'New company created' },
    { id: 'company-updated', name: 'Company Updated', description: 'Triggers when a company is updated', defaultName: 'Company updated' }
  ],
  'fd-solutions': [
    { id: 'article-created', name: 'Article Created', description: 'Triggers when a new article is created', defaultName: 'New article created' },
    { id: 'article-updated', name: 'Article Updated', description: 'Triggers when an article is updated', defaultName: 'Article updated' }
  ],
  'fd-surveys': [
    { id: 'survey-response', name: 'Survey Response', description: 'Triggers when a survey response is received', defaultName: 'New survey response' }
  ],

  // Communication Triggers
  'outlook': [
    { id: 'email-received', name: 'Email Received', description: 'Triggers when a new email is received', defaultName: 'New email received' },
    { id: 'email-sent', name: 'Email Sent', description: 'Triggers when an email is sent', defaultName: 'Email sent' },
    { id: 'calendar-event', name: 'Calendar Event', description: 'Triggers for calendar events', defaultName: 'Calendar event' },
    { id: 'meeting-scheduled', name: 'Meeting Scheduled', description: 'Triggers when a new meeting is scheduled', defaultName: 'New meeting scheduled' },
    { id: 'meeting-updated', name: 'Meeting Updated', description: 'Triggers when a meeting is updated', defaultName: 'Meeting updated' },
    { id: 'email-flagged', name: 'Email Flagged', description: 'Triggers when an email is flagged', defaultName: 'Email flagged' },
    { id: 'task-created', name: 'Task Created', description: 'Triggers when a new task is created', defaultName: 'New task created' },
    { id: 'contact-added', name: 'Contact Added', description: 'Triggers when a new contact is added', defaultName: 'New contact added' }
  ],
  'gmail': [
    { id: 'gmail-received', name: 'Email Received', description: 'Triggers when a new email is received', defaultName: 'New email received' },
    { id: 'gmail-sent', name: 'Email Sent', description: 'Triggers when an email is sent', defaultName: 'Email sent' },
    { id: 'email-labeled', name: 'Email Labeled', description: 'Triggers when an email is labeled', defaultName: 'Email labeled' },
    { id: 'email-archived', name: 'Email Archived', description: 'Triggers when an email is archived', defaultName: 'Email archived' },
    { id: 'draft-created', name: 'Draft Created', description: 'Triggers when a draft is created', defaultName: 'New draft created' },
    { id: 'attachment-received', name: 'Attachment Received', description: 'Triggers when an email with attachment is received', defaultName: 'New attachment received' }
  ],
  'whatsapp': [
    { id: 'message-received', name: 'Message Received', description: 'Triggers when a new message is received', defaultName: 'New message received' },
    { id: 'message-sent', name: 'Message Sent', description: 'Triggers when a message is sent', defaultName: 'Message sent' },
    { id: 'group-message', name: 'Group Message', description: 'Triggers when a group message is received', defaultName: 'New group message' },
    { id: 'status-update', name: 'Status Update', description: 'Triggers when a status is updated', defaultName: 'Status updated' },
    { id: 'media-received', name: 'Media Received', description: 'Triggers when media is received', defaultName: 'New media received' },
    { id: 'contact-joined', name: 'Contact Joined', description: 'Triggers when a contact joins WhatsApp', defaultName: 'New contact joined' }
  ],
  'linkedin': [
    { id: 'connection-request', name: 'Connection Request', description: 'Triggers on new connection requests', defaultName: 'New connection request' },
    { id: 'message-received', name: 'Message Received', description: 'Triggers when a new message is received', defaultName: 'New LinkedIn message' }
  ],

  // CRM Triggers
  'hubspot': [
    { id: 'contact-created', name: 'Contact Created', description: 'Triggers when a new contact is created', defaultName: 'New HubSpot contact' },
    { id: 'deal-created', name: 'Deal Created', description: 'Triggers when a new deal is created', defaultName: 'New deal created' },
    { id: 'deal-stage-changed', name: 'Deal Stage Changed', description: 'Triggers when a deal stage changes', defaultName: 'Deal stage changed' },
    { id: 'form-submitted', name: 'Form Submitted', description: 'Triggers when a form is submitted', defaultName: 'New form submission' },
    { id: 'email-opened', name: 'Email Opened', description: 'Triggers when an email is opened', defaultName: 'Email opened' },
    { id: 'meeting-booked', name: 'Meeting Booked', description: 'Triggers when a meeting is booked', defaultName: 'New meeting booked' },
    { id: 'ticket-created-hs', name: 'Ticket Created', description: 'Triggers when a ticket is created', defaultName: 'New HubSpot ticket' },
    { id: 'quote-created', name: 'Quote Created', description: 'Triggers when a quote is created', defaultName: 'New quote created' }
  ],
  'salesforce': [
    { id: 'lead-created', name: 'Lead Created', description: 'Triggers when a new lead is created', defaultName: 'New lead created' },
    { id: 'opportunity-created', name: 'Opportunity Created', description: 'Triggers when a new opportunity is created', defaultName: 'New opportunity' },
    { id: 'account-updated', name: 'Account Updated', description: 'Triggers when an account is updated', defaultName: 'Account updated' },
    { id: 'case-created', name: 'Case Created', description: 'Triggers when a case is created', defaultName: 'New case created' },
    { id: 'task-completed', name: 'Task Completed', description: 'Triggers when a task is completed', defaultName: 'Task completed' },
    { id: 'campaign-updated', name: 'Campaign Updated', description: 'Triggers when a campaign is updated', defaultName: 'Campaign updated' },
    { id: 'contract-created', name: 'Contract Created', description: 'Triggers when a contract is created', defaultName: 'New contract' },
    { id: 'report-exported', name: 'Report Exported', description: 'Triggers when a report is exported', defaultName: 'Report exported' }
  ],
  'zoominfo': [
    { id: 'contact-enriched', name: 'Contact Enriched', description: 'Triggers when contact data is enriched', defaultName: 'Contact enriched' },
    { id: 'company-enriched', name: 'Company Enriched', description: 'Triggers when company data is enriched', defaultName: 'Company enriched' }
  ],

  // Custom Integration Triggers
  'webhook': [
    { id: 'webhook-triggered', name: 'Webhook Triggered', description: 'Triggers when webhook receives data', defaultName: 'Webhook triggered' }
  ],
  'zapier': [
    { id: 'zap-triggered', name: 'Zap Triggered', description: 'Triggers when Zap is executed', defaultName: 'Zap triggered' }
  ],
  'api': [
    { id: 'api-called', name: 'API Called', description: 'Triggers when API endpoint is called', defaultName: 'API triggered' },
    { id: 'api-response', name: 'API Response', description: 'Triggers when API response is received', defaultName: 'API response received' }
  ],

  // Workday Triggers
  'workday': [
    { id: 'employee-hired', name: 'Employee Hired', description: 'Triggers when a new employee is hired', defaultName: 'New hire' },
    { id: 'employee-terminated', name: 'Employee Terminated', description: 'Triggers when an employee is terminated', defaultName: 'Employee terminated' },
    { id: 'position-changed', name: 'Position Changed', description: 'Triggers when an employee changes position', defaultName: 'Position change' },
    { id: 'compensation-changed', name: 'Compensation Changed', description: 'Triggers when compensation is changed', defaultName: 'Compensation update' },
    { id: 'leave-requested', name: 'Leave Requested', description: 'Triggers when a leave request is submitted', defaultName: 'New leave request' },
    { id: 'timesheet-submitted', name: 'Timesheet Submitted', description: 'Triggers when a timesheet is submitted', defaultName: 'Timesheet submitted' },
    { id: 'performance-review', name: 'Performance Review', description: 'Triggers when a performance review is completed', defaultName: 'Performance review completed' }
  ],

  // Expanded Communication Triggers
  'slack': [
    { id: 'message-received', name: 'Message Received', description: 'Triggers when a new message is received', defaultName: 'New Slack message' },
    { id: 'channel-message', name: 'Channel Message', description: 'Triggers when a message is posted to a channel', defaultName: 'New channel message' },
    { id: 'direct-message', name: 'Direct Message', description: 'Triggers when a direct message is received', defaultName: 'New DM received' },
    { id: 'mention', name: 'Mention', description: 'Triggers when the bot is mentioned', defaultName: 'New mention' },
    { id: 'reaction-added', name: 'Reaction Added', description: 'Triggers when a reaction is added to a message', defaultName: 'New reaction' },
    { id: 'file-shared', name: 'File Shared', description: 'Triggers when a file is shared', defaultName: 'New file shared' }
  ]
};

export default function Integrations({ form }: IntegrationsProps) {
  const [selectedModule, setSelectedModule] = useState<TriggerOption | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | null>(null);
  const [triggerName, setTriggerName] = useState('');
  const [required, setRequired] = useState(false);
  
  const integrations = form.watch('integrations') || [];

  const handleModuleClick = (module: TriggerOption) => {
    setSelectedModule(module);
    setIsModalOpen(true);
    setSelectedTrigger(null);
    setTriggerName('');
    setRequired(false);
  };

  const handleTriggerSelect = (trigger: TriggerType) => {
    setSelectedTrigger(trigger);
    setTriggerName(trigger.defaultName);
  };

  const handleAddIntegration = () => {
    if (!selectedModule || !selectedTrigger) return;

    const newIntegration: Integration = {
      id: `${selectedModule.id}-${selectedTrigger.id}-${Date.now()}`,
      moduleId: selectedModule.id,
      moduleName: selectedModule.name,
      moduleIcon: selectedModule.icon,
      triggerType: selectedTrigger.id,
      triggerName: triggerName || selectedTrigger.defaultName,
      required: false
    };

    const currentIntegrations = form.getValues('integrations') || [];
    form.setValue('integrations', [...currentIntegrations, newIntegration]);
    setIsModalOpen(false);
  };

  const handleRemoveIntegration = (integrationId: string) => {
    const newIntegrations = integrations.filter(i => i.id !== integrationId);
    form.setValue('integrations', newIntegrations);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Integrations</h2>
      </div>

      {/* Active Integrations List */}
      {integrations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium mb-4">Active Integrations</h3>
          <div className="space-y-2">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span>{integration.moduleIcon}</span>
                  <div>
                    <p className="text-sm font-medium">{integration.moduleName}</p>
                    <p className="text-xs text-muted-foreground">{integration.triggerName}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveIntegration(integration.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Sections */}
      <div className="space-y-8">
        {/* Freshservice */}
        <div>
          <h4 className="text-sm font-medium mb-2">Freshservice</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Connect with Freshservice modules for IT service management
          </p>
          
          <div className="grid grid-cols-4 gap-4">
            {triggers
              .filter(trigger => trigger.category === 'freshservice')
              .map((trigger) => (
                <Card 
                  key={trigger.id}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => handleModuleClick(trigger)}
                >
                  <CardContent className="p-4 flex items-center gap-2">
                    <span>{trigger.icon}</span>
                    <span className="text-sm">{trigger.name}</span>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Freshdesk */}
        <div>
          <h4 className="text-sm font-medium mb-2">Freshdesk</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Connect with Freshdesk modules for customer support
          </p>
          
          <div className="grid grid-cols-4 gap-4">
            {triggers
              .filter(trigger => trigger.category === 'freshdesk')
              .map((trigger) => (
                <Card 
                  key={trigger.id}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => handleModuleClick(trigger)}
                >
                  <CardContent className="p-4 flex items-center gap-2">
                    <span>{trigger.icon}</span>
                    <span className="text-sm">{trigger.name}</span>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Communication Tools */}
        <div>
          <h4 className="text-sm font-medium mb-2">Communication</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your communication channels to enable automated responses
          </p>
          
          <div className="grid grid-cols-4 gap-4">
            {triggers
              .filter(trigger => trigger.category === 'communication')
              .map((trigger) => (
                <Card 
                  key={trigger.id}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => handleModuleClick(trigger)}
                >
                  <CardContent className="p-4 flex items-center gap-2">
                    <span>{trigger.icon}</span>
                    <span className="text-sm">{trigger.name}</span>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* CRM & Sales Tools */}
        <div>
          <h4 className="text-sm font-medium mb-2">CRM & Sales</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Integrate with your CRM systems for seamless data flow
          </p>
          
          <div className="grid grid-cols-4 gap-4">
            {triggers
              .filter(trigger => trigger.category === 'crm')
              .map((trigger) => (
                <Card 
                  key={trigger.id}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => handleModuleClick(trigger)}
                >
                  <CardContent className="p-4 flex items-center gap-2">
                    <span>{trigger.icon}</span>
                    <span className="text-sm">{trigger.name}</span>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Custom Integration Tools */}
        <div>
          <h4 className="text-sm font-medium mb-2">Custom Integrations</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Build your own integrations or use automation tools
          </p>
          
          <div className="grid grid-cols-4 gap-4">
            {triggers
              .filter(trigger => trigger.category === 'custom')
              .map((trigger) => (
                <Card 
                  key={trigger.id}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => handleModuleClick(trigger)}
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

      {/* Trigger Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedModule?.icon} {selectedModule?.name} Triggers
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-4">
              {selectedModule && moduleTriggers[selectedModule.id]?.map((trigger) => (
                <div
                  key={trigger.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer hover:border-primary",
                    selectedTrigger?.id === trigger.id && "border-primary bg-accent"
                  )}
                  onClick={() => handleTriggerSelect(trigger)}
                >
                  <div className="font-medium mb-1">{trigger.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {trigger.description}
                  </div>
                </div>
              ))}
            </div>

            {selectedTrigger && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trigger Name</label>
                  <Input
                    value={triggerName}
                    onChange={(e) => setTriggerName(e.target.value)}
                    placeholder="Enter trigger name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={required}
                    onCheckedChange={(checked) => setRequired(checked as boolean)}
                  />
                  <label htmlFor="required" className="text-sm font-medium">
                    Required for agent execution
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddIntegration}
              disabled={!selectedTrigger}
            >
              Add Integration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 