import React, { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Bot,
  Search,
  MoreVertical,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { agentService } from '@/services/agentService';
import type { Agent } from './types';
import { CreateAgentModal } from './components/CreateAgentModal';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SortConfig {
  key: keyof Agent | null;
  direction: 'asc' | 'desc';
}

const formatRelativeDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '-';
  }
};

const AgentHome: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: null, 
    direction: 'asc' 
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const data = await agentService.getAgents();
        setAgents(data);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        toast({
          title: "Error",
          description: "Failed to fetch agents",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [toast]);

  const handleSort = (key: keyof Agent) => {
    setSortConfig(current => ({
      key,
      direction: 
        current.key === key && current.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
  };

  const getSortedAgents = (agents: Agent[]) => {
    if (!sortConfig.key) return agents;

    return [...agents].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      
      if (!aValue || !bValue) return 0;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const handleSearch = (value: string) => {
    const newParams = { ...Object.fromEntries(searchParams) };
    if (value) {
      newParams.q = value;
    } else {
      delete newParams.q;
    }
    setSearchParams(newParams);
  };

  const getSearchedAgents = (agents: Agent[]) => {
    if (!searchQuery) return agents;
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleDeleteAgent = async (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await agentService.deleteAgent(agent.id);
      setAgents(prevAgents => prevAgents.filter(a => a.id !== agent.id));
      toast({
        title: "Success",
        description: "Agent has been deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditAgent = (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation();
    setSelectedAgent(agent);
    setCreateModalOpen(true);
  };

  const renderActionMenu = (agent: Agent) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="gap-2" onClick={(e) => { handleEditAgent(e, agent); }}>
          <Pencil className="h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAgent(e, agent); }}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderSortableHeader = (
    label: string, 
    key: keyof Agent
  ) => (
    <div
      onClick={() => handleSort(key)}
      className="flex items-center gap-1 hover:cursor-pointer"
    >
      <span className="text-sm font-medium text-muted-foreground">
        {label}
      </span>
      {sortConfig.key === key && (
        sortConfig.direction === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      )}
    </div>
  );

  const renderTableSkeleton = () => (
    Array(5).fill(0).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
        <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
      </TableRow>
    ))
  );

  const handleCreateAgent = useCallback(() => {
    setSelectedAgent(undefined);
    setCreateModalOpen(true);
  }, []);

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setSelectedAgent(undefined);
  };

  const refreshAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentService.getAgents();
      setAgents(data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleRow = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">
              Agents
            </h2>
          </div>
          <div className="ml-auto">
            <Button onClick={handleCreateAgent}>
              Create Agent
            </Button>
          </div>
        </div>
        <div
          data-orientation="horizontal"
          role="none"
          className="shrink-0 bg-border h-[1px] w-full mt-6"
        />

        {/* Main Content */}
        <div className="flex-1 mt-6">
          <div className="space-y-4">
            <div className="flex justify-end items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{renderSortableHeader('Name', 'name')}</TableHead>
                    <TableHead>{renderSortableHeader('Description', 'description')}</TableHead>
                    <TableHead>{renderSortableHeader('Tools', 'tools')}</TableHead>
                    <TableHead>{renderSortableHeader('Last Run', 'lastRunDate')}</TableHead>
                    <TableHead>{renderSortableHeader('Last Modified', 'lastModified')}</TableHead>
                    <TableHead>{renderSortableHeader('Created', 'created')}</TableHead>
                    <TableHead>{renderSortableHeader('Tasks Done', 'tasksDone')}</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    renderTableSkeleton()
                  ) : (
                    getSortedAgents(getSearchedAgents(agents)).map((agent) => (
                      <React.Fragment key={agent.id}>
                        <TableRow 
                          className="cursor-pointer"
                          onClick={() => {
                            navigate(`${agent.id}`);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => toggleRow(agent.id, e)}
                                      className={cn(
                                        "p-1 rounded",
                                        agent.tools.length > 0 
                                          ? "hover:bg-accent cursor-pointer" 
                                          : "opacity-50 cursor-not-allowed"
                                      )}
                                      disabled={agent.tools.length === 0}
                                    >
                                      {expandedRows.has(agent.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  {agent.tools.length === 0 && (
                                    <TooltipContent>
                                      <p>No tools added</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                              <Bot className="w-4 h-4 text-blue-500" />
                              <span>{agent.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{agent.description}</TableCell>
                          <TableCell>{agent.tools.length} tools</TableCell>
                          <TableCell>{formatRelativeDate(agent.lastRunDate)}</TableCell>
                          <TableCell>{formatRelativeDate(agent.lastModified)}</TableCell>
                          <TableCell>{formatRelativeDate(agent.created)}</TableCell>
                          <TableCell>{agent.tasksDone}</TableCell>
                          <TableCell>{renderActionMenu(agent)}</TableCell>
                        </TableRow>

                        {/* Expanded Tools Section */}
                        {expandedRows.has(agent.id) && agent.tools.map((tool, idx) => (
                          <TableRow 
                            key={`${agent.id}-tool-${idx}`}
                            className="bg-muted/50"
                          >
                            <TableCell className="pl-12">
                              <div className="flex items-center gap-2">
                                <span>{tool.icon}</span>
                                <span className="text-sm">{tool.name}</span>
                              </div>
                            </TableCell>
                            <TableCell colSpan={7}>
                              <span className="text-sm text-muted-foreground">
                                {tool.prompt || `Defaults to: Completes a ${tool.name} and returns the results.`}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center justify-end text-sm text-muted-foreground">
            {agents.length} Agents
          </div>
        </div>
      </div>

      <CreateAgentModal 
        open={createModalOpen}
        onOpenChange={handleModalClose}
        agent={selectedAgent}
        onSuccess={refreshAgents}
      />
    </>
  );
};

export default AgentHome;
