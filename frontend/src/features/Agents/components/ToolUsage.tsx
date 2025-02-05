import { formatDistanceToNow } from 'date-fns';
import { Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tool } from '@/services/agentExecutionService';

interface ToolUsageProps {
  tool: Tool;
  timestamp: string;
  isLast?: boolean;
}

const mockTools = {
  "google_search": {
    name: "Google search",
  },
}
export function ToolUsage({ tool, timestamp, isLast = false }: ToolUsageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const steps = 1;
  const toolName = mockTools[tool.id as keyof typeof mockTools].name;

  const handleToolClick = (toolName: string) => {
    console.log(toolName);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative">
        <div className="flex justify-between space-x-4 w-full relative">
          <div className="flex space-x-2 w-full">
            <div className="shrink-0 w-[36px] hidden md:flex flex-col h-full">
              <div className="flex items-center justify-center shrink-0 relative rounded-md bg-background-primary h-[36px]">
                <div className="h-[10px] w-[10px] rounded-[2px] bg-black"></div>
              </div>
              {!isLast && (
                <div className="inline-flex mx-auto border-r-2 border-border-default h-full flex-grow min-h-[14px] relative z-10 transition-[height] mt-1" />
              )}
            </div>

            <div className="shrink flex flex-col w-full group/action relative px-2 mb-[36px]">
              <div>
                {/* <div 
                  className="p-1  absolute top-0 left-0 z-20 w-fullh-[36px] hover:bg-accent cursor-pointer"
                 
                /> */}
                <div className="-mx-2 px-2 rounded-md  transition-colors  truncate flex items-center h-[36px] hover:bg-accent cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                  <div className="flex items-center cursor-pointer">
                    <span className="text-sm">
                      <span className="text-link">{steps} step</span> performed in the background
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground ml-2 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="w-full flex flex-col mt-2">
                  <div className="flex items-center gap-2">
                    <div className="ml-2 h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <div onClick={() => handleToolClick(toolName)} className="h-[36px] rounded-md flex items-center px-2 text-sm flex-1 cursor-pointer hover:bg-accent gap-2">
                      Used <span className="text-link">{toolName}</span>
                    </div>
                  </div>
                  {/* Add more details here when expanded */}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center absolute right-2 h-[36px]">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 