import { subHours, subDays, parseISO, isWithinInterval } from 'date-fns';

export interface HistoryEntry {
  id: string;
  status: 'running' | 'review_needed' | 'cancelled' | 'success';
  createdAt: string;
  runtime?: string;
  tasks: number;
  source: 'web' | 'agent' | 'api';
  // Dynamic input fields
  inputs: Record<string, any>;
}

// Generate mock data with input fields
const generateMockData = (): HistoryEntry[] => {
  const statuses: HistoryEntry['status'][] = ['running', 'review_needed', 'cancelled', 'success'];
  const sources: HistoryEntry['source'][] = ['web', 'agent', 'api'];
  const mockData: HistoryEntry[] = [];

  // Sample input values
  const sampleInputs = [
    { brand_kit: 'Modern Tech', keyword: 'AI Solutions' },
    { brand_kit: 'Eco Friendly', keyword: 'Sustainable Products' },
    { brand_kit: 'Health First', keyword: 'Wellness Tips' },
  ];

  for (let i = 0; i < 50; i++) {
    const hoursAgo = Math.floor(Math.random() * 24 * 30);
    const randomInputs = sampleInputs[Math.floor(Math.random() * sampleInputs.length)];
    
    mockData.push({
      id: `run-${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
      runtime: Math.random() > 0.3 ? `${Math.floor(Math.random() * 10)}s` : undefined,
      tasks: Math.floor(Math.random() * 8) + 2,
      source: sources[Math.floor(Math.random() * sources.length)],
      inputs: randomInputs
    });
  }

  return mockData.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
};

const mockHistoryData = generateMockData();

interface FetchHistoryParams {
  workflowId: string;
  timeRange: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Column {
  id: string;
  label: string;
  required: boolean;
  type: 'system' | 'input';
}

export const workflowHistoryService = {
  fetchHistory: async ({ workflowId, timeRange, status, page = 1, pageSize = 10 }: FetchHistoryParams) => {
    await delay(500); // Simulate API delay

    let filteredData = [...mockHistoryData];

    // Apply time range filter
    const now = new Date();
    const getTimeRange = () => {
      switch (timeRange) {
        case '2h':
          return { start: subHours(now, 2), end: now };
        case '24h':
          return { start: subHours(now, 24), end: now };
        case '7d':
          return { start: subDays(now, 7), end: now };
        case '30d':
          return { start: subDays(now, 30), end: now };
        case 'all':
          return null;
        default:
          return { start: subDays(now, 30), end: now };
      }
    };

    const timeRangeInterval = getTimeRange();
    if (timeRangeInterval) {
      filteredData = filteredData.filter(entry => {
        const entryDate = parseISO(entry.createdAt);
        return isWithinInterval(entryDate, timeRangeInterval);
      });
    }

    // Apply status filter
    if (status && status !== 'any') {
      filteredData = filteredData.filter(entry => entry.status === status);
    }

    // Calculate pagination
    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        pageSize
      }
    };
  },

  getAvailableColumns: async (workflowId: string): Promise<Column[]> => {
    await delay(200);
    
    // Get workflow configuration to determine input fields
    // In production, this would come from your workflow configuration
    const workflowInputs = ['brand_kit', 'keyword'];

    const systemColumns = [
      { id: 'status', label: 'Status', required: true, type: 'system' },
      { id: 'createdAt', label: 'Created at', required: true, type: 'system' },
      { id: 'runtime', label: 'Runtime', required: false, type: 'system' },
      { id: 'tasks', label: 'Tasks', required: false, type: 'system' },
      { id: 'source', label: 'Source', required: false, type: 'system' },
    ];

    const inputColumns = workflowInputs.map(input => ({
      id: input,
      label: input.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      required: false,
      type: 'input'
    }));

    return [...systemColumns, ...inputColumns];
  }
}; 