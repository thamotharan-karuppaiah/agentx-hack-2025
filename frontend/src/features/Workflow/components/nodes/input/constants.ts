import { 
  TextIcon, 
  AlignLeft, 
  ListChecks, 
  List, 
  Braces, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  Database, 
  Palette, 
  Hash 
} from 'lucide-react';

export const FIELD_TYPE_ICONS = {
  short_text: TextIcon,
  long_text: AlignLeft,
  single_select: ListChecks,
  multi_select: List,
  json: Braces,
  file_text: FileText,
  file_media: FileImage,
  file_csv: FileSpreadsheet,
  database: Database,
  brand_kit: Palette,
  number: Hash
} as const;

export const FIELD_TYPES = [
  { label: 'Short Text', value: 'short_text' },
  { label: 'Long Text', value: 'long_text' },
  { label: 'Single Select', value: 'single_select' },
  { label: 'Multi Select', value: 'multi_select' },
  { label: 'JSON', value: 'json' },
  { label: 'File Text', value: 'file_text' },
  { label: 'File Media', value: 'file_media' },
  { label: 'File CSV', value: 'file_csv' },
  { label: 'Database', value: 'database' },
  { label: 'Brand Kit', value: 'brand_kit' },
  { label: 'Number', value: 'number' }
] as const; 