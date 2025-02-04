import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface WorkflowConfigProps {
  onToggleHistory: () => void;
  showHistory: boolean;
  onRun: (input: Record<string, any>) => void;
  onCancel?: () => void;
  isRunning: boolean;
  hasHistory: boolean;
  selectedRun?: {
    id: string;
    status: string;
  };
}

const WorkflowConfig: React.FC<WorkflowConfigProps> = ({ 
  onToggleHistory, 
  showHistory, 
  onRun,
  onCancel,
  isRunning,
  hasHistory,
  selectedRun
}) => {
  const handleRunClick = () => {
    if (isRunning) {
      onCancel?.();
    } else {
      onRun({
        firstInput: 'my default value',
        secondInput: 'test'
      });
    }
  };

  const getButtonState = () => {
    if (!selectedRun) {
      return {
        text: 'Run Workflow',
        variant: 'default' as const,
        showLoader: false
      };
    }

    switch (selectedRun.status) {
      case 'running':
      case 'reviewing':
        return {
          text: 'Cancel',
          variant: 'outline' as const,
          showLoader: true
        };
      case 'completed':
      case 'canceled':
      case 'failed':
        return {
          text: 'Run Workflow',
          variant: 'default' as const,
          showLoader: false
        };
      default:
        return {
          text: 'Run Workflow',
          variant: 'default' as const,
          showLoader: false
        };
    }
  };

  const buttonState = getButtonState();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6">
        <h2 className="text-lg font-semibold mb-6">Apple</h2>

        <div className="space-y-6">
          {/* First Input */}
          <div className="space-y-2">
            <Label>first input optional d <span className="text-muted-foreground">(Optional)</span></Label>
            <Input placeholder="my default value" />
            <div className="text-sm text-muted-foreground">Test world</div>
          </div>

          {/* Second Input */}
          <div className="space-y-2">
            <Label>Second input required</Label>
            <Input placeholder="test" />
            <div className="text-sm text-muted-foreground">apple</div>
          </div>

          {/* Add more input fields as needed */}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t p-4 flex items-center justify-between">
        {hasHistory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHistory}
            className="text-muted-foreground"
          >
            {showHistory ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide History
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show History
              </>
            )}
          </Button>
        )}
        <Button 
          onClick={handleRunClick}
          variant={buttonState.variant}
          className="min-w-[120px]"
        >
          {buttonState.showLoader ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {buttonState.text}
            </>
          ) : (
            buttonState.text
          )}
        </Button>
      </div>
    </div>
  );
};

export default WorkflowConfig; 