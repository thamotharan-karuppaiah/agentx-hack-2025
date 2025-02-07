import { useState, useEffect } from 'react';
import { useWorkflow } from '../../WorkflowContext';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_TYPE_ICONS } from '@/features/Workflow/components/nodes/input/constants';
import { cn } from "@/lib/utils";

interface WorkflowConfigProps {
  onRun: (input: Record<string, any>) => void;
  isRunning: boolean;
}

const WorkflowConfig: React.FC<WorkflowConfigProps> = ({
  onRun,
  isRunning,
}) => {
  const { workflow } = useWorkflow();
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  
  const inputNode = workflow?.config?.nodes?.find(node => node.type === 'start');
  const inputGroups = inputNode?.data?.groups || [];
  
  // Reset form values when workflow changes
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    inputGroups.forEach((group: any) => {
      group.fields?.forEach((field: any) => {
        if (field.variableName) {
          initialValues[field.variableName] = field.defaultValue || '';
        }
      });
    });
    setFormValues(initialValues);
  }, [workflow]);

  const handleInputChange = (variableName: string, value: string | number) => {
    setFormValues(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleRunClick = () => {
    onRun(formValues);
  };

  const hasInputFields = inputGroups.some((group: any) => group.fields?.length > 0);

  if (!hasInputFields) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Run Workflow</h2>
        </div>
        
        <div className="p-6">
          <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-100">
            <h3 className="text-[15px] font-semibold text-gray-800">No Input Required</h3>
            <p className="text-[14px] text-gray-600 mt-1.5 leading-relaxed">
              This workflow doesn't require any input parameters to run.
            </p>
          </div>
        </div>

        <div className="mt-auto p-6 border-t">
          <Button 
            className="w-full" 
            onClick={() => onRun({})}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run Workflow"}
          </Button>
        </div>
      </div>
    );
  }

  const renderField = (field: any) => {
    const FieldIcon = FIELD_TYPE_ICONS[field.type as keyof typeof FIELD_TYPE_ICONS] || FIELD_TYPE_ICONS.short_text;
    
    if (!field.variableName) return null;

    return (
      <div key={field.id} className="space-y-2">
        <div className="flex items-center gap-2">
          <FieldIcon className="w-4 h-4 text-gray-500" />
          <Label>
            {field.label}
            {!field.required && <span className="text-muted-foreground ml-1">(Optional)</span>}
          </Label>
        </div>
        
        {field.type === 'long_text' ? (
          <Textarea 
            placeholder={field.placeholder}
            value={formValues[field.variableName] || ''}
            onChange={(e) => handleInputChange(field.variableName, e.target.value)}
            className="resize-none"
          />
        ) : (
          <Input 
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder}
            value={formValues[field.variableName] || ''}
            onChange={(e) => handleInputChange(
              field.variableName,
              field.type === 'number' ? Number(e.target.value) : e.target.value
            )}
          />
        )}
        
        {field.hint && (
          <div className="text-sm text-muted-foreground">{field.hint}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Run Workflow</h2>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {inputGroups.map((group: any) => (
            group.fields?.length > 0 && (
              <div key={group.id} className="space-y-4">
                {group.name && (
                  <h3 className="text-[15px] font-medium text-gray-900">
                    {group.name}
                  </h3>
                )}
                <div className="space-y-4">
                  {group.fields.map(renderField)}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="p-6 border-t">
        <Button 
          className="w-full" 
          onClick={handleRunClick}
          disabled={isRunning}
        >
          {isRunning ? "Running..." : "Run Workflow"}
        </Button>
      </div>
    </div>
  );
};

export default WorkflowConfig; 