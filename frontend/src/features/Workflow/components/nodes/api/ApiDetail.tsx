import { NodeDetailProps } from '../../../types';
import { Check, Square } from 'lucide-react';

export function ApiDetail({ data }: NodeDetailProps) {
  const hasConfig = data?.url && data.url.trim().length > 0;

  if (!hasConfig) {
    return (
      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
        <h3 className="text-[15px] font-semibold text-blue-800">Configure API endpoint</h3>
        <p className="text-[14px] text-blue-700 mt-1.5 leading-relaxed">
          Set up the API endpoint details including method, URL, headers, and body
        </p>
      </div>
    );
  }

  const hasHeaders = data.headers && data.headers.trim() !== '{}';
  const hasBody = data.body && data.body.trim() !== '{}';

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[15px] text-gray-500">Method</div>
        <div className="text-[15px] text-gray-900">
          {data.method?.toLowerCase() || 'get'}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[15px] text-gray-500">URL</div>
        <div className="text-[15px] text-gray-900">
          {data.url}
        </div>
      </div>

      <div className="flex items-center">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="text-[15px] text-gray-500">Retries</div>
          <div className="text-[15px] text-gray-900">
            {data.retries || 0}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="text-[15px] text-gray-500">Headers</div>
          {hasHeaders ? (
            <Check className="w-4 h-4 text-gray-900" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="text-[15px] text-gray-500">Body</div>
          {hasBody ? (
            <Check className="w-4 h-4 text-gray-900" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}
