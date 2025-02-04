import React, { useCallback, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import LoadingScreen from "@/components/Layout/LoadingScreen";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Zap, 
  History, 
  BarChart2, 
  Grid,
  Pencil,
  MoreVertical,
  Trash2,
  Play,
  Table as TableIcon,
  Link2,
  History as HistoryIcon,
  Copy,
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { workflowService } from '@/services/workflowService';
import type { Workflow, SortConfig, WorkflowFilters } from './types';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const WorkflowMain: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: null, 
    direction: 'asc' 
  });
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [, setSelectedWorkflowForSheets] = useState<string | null>(null);
  const [linkedSheets, setLinkedSheets] = useState<Array<{ id: string; name: string; }>>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const filters: WorkflowFilters = useMemo(() => {
    const filterParam = searchParams.get('filters');
    if (!filterParam) return {};
    try {
      return JSON.parse(decodeURIComponent(filterParam));
    } catch {
      return {};
    }
  }, [searchParams]);
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  useParams();

  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoading(true);
      try {
        const data = await workflowService.getWorkflows();
        setWorkflows(data);
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);


  const renderVersionCell = (workflow: Workflow) => {
    if (workflow.status === 'draft') {
      return (
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Draft</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <History className="w-4 h-4" />
        <span>Version {workflow.defaultVersion}</span>
      </div>
    );
  };

  const renderTotalRunsCell = (totalRuns: number) => {
    const runs = totalRuns ?? 0;
    const textColorClass = runs > 0 ? 'text-green-500' : '';
    return (
      <div className="flex items-center justify-center gap-2">
        <BarChart2 className={`w-4 h-4 ${textColorClass}`} />
        <span className={textColorClass}>{runs}</span>
      </div>
    );
  };

  const handleViewLinkedSheets = async (workflowId: string) => {
    setSelectedWorkflowForSheets(workflowId);
    setIsLoadingSheets(true);
    try {
      const sheets = await workflowService.getLinkedSheets(workflowId);
      setLinkedSheets(sheets);
    } catch (error) {
      console.error('Failed to fetch linked sheets:', error);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const renderLinkedGridsCell = (linkedGrids: number, workflowId: string) => {
    if (linkedGrids === 0) {
      return (
        <div className="text-muted-foreground">
          -
        </div>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            className="px-3 h-7 rounded-full hover:bg-background border border-green-200 bg-green-50"
            onClick={(e) => {
              e.stopPropagation();
              handleViewLinkedSheets(workflowId);
            }}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">{linkedGrids}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-3 text-sm text-muted-foreground border-b">
              LINKED GRIDS ({linkedGrids})
            </div>
            {isLoadingSheets ? (
              <div className="flex justify-center p-4">
                <LoadingScreen message="Loading sheets..." />
              </div>
            ) : (
              <div className="p-1">
                {linkedSheets.map(sheet => (
                  <div 
                    key={sheet.id} 
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  >
                    <Grid className="w-4 h-4 text-orange-400" />
                    <span>{sheet.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const handleDeleteWorkflow = async (e: React.MouseEvent, workflow: Workflow) => {
    e.stopPropagation(); // Prevent row click event
    setIsDeleting(true);
    try {
      await workflowService.deleteWorkflow(workflow.id);
      setWorkflows(prevWorkflows => prevWorkflows.filter(w => w.id !== workflow.id));
      toast({
        title: "Success",
        description: "Workflow has been deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderActionMenu = (workflow: Workflow) => {
    const isDraft = workflow.status === 'draft';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isDraft && (
            <>
              <DropdownMenuItem className="gap-2" onClick={(_e) => navigate(`/workflows/${workflow.id}`)}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Play className="h-4 w-4" />
                Run
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <TableIcon className="h-4 w-4" />
                View Runs
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Link2 className="h-4 w-4" />
                Link Sheet
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <HistoryIcon className="h-4 w-4" />
                View History
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
            onClick={(e) => handleDeleteWorkflow(e, workflow)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const handleSort = (key: keyof Workflow) => {
    setSortConfig(current => ({
      key,
      direction: 
        current.key === key && current.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
  };

  const getSortedWorkflows = (workflows: Workflow[]) => {
    if (!sortConfig.key) return workflows;

    return [...workflows].sort((a, b) => {
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

  const renderSortableHeader = (
    label: string, 
    key: keyof Workflow
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
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[30px]" />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[30px]" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-[80px]" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-md" />
        </TableCell>
      </TableRow>
    ))
  );

  const handleFilterChange = (key: keyof WorkflowFilters, value: any) => {
    const currentFilters = { ...filters };
    
    if (value === undefined || value === '') {
      delete currentFilters[key];
    } else {
      currentFilters[key] = value;
    }

    const newParams = { ...Object.fromEntries(searchParams) };
    if (Object.keys(currentFilters).length > 0) {
      newParams.filters = encodeURIComponent(JSON.stringify(currentFilters));
    } else {
      delete newParams.filters;
    }
    
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    const newParams = { ...Object.fromEntries(searchParams) };
    delete newParams.filters;
    setSearchParams(newParams);
  };

  const getFilteredWorkflows = (workflows: Workflow[]) => {
    return workflows.filter(workflow => {
      if (filters.status && workflow.status !== filters.status) return false;
      if (filters.linkedSheets && workflow.linkedGrids === 0) return false;
      if (filters.hasRuns && workflow.totalRuns === 0) return false;
      return true;
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

  const renderFilters = () => (
    <Popover open={filterOpen} onOpenChange={setFilterOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          aria-label="Filter workflows"
        >
          <Filter className="h-4 w-4" />
          Filter
          {Object.keys(filters).length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {Object.keys(filters).length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filter Workflows</h4>
            <p className="text-sm text-muted-foreground">
              Select the filters to apply to the workflow list.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Other Filters</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('linkedSheets', !filters.linkedSheets)}
                  className={filters.linkedSheets ? 'bg-primary/10' : ''}
                >
                  Has Linked Sheets
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('hasRuns', !filters.hasRuns)}
                  className={filters.hasRuns ? 'bg-primary/10' : ''}
                >
                  Has Runs
                </Button>
              </div>
            </div>
          </div>
          {Object.keys(filters).length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="w-full"
            >
              Clear all filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  const handleWorkflowClick = (workflow: Workflow) => {
    if (workflow.status === 'draft') {
      navigate(`${workflow.id}/edit`);
    } else {
      navigate(`${workflow.id}/run/once`);
    }
  };

  const renderContent = useCallback(() => {
    return (
      <div className="space-y-4">
        <div className="flex justify-end items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {renderFilters()}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-full whitespace-nowrap">
                  {renderSortableHeader('Name', 'name')}
                </TableHead>
                <TableHead className="min-w-[140px] whitespace-nowrap">
                  {renderSortableHeader('Version', 'status')}
                </TableHead>
                <TableHead className="min-w-[150px] text-center whitespace-nowrap">
                  {renderSortableHeader('Total Runs', 'totalRuns')}
                </TableHead>
                <TableHead className="min-w-[120px] text-center whitespace-nowrap">
                  {renderSortableHeader('Linked Sheets', 'linkedGrids')}
                </TableHead>
                <TableHead className="min-w-[200px] whitespace-nowrap">
                  {renderSortableHeader('Last Edited', 'lastEdited')}
                </TableHead>
                <TableHead className="min-w-[85px] whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderTableSkeleton()
              ) : (
                getSortedWorkflows(getFilteredWorkflows(getSearchedWorkflows(workflows))).map((workflow) => (
                  <TableRow 
                    key={workflow.id} 
                    className="cursor-pointer"
                    onClick={() => handleWorkflowClick(workflow)}
                  >
                    <TableCell className="w-full">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        {workflow.name ? (
                          <span className="text-[15px] text-gray-900 truncate">
                            {workflow.name}
                          </span>
                        ) : (
                          <span className="text-[15px] text-gray-400 truncate">
                            Untitled
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[140px]">{renderVersionCell(workflow)}</TableCell>
                    <TableCell className="min-w-[150px] text-center">{renderTotalRunsCell(workflow.totalRuns)}</TableCell>
                    <TableCell className="min-w-[120px] text-center">{renderLinkedGridsCell(workflow.linkedGrids, workflow.id)}</TableCell>
                    <TableCell className="min-w-[200px]">{workflow.lastEdited}</TableCell>
                    <TableCell className="min-w-[85px]">{renderActionMenu(workflow)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }, [loading, workflows, sortConfig, filters, filterOpen, searchParams]);

  const getSearchedWorkflows = (workflows: Workflow[]) => {
    if (!searchQuery) return workflows;
    return workflows.filter(workflow => 
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleCreateWorkflow = useCallback(async () => {
     let workflow = await workflowService.createWorkflow({name:''});
     console.log(workflow);
     navigate(`${workflow.id}/edit`);
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">
            Workflows
          </h2>
        </div>
        <div className="ml-auto">
          <Button onClick={handleCreateWorkflow}>
            Create Workflow
          </Button>
        </div>
      </div>
      <div
        data-orientation="horizontal"
        role="none"
        className="shrink-0 bg-border h-[1px] w-full mt-6"
      ></div>

      {/* Main Content */}
      <div className="flex-1 mt-6">
        {renderContent()}
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center justify-end text-sm text-muted-foreground">
          {workflows.length} Workflows
        </div>
      </div>
    </div>
  );
};

export default WorkflowMain;
