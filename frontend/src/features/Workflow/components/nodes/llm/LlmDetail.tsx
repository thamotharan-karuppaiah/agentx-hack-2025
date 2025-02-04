import { NodeDetailProps } from '../../../types';

interface LlmNodeData {
  model?: string;
  temperature?: number;
  maxLength?: string;
  systemPrompt?: string;
  messages?: Array<{
    type: 'USER' | 'ASSISTANT';
    content: string;
  }>;
}

export function LlmDetail({ data }: NodeDetailProps) {
  const llmData = data as LlmNodeData;

  if (!llmData) {
    return (
      <div className="p-4 text-gray-500 text-[15px]">
        Configure your LLM settings
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* System Instructions */}
      {llmData.systemPrompt && (
        <div className="space-y-2">
          <h3 className="text-[15px] font-medium text-gray-900">System Instructions</h3>
          <div className="text-[15px] text-gray-700">
            {llmData.systemPrompt}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {llmData.messages && llmData.messages.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[15px] font-medium text-gray-900">Chat</h3>
          <div className="space-y-3">
            {llmData.messages.map((message, index) => (
              <div key={index} className="flex gap-3">
                <div className="h-7 px-3 rounded bg-gray-100 font-mono text-[13px] font-medium flex items-center">
                  {message.type}
                </div>
                <div className="text-[15px] text-gray-700 flex-1">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Summary */}
      <div className="grid grid-cols-3 gap-6 pt-2 border-t border-gray-100">
        <div>
          <div className="text-[13px] text-gray-500">Temperature</div>
          <div className="text-[15px] text-gray-900">{llmData.temperature || 0.7}</div>
        </div>
        <div>
          <div className="text-[13px] text-gray-500">Max length</div>
          <div className="text-[15px] text-gray-900">{llmData.maxLength || 'Auto-Max'}</div>
        </div>
        <div>
          <div className="text-[13px] text-gray-500">Model</div>
          <div className="text-[15px] text-gray-900">{llmData.model || 'GPT-4o'}</div>
        </div>
      </div>
    </div>
  );
} 