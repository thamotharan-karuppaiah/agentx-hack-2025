import * as z from 'zod';

export const inputTypes = [
  'short_text',
  'long_text',
  'single_select',
  'multi_select',
  'json',
  'file_text',
  'file_media',
  'file_csv',
  'database',
  'brand_kit',
  'number'
] as const;

export const fieldSchema = z.object({
  id: z.string(),
  type: z.enum(inputTypes),
  label: z.string().optional(),
  variableName: z.string()
    .regex(/^[a-z][a-z0-9_]*$/, "Variable name must start with a letter and can only contain lowercase letters, numbers, and underscores")
    .optional(),
  hint: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  required: z.boolean().default(false),
});

export type FieldSchema = z.infer<typeof fieldSchema>;

export interface Group {
  id: string;
  name: string;
  fields: FieldSchema[];
} 