import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { agentService } from '@/services/agentService';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Filter, Search, ArrowLeft, BotIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { agentExecutionService, type AgentExecution } from '@/services/agentExecutionService';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { CreateAgentModal } from './components/CreateAgentModal';
import { QueueDetailsView } from './components/QueueDetailsView';
import { TaskDetails } from './components/TaskDetails';
import { QueueItemDetails } from './components/QueueItemDetails';

interface QueueStatus {
  active: number;
  queued: number;
}

interface QueueItem {
  name: string;
  status: 'active';
  queueCount: number;
}

interface QueueGroup {
  name: string;
  status: 'active' | 'finished';
  items: QueueItem[];
}

interface TaskDetailsProps {
  onRefreshExecutions: () => Promise<void>;
}

export default function AgentDetails() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const selectedExec = executions.find(e => e.id === selectedExecution) || null;
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ active: 1, queued: 0 });
  const [showQueueDetails, setShowQueueDetails] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<QueueItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!agentId) return;

      try {
        setLoading(true);
        const [agentData, executionsData] = await Promise.all([
          agentService.getAgent(agentId),
          agentExecutionService.getExecutions(agentId)
        ]);
        setAgent(agentData);
        setExecutions(executionsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch agent details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId]);

  const handleCreateTask = () => {
    setSelectedExecution(null);
  };

  // Sort executions by create_date in descending order
  const sortedExecutions = [...executions].sort((a, b) => 
    new Date(b.create_date).getTime() - new Date(a.create_date).getTime()
  );

  // Use sortedExecutions for filtering
  const filteredExecutions = searchQuery 
    ? sortedExecutions.filter(execution =>
        execution.history[0]?.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedExecutions;

  const refreshAgentData = async () => {
    if (!agentId) return;

    try {
      const agentData = await agentService.getAgent(agentId);
      setAgent(agentData);
    } catch (error) {
      console.error('Failed to refresh agent:', error);
      toast({
        title: "Error",
        description: "Failed to refresh agent details",
        variant: "destructive",
      });
    }
  };

  const handleTaskClick = (executionId: string) => {
    setSelectedExecution(executionId);
    setSelectedQueue(null);
  };

  const handleQueueItemClick = (item: QueueItem, groupName: string) => {
    setSelectedQueue(item);
    setSelectedExecution(null);
  };

  const handleExecutionUpdate = (updatedExecution: AgentExecution) => {
    setExecutions(prev => {
      const existingIndex = prev.findIndex(exec => exec.id === updatedExecution.id);
      
      if (existingIndex >= 0) {
        // Update existing execution
        const newExecutions = [...prev];
        newExecutions[existingIndex] = updatedExecution;
        return newExecutions;
      } else {
        // Add new execution to the beginning of the list
        return [updatedExecution, ...prev];
      }
    });
    
    // Select the new/updated execution
    setSelectedExecution(updatedExecution.id);
  };

  const handleDeleteExecution = async (executionId: string) => {
    try {
      await agentExecutionService.deleteExecution(executionId);
      // Remove the execution from state
      setExecutions(prev => prev.filter(exec => exec.id !== executionId));
      // Clear selection if deleted execution was selected
      if (selectedExecution === executionId) {
        setSelectedExecution(null);
      }
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete execution:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const refreshExecutions = async () => {
    if (!agentId) return;
    try {
      const executionsData = await agentExecutionService.getExecutions(agentId);
      setExecutions(executionsData);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
        <div className="grid gap-4 mt-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return <div>Agent not found</div>;
  }

  return (
    <div className="flex h-full ignore-layout-padding bg-background-secondary">
      {/* Left Sidebar */}
      <aside className="relative flex flex-col bg-background-secondary h-full overflow-hidden w-[300px] shrink-0">
        {/* Fixed Header */}
        <div className="p-4 bg-background-secondary w-full">
          <div className="flex items-center justify-between gap-2 mb-4">
            <Link to="../agents" className="hover:bg-accent p-1 rounded">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="w-full h-full overflow-hidden flex items-center">
              <div className="flex items-center h-full w-full">
                <div className="rounded-sm aspect-square shrink-0 flex items-center justify-center overflow-hidden bg-background-primary bg-cover h-6 w-6 mr-2">
                  <BotIcon className="h-4 w-4" />
                </div>
                <span className="text-primary truncate">{agent?.name}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCreateTask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Toggleable Search */}
          <div className={cn(
            "transition-all duration-200 overflow-hidden",
            showSearch ? "h-10 opacity-100 mb-4" : "h-0 opacity-0"
          )}>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for task..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Queue Status */}
          <div 
            className={cn(
              "transition-all duration-300",
              showQueueDetails 
                ? "h-0 opacity-0 overflow-hidden" 
                : "h-auto opacity-100"
            )}
          >
            <div 
              onClick={() => setShowQueueDetails(true)}
              className="px-4 py-3 border border-b bg-white/50 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                  View agent queues
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="status-dot"></div>
                    <span className="text-green-700">
                      {agent.integrations?.length} active
                    </span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{queueStatus.queued} in queue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sliding Content Area */}
        <div className="flex-1 relative">
          {/* Tasks List View */}
          <div 
            className={cn(
              "absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out",
              showQueueDetails ? "-translate-x-full" : "translate-x-0"
            )}
          >
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">Tasks</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {filteredExecutions.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={handleCreateTask}
                      >
                        New Task
                      </Button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  {filteredExecutions.length > 0 ? (
                    <div className="space-y-1">
                      {filteredExecutions.map(execution => (
                        <div
                          key={execution.id}
                          className="relative group"
                        >
                          <button
                            className={cn(
                              "w-full text-left p-3 rounded-md transition-colors",
                              "hover:bg-accent/30 hover:border-border-hover",
                              "border border-transparent",
                              selectedExecution === execution.id 
                                ? "bg-accent/40 border-border-hover shadow-sm" 
                                : "bg-transparent"
                            )}
                            onClick={() => handleTaskClick(execution.id)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn(
                                "text-sm truncate",
                                selectedExecution === execution.id 
                                  ? "text-foreground font-medium" 
                                  : "text-muted-foreground"
                              )}>
                                {execution.history[0]?.content || execution.title || "Untitled"}
                              </span>
                              <div className="shrink-0 text-right">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(execution.create_date), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                              "h-7 w-7"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExecution(execution.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-16 h-16 mb-4">
                        <img 
                          src="/clipboard.svg" 
                          alt="No tasks" 
                          className="w-full h-full opacity-50"
                        />
                      </div>
                      <p className="text-center text-muted-foreground text-sm">
                        Your agent's tasks will show up here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Queue Details View */}
          <div 
            className={cn(
              "absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out",
              showQueueDetails ? "translate-x-0" : "translate-x-full"
            )}
          >
            <QueueDetailsView 
              onBack={() => setShowQueueDetails(false)} 
              executions={executions}
              onItemClick={handleQueueItemClick}
              agent={agent}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      {selectedQueue ? (
        <QueueItemDetails 
          agent={agent}
          executions={executions}
          selectedQueue={selectedQueue}
          onEditClick={() => setEditModalOpen(true)}
        />
      ) : (
        <TaskDetails 
          agent={agent}
          selectedExec={selectedExec}
          onEditClick={() => setEditModalOpen(true)}
          onExecutionUpdate={handleExecutionUpdate}
          onRefreshExecutions={refreshExecutions}
        />
      )}

      <CreateAgentModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        agent={agent}
        onSuccess={async (updatedAgent) => {
          setEditModalOpen(false);
          setAgent(updatedAgent);
          await refreshAgentData();
          toast({
            title: "Success",
            description: "Agent updated successfully",
          });
        }}
      />
    </div>
  );
} 