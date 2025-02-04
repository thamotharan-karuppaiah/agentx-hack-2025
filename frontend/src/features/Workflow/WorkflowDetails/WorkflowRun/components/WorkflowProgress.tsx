import { Sparkles } from "lucide-react";
import { WorkflowRunState, WorkflowStep } from "../types";
import { cn } from "@/lib/utils";
import ReviewStep from "./ReviewStep";

interface Props {
  runState: WorkflowRunState;
  onReviewSubmit?: (stepId: number, choice: string) => void;
  onCancel: () => void;
}

const WorkflowProgress: React.FC<Props> = ({ runState, onReviewSubmit, onCancel }) => {
  const currentStep = runState.steps[runState.currentStep - 1];

  const renderStepContent = (step: WorkflowStep) => {
    if ((step.status === 'needs_review' || runState.status === 'reviewing') && step.reviewData) {
      return (
        <ReviewStep
          title={step.reviewData.title}
          subtitle={step.reviewData.subtitle}
          description={step.reviewData.description}
          options={step.reviewData.options}
          onConfirm={(choice) => onReviewSubmit?.(step.id, choice)}
          onCancel={onCancel}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">
            Running step {runState.currentStep} of {runState.totalSteps}
          </h3>
          <p className="text-sm text-muted-foreground">({step.name})</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 px-8 py-4 flex items-center justify-center">
        {renderStepContent(currentStep)}
      </div>
      <div className="border-t bg-white p-4">
        <div className="flex gap-2">
          {runState.steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex-1 h-2 rounded-full",
                step.status === 'completed' && "bg-green-500",
                step.status === 'running' && "bg-purple-500",
                step.status === 'needs_review' && "bg-yellow-500",
                step.status === 'failed' && "bg-red-500",
                step.status === 'pending' && "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgress; 