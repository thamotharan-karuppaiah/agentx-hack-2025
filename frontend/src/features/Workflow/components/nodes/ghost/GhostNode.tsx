import { Handle, NodeProps, Position } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { GhostNodePopover } from './GhostNodePopover';
import { useNodeDeletion } from '../../../hooks/useNodeDeletion';

export const GhostNode = ({ data, id }: NodeProps) => {
  const handleBlockSelect = (type: string, label: string) => {
    // Replace ghost node with selected block
    data.onReplace?.(id, type, label);
  };

  const { handleDelete } = useNodeDeletion();

  return (
    <Card 
      className="w-[426px] bg-background/50 border-dashed border-2 border-muted-foreground/50 backdrop-blur-sm select-none"
    >
      <div className="relative p-4 flex items-center justify-between text-muted-foreground">
        {/* Input Handle */}
        <div className="absolute -left-6 top-1/2 -translate-y-1/2">
          <Handle
            type="target"
            position={Position.Left}
            style={{ width: '12px', height: '12px', left: '-6px', background: 'white', border: '2px solid #d1d5db' }}
          />
        </div>
        
        {/* Output Handle */}
        <div className="absolute -right-6 top-1/2 -translate-y-1/2">
          <Handle
            type="source"
            position={Position.Right}
            style={{ width: '12px', height: '12px', right: '-6px', background: 'white', border: '2px solid #d1d5db' }}
          />
        </div>

        <GhostNodePopover node={{ id, type: 'ghost', position: { x: 0, y: 0 }, data }} onSelect={handleBlockSelect} />

        <button 
          className="p-1 hover:bg-gray-50 rounded text-red-500 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();      
            handleDelete(id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}; 