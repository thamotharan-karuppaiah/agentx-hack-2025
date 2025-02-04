import { BlockCategories } from '../../BlockCategories';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus } from 'lucide-react';
import { Node } from 'reactflow';

interface GhostNodePopoverProps {
  node: Node;
  onSelect: (type: string, label: string) => void;
}

export const GhostNodePopover = ({ onSelect }: GhostNodePopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 flex-1 justify-center cursor-pointer">
          <Plus className="w-5 h-5" />
          <span className="text-lg font-medium">Add Step</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-1" align="center">
        <BlockCategories onSelect={onSelect} variant="popover" />
      </PopoverContent>
    </Popover>
  );
}; 