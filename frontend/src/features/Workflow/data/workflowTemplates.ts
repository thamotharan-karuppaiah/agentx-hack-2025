export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  categories: string[];
  suggestedAgents?: string[]; // References to agent templates that commonly use this tool
}

export interface Category {
  id: string;
  title: string;
  icon: React.ReactNode;
}

export const categories: Category[] = [
  {
    id: 'all',
    title: 'All Tools',
    icon: '⚡'
  },
  {
    id: 'itsm-tools',
    title: 'IT Service Management',
    icon: '🖥️'
  },
  {
    id: 'identity-access',
    title: 'Identity & Access',
    icon: '🔐'
  },
  {
    id: 'system-integration',
    title: 'System Integration',
    icon: '🔌'
  },
  {
    id: 'data-processing',
    title: 'Data Processing',
    icon: '📊'
  },
  {
    id: 'communication',
    title: 'Communication',
    icon: '📨'
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Alerts',
    icon: '📡'
  },
  {
    id: 'hr-tools',
    title: 'HR & Employee',
    icon: '👥'
  },
  {
    id: 'finance-tools',
    title: 'Finance & Accounting',
    icon: '💰'
  },
  {
    id: 'security-tools',
    title: 'Security Operations',
    icon: '🔒'
  }
];

export const templates: WorkflowTemplate[] = [
  {
    id: 'blank',
    title: 'Blank Tool',
    description: 'Create a custom tool from scratch',
    categories: ['all']
  },

  // ITSM Tools
  {
    id: 'knowledge-base-search',
    title: 'Knowledge Base Search',
    description: 'Search and retrieve articles from knowledge base systems',
    categories: ['itsm-tools', 'system-integration'],
    suggestedAgents: ['incident-triage', 'password-reset', 'service-catalog']
  },
  {
    id: 'system-status-check',
    title: 'System Status Checker',
    description: 'Check status and health of IT systems and services',
    categories: ['itsm-tools', 'monitoring'],
    suggestedAgents: ['incident-triage', 'change-risk']
  },
  {
    id: 'ticket-management',
    title: 'Ticket Management',
    description: 'Create, update, and manage service tickets',
    categories: ['itsm-tools', 'system-integration'],
    suggestedAgents: ['incident-triage', 'facilities-request']
  },

  // Identity & Access Tools
  {
    id: 'identity-verifier',
    title: 'Identity Verification',
    description: 'Verify user identity and authentication status',
    categories: ['identity-access', 'security-tools'],
    suggestedAgents: ['password-reset', 'access-request']
  },
  {
    id: 'password-reset-tool',
    title: 'Password Reset',
    description: 'Securely reset passwords across different systems',
    categories: ['identity-access', 'itsm-tools'],
    suggestedAgents: ['password-reset']
  },
  {
    id: 'access-manager',
    title: 'Access Management',
    description: 'Manage system access and permissions',
    categories: ['identity-access', 'security-tools'],
    suggestedAgents: ['access-request', 'security-alert']
  },

  // System Integration Tools
  {
    id: 'rmm-integration',
    title: 'RMM Integration',
    description: 'Interface with Remote Monitoring and Management systems',
    categories: ['system-integration', 'monitoring'],
    suggestedAgents: ['client-onboarding', 'backup-monitor']
  },
  {
    id: 'cmdb-query',
    title: 'CMDB Query',
    description: 'Query Configuration Management Database',
    categories: ['system-integration', 'itsm-tools'],
    suggestedAgents: ['change-risk', 'incident-triage']
  },

  // Data Processing Tools
  {
    id: 'data-extraction',
    title: 'Data Extraction',
    description: 'Extract data from various file formats and sources',
    categories: ['data-processing'],
    suggestedAgents: ['invoice-processor', 'resume-parser']
  },
  {
    id: 'data-transformation',
    title: 'Data Transformation',
    description: 'Transform and normalize data formats',
    categories: ['data-processing'],
    suggestedAgents: ['data-cleanup', 'invoice-processor']
  },

  // Communication Tools
  {
    id: 'email-sender',
    title: 'Email Sender',
    description: 'Send automated emails and notifications',
    categories: ['communication'],
    suggestedAgents: ['recruitment', 'leave-management']
  },
  {
    id: 'notification-system',
    title: 'Notification System',
    description: 'Send notifications across multiple channels',
    categories: ['communication'],
    suggestedAgents: ['facilities-request', 'security-alert']
  },

  // Monitoring Tools
  {
    id: 'backup-monitor',
    title: 'Backup Monitoring',
    description: 'Monitor backup status and completion',
    categories: ['monitoring', 'msp-tools'],
    suggestedAgents: ['backup-monitor']
  },
  {
    id: 'system-metrics',
    title: 'System Metrics',
    description: 'Collect and analyze system performance metrics',
    categories: ['monitoring'],
    suggestedAgents: ['incident-triage', 'security-alert']
  },

  // HR Tools
  {
    id: 'leave-calculator',
    title: 'Leave Calculator',
    description: 'Calculate employee leave balances and eligibility',
    categories: ['hr-tools'],
    suggestedAgents: ['leave-management', 'benefits-inquiry']
  },
  {
    id: 'onboarding-checklist',
    title: 'Onboarding Checklist',
    description: 'Manage employee onboarding tasks and progress',
    categories: ['hr-tools'],
    suggestedAgents: ['employee-onboarding']
  },

  // Finance Tools
  {
    id: 'expense-validator',
    title: 'Expense Validator',
    description: 'Validate expenses against policies and limits',
    categories: ['finance-tools'],
    suggestedAgents: ['expense-validator']
  },
  {
    id: 'invoice-processor',
    title: 'Invoice Processor',
    description: 'Process and validate invoice data',
    categories: ['finance-tools', 'data-processing'],
    suggestedAgents: ['invoice-processor']
  },

  // Security Tools
  {
    id: 'threat-analyzer',
    title: 'Threat Analyzer',
    description: 'Analyze security threats and vulnerabilities',
    categories: ['security-tools'],
    suggestedAgents: ['security-alert']
  },
  {
    id: 'compliance-checker',
    title: 'Compliance Checker',
    description: 'Check compliance with security policies',
    categories: ['security-tools'],
    suggestedAgents: ['compliance-check', 'access-request']
  },

  // MSP Tools
  {
    id: 'license-tracker',
    title: 'License Tracker',
    description: 'Track software licenses and usage',
    categories: ['system-integration', 'monitoring'],
    suggestedAgents: ['license-manager']
  },
  {
    id: 'client-documentation',
    title: 'Client Documentation',
    description: 'Manage client infrastructure documentation',
    categories: ['system-integration'],
    suggestedAgents: ['client-onboarding']
  }
]; 