import { Code2 } from 'lucide-react';
import { NodeDetailProps } from '../../../types';
import { CAceEditor } from '@/components/ui/c-ace-editor';

export function CodeDetail({ data }: NodeDetailProps) {
  const hasCode = data?.code && data.code.trim().length > 0;
  const language = data?.language || 'javascript';

  if (!hasCode) {
    return (
      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
        <h3 className="text-[15px] font-semibold text-blue-800">Define your function</h3>
        <p className="text-[14px] text-blue-700 mt-1.5 leading-relaxed">
          Add code that will be executed in your workflow
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-[15px] text-gray-500">Language</div>
        <div className="text-[15px] text-gray-900">
          {language.toLowerCase()}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[15px] text-gray-500">Function preview</div>
        <div className="min-h-[50px] max-h-[260px]" 
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
         >
          <CAceEditor
            value={data.code}
            mode={language as 'javascript' | 'python'}
            readOnly
            minLines={2}
            maxLines={10}
            showGutter={false}
            highlightActiveLine={false}
            className="bg-gray-50 h-full"
          />
        </div>
      </div>
    </div>
  );
}
