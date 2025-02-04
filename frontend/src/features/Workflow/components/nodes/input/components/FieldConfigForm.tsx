import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { FieldSchema, fieldSchema } from '../types';
import { useCallback, useEffect } from 'react';
import { FIELD_TYPES, FIELD_TYPE_ICONS } from '../constants';

interface FieldConfigFormProps {
  onSave: (field: FieldSchema) => void;
  initialField?: FieldSchema;
}

export function FieldConfigForm({ onSave, initialField }: FieldConfigFormProps) {
  const form = useForm<FieldSchema>({
    resolver: zodResolver(fieldSchema),
    defaultValues: initialField || {
      id: `field-${Date.now()}`,
      label: '',
      variableName: '',
      type: 'short_text',
      hint: '',
      placeholder: '',
      defaultValue: '',
      required: false
    }
  });

  const { watch, getValues } = form;
  const label = watch('label');

  const generateVariableName = useCallback((label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
  }, []);

  const handleFormChange = useCallback(() => {
    const values = getValues();
    const derivedVariableName = values.label ? generateVariableName(values.label) : '';
    
    onSave({
      ...values,
      id: initialField?.id || values.id,
      variableName: values.variableName || derivedVariableName
    });
  }, [getValues, initialField?.id, generateVariableName, onSave]);

  useEffect(() => {
    if (initialField) {
      Object.entries(initialField).forEach(([key, value]) => {
        form.setValue(key as keyof FieldSchema, value);
      });
    }
  }, [form, initialField]);

  return (
    <Form {...form}>
      <form onChange={handleFormChange} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Input Type</FormLabel>
              <div className="grid grid-cols-3 gap-3">
                {FIELD_TYPES.map(type => {
                  const Icon = FIELD_TYPE_ICONS[type.value];
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => field.onChange(type.value)}
                      className={`flex flex-col items-center justify-center h-[72px] border rounded-lg transition-colors ${
                        field.value === type.value 
                          ? 'border-2 border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-6 h-6 mb-1.5 text-gray-600" />
                      <span className="text-xs text-gray-600">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input placeholder="Input Label" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="variableName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variable Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder={label ? generateVariableName(label) : "Input Variable Name"} 
                  {...field} 
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    if (!value || /^[a-z][a-z0-9_]*$/.test(value)) {
                      field.onChange(value);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                {!field.value ? 
                  "Will use the label in lowercase with spaces replaced by underscores" :
                  "Must start with a letter and can only contain lowercase letters, numbers, and underscores"
                }
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hint</FormLabel>
              <FormControl>
                <Textarea placeholder="Input Hint" {...field} />
              </FormControl>
              <FormDescription>
                The hint can use markdown syntax.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="placeholder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placeholder</FormLabel>
              <FormControl>
                <Input placeholder="Input Placeholder" {...field} />
              </FormControl>
              <FormDescription>
                Placeholder text for the input.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="required"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between py-2">
              <div>
                <FormLabel>Required</FormLabel>
                <FormDescription>Make this field mandatory</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
} 