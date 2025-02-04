import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Code2,
  FileJson,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  FileText,
  Globe
} from "lucide-react";
import { PreviewMode } from '../types';
import { cn } from "@/lib/utils";

const PreviewOptions = [
  { id: 'code', icon: Code2, label: 'Code' },
  { id: 'markdown', icon: FileText, label: 'MD' },
  { id: 'html', icon: Globe, label: 'HTML' },
  { id: 'raw', icon: FileJson, label: 'Raw' },
] as const;

interface Props {
  output: any;
  runId?: string;
  onFeedback?: (isPositive: boolean) => void;
}

const WorkflowOutput: React.FC<Props> = ({ output, runId, onFeedback }) => {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('code');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPreviewContent = () => {
    const outputStr = JSON.stringify(output, null, 2);
    const lines = outputStr.split('\n');

    switch (previewMode) {
      case 'code':
        return (
          <div className="p-4 bg-gray-50 font-mono text-sm">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="text-gray-400 w-12 text-right pr-4 select-none">
                  {i + 1}
                </span>
                <span className="flex-1">
                  {line.replace(/^(\s+)/, match => '\u00A0'.repeat(match.length))}
                </span>
              </div>
            ))}
          </div>
        );

      case 'markdown':
        return (
          <div className="p-4 font-mono whitespace-pre-wrap">
            {outputStr}
          </div>
        );

      case 'html':
        return (
          <div className="p-4">
            <div className="p-4 border rounded-md bg-white">
              <pre className="text-sm">{outputStr}</pre>
            </div>
          </div>
        );

      case 'raw':
        return (
          <div className="p-4">
            <pre className="text-sm whitespace-pre-wrap">{outputStr}</pre>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Output</h2>
        <div className="flex items-center gap-2">
          {/* Preview Mode Group Buttons */}
          <div className="flex rounded-md shadow-sm">
            {PreviewOptions.map(({ id, icon: Icon }) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(id as PreviewMode)}
                className={cn(
                  "px-3 py-2 first:rounded-l-md first:border-r-0 last:rounded-r-md last:border-l-0 rounded-none",
                  previewMode === id && "bg-gray-100 border-gray-200",
                  "hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          {/* Copy Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>

          {/* Feedback Buttons */}
          {runId && onFeedback && (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onFeedback(true)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onFeedback(false)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {renderPreviewContent()}
      </div>
    </div>
  );
};

export default WorkflowOutput; 