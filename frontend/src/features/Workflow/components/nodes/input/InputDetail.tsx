import { NodeDetailProps } from '../../../types';
import { Group as GroupType, FieldSchema } from './types';
import { FIELD_TYPE_ICONS } from './constants';

interface InputNodeData {
  groups?: GroupType[];
}

export function InputDetail({ data }: NodeDetailProps) {
  const renderField = (field: FieldSchema) => {
    const isConfigured = field.label && field.label.trim().length > 0;
    const FieldIcon = FIELD_TYPE_ICONS[field.type] || FIELD_TYPE_ICONS.short_text;
    
    return (
      <div key={field.id} className="flex items-center gap-2 text-[15px] leading-6">
        <FieldIcon className="w-4 h-4 text-gray-500" />
        {isConfigured ? (
          <>
            <span className="text-gray-900 font-normal">{field.label}</span>
            <span className="text-gray-400 font-normal">(Optional)</span>
          </>
        ) : (
          <span className="text-amber-600 font-normal">Input not configured</span>
        )}
      </div>
    );
  };

  const nodeData = data as InputNodeData;
  const hasFields = nodeData?.groups?.some(group => group.fields.length > 0);

  if (!hasFields) {
    return (
      <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
        <h3 className="text-[15px] font-semibold text-green-800">Define your tool inputs</h3>
        <p className="text-[14px] text-green-700 mt-1.5 leading-relaxed">
          Start by adding input fields that will be used throughout your tool
        </p>
      </div>
    );
  }

  const groupsWithFields = nodeData.groups?.filter(group => group.fields.length > 0) || [];

  return (
    <div className="space-y-6">
      {groupsWithFields.map((group) => (
        <div key={group.id} className="space-y-1.5">
          {group.name && (
            <div className="text-[15px] font-medium text-gray-900 mb-2">
              {group.name}
            </div>
          )}
          <div className="space-y-1.5">
            {group.fields.map(renderField)}
          </div>
        </div>
      ))}
    </div>
  );
}
