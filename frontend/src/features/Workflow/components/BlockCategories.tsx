
import { cn } from "@/lib/utils";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { nodeCategories } from "./nodes/nodeTypes";


interface BlockCategoriesProps {
  onSelect?: (type: string, label: string) => void;
  className?: string;
  variant?: 'sidebar' | 'popover';
}

export const BlockCategories = ({ 
  onSelect, 
  className = '',
  variant = 'sidebar'
}: BlockCategoriesProps) => {
  const renderCategory = (category: typeof nodeCategories[0]) => {
    const Icon = category.icon;
    return (
      <HoverCard key={category.id} openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <div className="rounded-md border border-transparent cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-md text-[10px] transition-colors hover:bg-gray-75 size-14 p-2">
              <Icon className={cn("size-4 shrink-0", category.color)} />
              <span className="font-medium">{category.label}</span>
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent 
          side="right"
          align="start"
          className="w-48 p-2"
        >
          <div className="space-y-1">
            {category.blocks.map((block) => {
              const BlockIcon = block.icon;
              return (
                <div
                  key={block.id}
                  className={cn(
                    "flex items-center gap-2 p-2 text-sm rounded-md hover:bg-gray-100",
                    variant === 'sidebar' ? "cursor-grab" : "cursor-pointer"
                  )}
                  draggable={variant === 'sidebar'}
                  onDragStart={variant === 'sidebar' ? (e) => {
                    e.dataTransfer.setData('application/reactflow', JSON.stringify({
                      type: block.id,
                      category: category.id,
                      label: block.label
                    }));
                  } : undefined}
                  onClick={variant === 'popover' ? () => onSelect?.(block.id, block.label) : undefined}
                >
                  <BlockIcon className="h-4 w-4" />
                  <span>{block.label}</span>
                </div>
              );
            })}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className={cn(
      "grid grid-cols-1",
      className
    )}>
      {nodeCategories.map(renderCategory)}
    </div>
  );
}; 