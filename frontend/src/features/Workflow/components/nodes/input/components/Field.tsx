import { DraggableProvided } from 'react-beautiful-dnd';
import { Trash2 } from 'lucide-react';
import { FieldSchema } from '../types';
import { FIELD_TYPE_ICONS } from '../constants';

interface FieldProps {
  field: FieldSchema;
  dragProvided?: DraggableProvided;
  onEdit: () => void;
  onDelete: () => void;
}

export function Field({ field, dragProvided, onEdit, onDelete }: FieldProps) {
  const isConfigured = field.label && field.label.trim().length > 0;
  const FieldIcon = FIELD_TYPE_ICONS[field.type] || FIELD_TYPE_ICONS.short_text;


  return (
    <div
      ref={dragProvided?.innerRef}
      {...dragProvided?.draggableProps}
      {...dragProvided?.dragHandleProps}
      className="flex items-center gap-2 py-1.5 px-3 hover:bg-gray-50 rounded-md group cursor-pointer"
      onClick={onEdit}
    >
      <FieldIcon className="w-4 h-4 text-gray-500" />
      {isConfigured ? (
        <>
          <span className="text-[15px] text-gray-900 font-normal flex-grow">
            {field.label}
            <span className="text-gray-400 ml-1">(Optional)</span>
          </span>
        </>
      ) : (
        <span className="text-[15px] text-amber-600 font-normal flex-grow">
          Input not configured
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
} 