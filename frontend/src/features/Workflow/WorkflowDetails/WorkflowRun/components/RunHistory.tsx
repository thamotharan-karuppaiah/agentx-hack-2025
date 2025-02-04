import { useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onSelectRun: (runId: string) => void;
  selectedRunId: string | null | undefined;
  history: Array<{
    id: string;
    timestamp: string;
    status: string;
  }>;
}

const RunHistory: React.FC<Props> = ({ onSelectRun, selectedRunId, history }) => {
  useParams();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return null;
      case 'running':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Running</span>;
      case 'reviewing':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Review needed</span>;
      case 'canceled':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Cancelled</span>;
      default:
        return null;
    }
  };

  if (!history.length) return null;

  return (
    <div className="p-4">
      <h2 className="text-base font-medium mb-4">30 days history</h2>
      <div className="space-y-1">
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">Today</div>
          {history.map((run) => (
            <div
              key={run.id}
              onClick={() => onSelectRun(run.id)}
              className={cn(
                "flex items-center justify-between p-3 rounded-md hover:bg-gray-100/50 cursor-pointer",
                run.status === 'running' && "bg-gray-50",
                selectedRunId === run.id && "bg-blue-50 hover:bg-blue-50"
              )}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm">
                  At {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {getStatusBadge(run.status)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RunHistory; 