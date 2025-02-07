import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkflow } from '../WorkflowContext';
import WorkflowConfig from "./components/WorkflowConfig";
import WorkflowOutput from "./components/WorkflowOutput";
import { workflowRunService } from './services/workflowRunService';
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const RunOnce: React.FC = () => {
  const toast = useToast();
  const { workflowId } = useParams();
  const { workflow } = useWorkflow();
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<any>(null);

  const handleRunWorkflow = async (input: Record<string, any>) => {
    if (!workflowId) return;
    
    try {
      // Validate required fields
      const inputNode = workflow?.config?.nodes?.find(node => node.type === 'start');
      const missingFields = workflowRunService.validateRequiredFields(inputNode, input);
      
      if (missingFields.length > 0) {
        toast.toast({
          title: "Missing required fields",
          description: `Missing required fields: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      setIsRunning(true);
      setOutput(null);
      
      const result = await workflowRunService.runWorkflowSync(workflowId, input);
      setOutput(result);
    } catch (error) {
      toast.toast({
        title: "Error running workflow",
        description: "Please try again",
        variant: "destructive",
      });
      console.error('Error running workflow:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const renderOutputContent = () => {
    if (isRunning) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-lg font-medium">Running Workflow</p>
          <p className="text-sm">This might take a few moments...</p>
        </div>
      );
    }

    if (output) {
      return <WorkflowOutput output={output} />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="max-w-sm text-center">
          <h3 className="text-lg font-medium mb-2">No Output Yet</h3>
          <p className="text-sm text-gray-400">
            Configure your inputs on the left and run the workflow to see the results here
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full">
      <div className="w-[500px] border-r">
        <WorkflowConfig 
          onRun={handleRunWorkflow}
          isRunning={isRunning}
        />
      </div>

      <div className="flex-1">
        {renderOutputContent()}
      </div>
    </div>
  );
};

export default RunOnce; 