import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { agentService } from '@/services/agentService';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Settings, Filter, Search, ArrowLeft, Share, InfoIcon, MoreHorizontal, Menu, BotIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { agentExecutionService, type AgentExecution } from '@/services/agentExecutionService';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { CreateAgentModal } from './components/CreateAgentModal';
import { ChatInput } from './components/ChatInput';
import { ChatHistory } from './components/ChatHistory';
import { PropertyPane } from './components/PropertyPane';
import { EmptyState } from './components/EmptyState';

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

  const handleCreateTask = async () => {
    if (!agentId) return;
    try {
      const newExecution = await agentExecutionService.createExecution(
        agentId,
        'New Task'
      );
      setExecutions(prev => [newExecution, ...prev]);
      setSelectedExecution(newExecution.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const filteredExecutions = executions.filter(execution =>
    execution.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="p-4 gap-4 flex flex-col bg-background-secondary w-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
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
              <Button variant="ghost" size="icon">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCreateTask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
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

        {/* Tasks List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="space-y-4">
              {filteredExecutions.length > 0 ? (
                <div className="space-y-1">
                  {filteredExecutions.map(execution => (
                    <button
                      key={execution.id}
                      className={cn(
                        "w-full text-left p-3 rounded-sm hover:bg-accent/50 group",
                        selectedExecution === execution.id && "bg-accent"
                      )}
                      onClick={() => setSelectedExecution(execution.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate">{execution.title}</span>
                        <div className="shrink-0 text-right">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(execution.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </button>
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
      </aside>

      {/* Main Content */}
      <div className="flex flex-col justify-start w-full h-full bg-background-secondary">
        {/* Header */}
        <header className="w-[calc(100%-8px)] mt-2 px-2 xl:px-0 bg-white">
          <div className="w-full h-[48px] flex items-center px-4 md:px-6 lg:px-8 bg-background-primary border border-border-default rounded-t-sm">
            <div className="block xl:hidden mr-2">
              <Button variant="ghost" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            {/* Breadcrumb */}
            <div className="group/title flex items-center justify-center space-x-2 shrink truncate">
              <div className="flex items-center h-full">
                <div className="rounded-sm aspect-square shrink-0 flex items-center justify-center overflow-hidden bg-background-primary bg-cover h-6 w-6 mr-2">
                  <BotIcon className="h-4 w-4" />
                </div>
                <span className="text-muted-foreground truncate shrink transition-colors">
                  {agent?.name}
                </span>
              </div>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground truncate max-w-xs lg:max-w-sm">
                {selectedExec?.title || 'New Task'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-1 ml-auto shrink-0">
              <Button variant="ghost" className="hidden md:flex">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <InfoIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => setEditModalOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="w-full flex h-full xl:pl-0 pr-2 pt-0 bg-white">
          {/* Center Content */}
          <div className="flex-grow flex flex-col elevation-raw-bulge bg-background-primary relative xl:rounded-r-none border border-t-0 border-border-default" style={{ height: 'calc(-97px + 100vh)' }}>
            <div className="h-full overflow-y-auto flex-grow flex flex-col px-m py-m 2xl:py-xl items-center hide-scroll-bar" id="scroll-container">
              {selectedExec ? (
                <ChatHistory execution={selectedExec} />
              ) : (
                agent && <EmptyState agent={agent} />
              )}
              <div className="sticky z-40 w-full px-xxs py-m bg-gradient-to-t from-white via-white via-90% to-transparent -bottom-xl">
                <div className="relative">
                  <ChatInput onSubmit={() => { }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Properties Panel */}
          <div
            className="w-[380px] shrink-0 hidden xl:block elevation-raw-bulge border border-border-default border-l-0 border-t-0 bg-background-primary overflow-y-auto"
            style={{ height: 'calc(100vh - 97px)' }}
          >
            <PropertyPane execution={selectedExec} agent={agent} />
          </div>
        </div>

        {/* Footer */}
        <div className="mb-2 pr-2 w-full bg-white">
          <footer className="w-full flex items-center justify-center border border-t-0 rounded-b-sm border-border-default bg-background-primary h-[33px]">
            {/* <button className="flex items-center px-6 py-2 rounded-bl-sm border-r border-border-default transition-colors bg-background-tertiary hover:bg-background-secondary">
              <span className="text-muted-foreground text-sm">Override Mode</span>
              <span className="text-muted-foreground text-sm ml-1">OFF</span>
            </button>
             */}
            <div className="hidden lg:inline-flex">
              <span className="text-muted-foreground text-sm">
                Last updated {formatDistanceToNow(new Date(agent?.lastModified || agent?.created), { addSuffix: true })}
              </span>
            </div>

            {/* <div className="border-l border-border-default divide-x divide-border-default flex h-full">
              <button className="px-6 py-2 flex items-center space-x-2 hover:bg-accent transition-colors">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">64 left</span>
              </button>
              <button className="h-full px-8 flex items-center border-r border-border-default hover:bg-accent transition-colors space-x-1">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Help</span>
              </button>
            </div> */}
          </footer>
        </div>
      </div>

      <CreateAgentModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        agent={agent}
        onSuccess={async (updatedAgent) => {
          setEditModalOpen(false);
          // Immediately update the local state
          setAgent(updatedAgent);
          // Also refresh from server to ensure we have latest data
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