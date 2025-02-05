export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  categories: string[];
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
    id: 'popular',
    title: 'Popular',
    icon: '🔥'
  },
  {
    id: 'automation',
    title: 'Automation',
    icon: '⚙️'
  },
  {
    id: 'data-processing',
    title: 'Data Processing',
    icon: '📊'
  },
  {
    id: 'content',
    title: 'Content Creation',
    icon: '✍️'
  },
  {
    id: 'research',
    title: 'Research',
    icon: '🔍'
  }
];

export const templates: WorkflowTemplate[] = [
  {
    id: 'blank',
    title: 'Blank Tool',
    description: 'Create a custom tool from scratch',
    categories: ['all']
  },
  {
    id: 'lead-generation',
    title: 'Lead Generation Tool',
    description: 'Automate lead generation from multiple sources',
    categories: ['popular', 'automation']
  },
  {
    id: 'content-scheduler',
    title: 'Content Scheduler',
    description: 'Schedule and automate content publishing',
    categories: ['automation', 'content']
  },
  {
    id: 'data-enrichment',
    title: 'Data Enrichment Tool',
    description: 'Enrich data from multiple sources automatically',
    categories: ['data-processing', 'popular']
  },
  {
    id: 'social-media',
    title: 'Social Media Automation',
    description: 'Automate social media posting and engagement',
    categories: ['content']
  },
  {
    id: 'market-research',
    title: 'Market Research Tool',
    description: 'Gather and analyze market data automatically',
    categories: ['research']
  },
  {
    id: 'competitor-analysis',
    title: 'Competitor Analysis Tool',
    description: 'Track and analyze competitor activities',
    categories: ['research']
  },
  {
    id: 'email-automation',
    title: 'Email Automation Tool',
    description: 'Automate email sequences and follow-ups',
    categories: ['automation']
  },
  {
    id: 'data-cleanup',
    title: 'Data Cleanup Tool',
    description: 'Clean and standardize data automatically',
    categories: ['data-processing']
  },
  {
    id: 'content-repurposing',
    title: 'Content Repurposing Tool',
    description: 'Automatically repurpose content for different platforms',
    categories: ['content']
  }
]; 