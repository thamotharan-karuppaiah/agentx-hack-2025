import { EdgeProps, getBezierPath } from 'reactflow';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onDelete = () => {
    if (data?.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <g 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <path
        id={id}
        d={edgePath}
        className="react-flow__edge-path"
        strokeWidth={20}
        stroke="transparent"
        fill="none"
        style={{ pointerEvents: 'stroke' }}
      />
      <path
        d={edgePath}
        className="react-flow__edge-path"
        strokeWidth={isHovered ? 2 : 1}
        stroke={isHovered ? 'var(--primary)' : 'var(--muted-foreground)'}
        markerEnd={markerEnd}
        style={{ 
          transition: 'all 0.2s ease-in-out',
          pointerEvents: 'none',
        }}
      />
      {isHovered && (
        <foreignObject
          width={16}
          height={16}
          x={labelX - 8}
          y={labelY - 8}
          style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'visible',
          }}
        >
          <div
            className="flex items-center justify-center w-4 h-4 rounded-full bg-destructive hover:bg-destructive/90 cursor-pointer"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-2 h-2 text-white" />
          </div>
        </foreignObject>
      )}
    </g>
  );
}; 