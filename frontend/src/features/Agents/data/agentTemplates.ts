export interface AgentTemplate {
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
    title: 'All Agents',
    icon: '⚡'
  },
  {
    id: 'popular',
    title: 'Popular',
    icon: '🔥'
  },
  {
    id: 'growth',
    title: 'Growth',
    icon: '📈'
  },
  {
    id: 'data-processing',
    title: 'Data Processing',
    icon: '📊'
  },
  {
    id: 'web-research',
    title: 'Web Research',
    icon: '🌐'
  }
];

export const templates: AgentTemplate[] = [
  {
    id: 'blank',
    title: 'Blank Agent',
    description: 'Create a chat-based Agent from scratch',
    categories: ['all']
  },
  {
    id: 'sentiment',
    title: 'Sentiment Analysis',
    description: 'Analyze text to determine if positive, negative or neutral',
    categories: ['data-processing', 'popular']
  },
  {
    id: 'text-extraction',
    title: 'Text Extraction',
    description: 'Extract relevant text from a given document or webpage',
    categories: ['data-processing', 'web-research']
  },
  {
    id: 'text-classification',
    title: 'Text Classification',
    description: 'Categorize input text into predefined classes',
    categories: ['data-processing']
  },
  {
    id: 'text-summarization',
    title: 'Text Summarization',
    description: 'Generate a concise summary of a longer text document',
    categories: ['popular', 'data-processing']
  },
  {
    id: 'testimonial-case-study',
    title: 'Testimonial to Case Study',
    description: 'Create a customer case study from a testimonial',
    categories: ['growth', 'popular']
  },
  {
    id: 'google-search',
    title: 'Google Search then Scrape',
    description: 'Perform a Google search then scrape top results for content',
    categories: ['web-research']
  },
  {
    id: 'image-data',
    title: 'Extract Data from an Image',
    description: 'Extract structured tabular data from an image',
    categories: ['data-processing']
  }
]; 