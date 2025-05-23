import { useParams, Outlet, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Share2, Settings, ChevronDown, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { workflowService } from "@/services/workflowService";
import type { Workflow } from "@/features/Workflow/types";
import { WorkflowProvider } from './WorkflowContext';

const WorkflowDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workflowId } = useParams();
  
  // Add workflow state
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add state for last selected run option
  const [lastRunOption, setLastRunOption] = useState<'once' | 'schedule'>('once');

  // Fetch workflow data
  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        if (workflowId) {
          const data = await workflowService.getWorkflow(workflowId);
          setWorkflow(data);
        }
      } catch (error) {
        console.error('Error fetching workflow:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, [workflowId]);

  // Check if we're in any run route
  const isRunRoute = location.pathname.includes('run/');
  const isScheduleRun = location.pathname.includes('run/schedule');

  // Update lastRunOption when navigating between run options
  useEffect(() => {
    if (isRunRoute) {
      setLastRunOption(isScheduleRun ? 'schedule' : 'once');
    }
  }, [location.pathname]);

  const handleRunOptionClick = () => {
    if (isRunRoute) {
      // If already in a run route, use the current option
      navigate(isScheduleRun ? 'run/schedule' : 'run/once');
    } else {
      // If coming from another route, use the last selected option
      navigate(`run/${lastRunOption === 'schedule' ? 'schedule' : 'once'}`);
    }
  };

  const handleRunOptionSelect = (option: 'once' | 'schedule') => {
    setLastRunOption(option);
    navigate(`run/${option}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!workflow) {
    return <div className="flex items-center justify-center h-full">Workflow not found</div>;
  }

  return (
    <WorkflowProvider value={{ workflow, loading }}>
      <div className="flex flex-col min-h-full ignore-layout-padding">
        {/* Header */}
        <div className="flex items-center gap-3 h-14 px-4 border-b">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`../`)}
            className="h-8 w-8 p-0 border-gray-200 ml-4"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              workflow.color ? `bg-${workflow.color}-100 text-${workflow.color}-500` : "bg-blue-100 text-blue-500"
            )}>
              {workflow.emoji || <Zap className="h-4 w-4" />}
            </div>
            <h2 className="text-lg font-semibold">
              {workflow.name}
            </h2>
          </div>

          <div className="flex items-center ml-8 gap-2">
            <div 
              className={cn(
                "flex rounded-md focus-within:ring-0 focus-within:ring-offset-0",
                isRunRoute
                  ? "bg-purple-50 text-purple-600 hover:bg-purple-100" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Button 
                variant="ghost" 
                className={cn(
                  "text-sm font-medium rounded-r-none px-4 py-2 focus-visible:ring-0 focus:ring-0 focus:outline-none",
                  "bg-transparent hover:bg-transparent"
                )}
                onClick={handleRunOptionClick}
              >
                {isRunRoute 
                  ? (isScheduleRun ? 'Schedule Run' : 'Run Once')
                  : (lastRunOption === 'schedule' ? 'Schedule Run' : 'Run Once')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "px-2 rounded-l-none border-l focus-visible:ring-0 focus:ring-0 focus:outline-none",
                      "bg-transparent hover:bg-transparent",
                      isRunRoute ? "border-l-purple-100" : "border-l-gray-100"
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={() => handleRunOptionSelect('once')}>
                    Run Once
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleRunOptionSelect('schedule')}>
                    Schedule Run
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Button
            variant="ghost"
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-md focus-visible:ring-0 focus:ring-0 focus:outline-none",
              location.pathname.includes('history')
                ? "bg-purple-50 text-purple-600 hover:bg-purple-50"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => navigate('history')}
          >
            History
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-md focus-visible:ring-0 focus:ring-0 focus:outline-none",
              location.pathname.includes('analytics')
                ? "bg-purple-50 text-purple-600 hover:bg-purple-50"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => navigate('analytics')}
          >
            Analytics
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-md focus-visible:ring-0 focus:ring-0 focus:outline-none",
              location.pathname.includes('integrate')
                ? "bg-purple-50 text-purple-600 hover:bg-purple-50"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => navigate('integrate')}
          >
            Integrate
          </Button>

          <div className="ml-auto flex items-center gap-2 mr-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate(`edit`)}
            >
              <Settings className="h-4 w-4" />
              Edit Workflow
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </WorkflowProvider>
  );
};

export default WorkflowDetails; 