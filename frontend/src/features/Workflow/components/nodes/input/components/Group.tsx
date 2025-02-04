import { DraggableProvided, DroppableProvided, Draggable } from 'react-beautiful-dnd';
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from 'lucide-react';
import { Group as GroupType, FieldSchema } from '../types';
import { Field } from './Field';

interface GroupProps {
  group: GroupType;
  index: number;
  provided: DraggableProvided;
  dropProvided: DroppableProvided;
  onAddField: () => void;
  onDeleteGroup: () => void;
  onEditField: (field: FieldSchema) => void;
  onDeleteField: (fieldId: string) => void;
  onGroupNameChange: (name: string) => void;
}

export function Group({
  group,
  provided,
  dropProvided,
  onAddField,
  onDeleteGroup,
  onEditField,
  onDeleteField,
  onGroupNameChange,
}: GroupProps) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="bg-white rounded-lg border border-gray-200"
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div
            contentEditable
            suppressContentEditableWarning
            className="text-[15px] font-medium text-gray-900 focus:outline-none border-b border-transparent hover:border-gray-200 focus:border-gray-300 min-w-[100px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 transition-colors"
            data-placeholder="Untitled Group"
            onBlur={(e) => onGroupNameChange(e.currentTarget.textContent || '')}
            dangerouslySetInnerHTML={{ __html: group.name }}
          />
          <button
            onClick={onDeleteGroup}
            className="text-gray-400 hover:text-gray-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={dropProvided.innerRef}
          {...dropProvided.droppableProps}
          className="space-y-0.5 min-h-[2px]"
        >
          {group.fields.map((field, index) => (
            <Draggable key={field.id} draggableId={field.id} index={index}>
              {(dragProvided) => (
                <Field
                  field={field}
                  dragProvided={dragProvided}
                  onEdit={() => onEditField(field)}
                  onDelete={() => onDeleteField(field.id)}
                />
              )}
            </Draggable>
          ))}
          {dropProvided.placeholder}
        </div>

        <Button
          onClick={onAddField}
          variant="ghost"
          className="w-full h-9 text-sm bg-gray-50 hover:bg-gray-100"
        >
          Add field
          <Plus className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
} 