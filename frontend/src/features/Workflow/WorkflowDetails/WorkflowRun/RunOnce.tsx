import { useState, useEffect } from 'react';
import RunHistory from "./components/RunHistory";
import WorkflowConfig from "./components/WorkflowConfig";
import WorkflowOutput from "./components/WorkflowOutput";
import { workflowRunService } from './services/workflowRunService';
import { useParams } from 'react-router-dom';
import WorkflowProgress from "./components/WorkflowProgress";
import { WorkflowRunState } from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const RunOnce: React.FC = () => {
  const { workflowId } = useParams();
  const [showHistory, setShowHistory] = useState(true);
  const [output, setOutput] = useState<any>(null);
  const [runState, setRunState] = useState<WorkflowRunState | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const handleSelectRun = async (selectedRunId: string) => {
    const selectedRun = history.find(run => run.id === selectedRunId);
    if (!selectedRun) return;

    setRunId(selectedRunId);

    if (selectedRun.status === 'completed') {
      const result = await workflowRunService.getRunOutput(selectedRunId);
      setOutput(result);
      setRunState(null);
    } else if (selectedRun.status === 'running' || selectedRun.status === 'reviewing') {
      const state = await workflowRunService.checkRunStatus(selectedRunId);
      if (state) {
        setRunState(state);
        setOutput(null);
        if (state.status === 'running') {
          pollWorkflowStatus(selectedRunId);
        }
      }
    }
  };

  useEffect(() => {
    if (!workflowId) return;
    
    const loadHistory = async () => {
      const data = await workflowRunService.getRunHistory(workflowId);
      setHistory(data);

      const activeRun = data.find(run => 
        run.status === 'running' || run.status === 'reviewing'
      );
      if (activeRun) {
        handleSelectRun(activeRun.id);
      }
    };

    loadHistory();
  }, [workflowId]);

  const handleRunWorkflow = async (input: Record<string, any>) => {
    if (!workflowId) return;
    
    try {
      const newRunId = await workflowRunService.runWorkflow(workflowId, input);
      setRunId(newRunId);
      
      // Start polling for status
      pollWorkflowStatus(newRunId);
    } catch (error) {
      console.error('Error running workflow:', error);
    }
  };

  const pollWorkflowStatus = async (currentRunId: string) => {
    while (true) {
      const state = await workflowRunService.checkRunStatus(currentRunId);
      if (!state) break;

      setRunState(state);

      if (state.status === 'completed' || state.status === 'failed') {
        if (state.status === 'completed') {
          const result = await workflowRunService.getRunOutput(currentRunId);
          setOutput(result);
          // Refresh history after completion
          if (workflowId) {
            const updatedHistory = await workflowRunService.getRunHistory(workflowId);
            setHistory(updatedHistory);
          }
        }
        setRunState(null);
        break;
      }

      // Only proceed if status is running (not reviewing)
      if (state.status === 'running') {
        const currentStep = state.steps[state.currentStep - 1];
        
        if (currentStep.status === 'running') {
          await delay(2000); // Simulate processing time

          if (currentStep.id === 3) {
            // Title generation needs review
            await workflowRunService.updateStepStatus(currentRunId, currentStep.id, 'needs_review', {
              title: 'Review Needed',
              subtitle: 'Choose the title',
              description: 'Select the most appropriate title for the article based on the search intent analysis.',
              options: [
                'What Is the Meaning of 1234 in Numerology?',
                'Understanding the Significance of 1234: A Beginner\'s Guide',
                'What Does 1234 Represent? Exploring Its Symbolism',
                'What Is 1234? Insights into Its Cultural Relevance',
                'Decoding 1234: What You Need to Know'
              ]
            });
            // Make sure we update the state one last time
            setRunState(await workflowRunService.checkRunStatus(currentRunId));
            break; // Stop polling until review is complete
          } else {
            await workflowRunService.updateStepStatus(currentRunId, currentStep.id, 'completed');
          }
        }
      }

      await delay(1000); // Poll interval
    }
  };

  const handleReviewSubmit = async (stepId: number, choice: string) => {
    if (!runId) return;

    await workflowRunService.updateStepStatus(runId, stepId, 'completed', {
      selectedOption: choice
    });

    // Resume polling after review is submitted
    pollWorkflowStatus(runId);
  };

  const handleCancel = async () => {
    if (!runId) return;
    await workflowRunService.cancelRun(runId);
    setRunState(null);
    setRunId(null);
    setOutput(null);
  };

  const handleFeedback = async (isPositive: boolean) => {
    if (!runId) return;
    await workflowRunService.submitFeedback(runId, isPositive);
  };

  // Helper to check if a run is active (running or reviewing)
  const isRunActive = (runId: string | null) => {
    if (!runId) return false;
    const run = history.find(r => r.id === runId);
    return run?.status === 'running' || run?.status === 'reviewing';
  };

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {showHistory && history.length > 0 && (
        <div className="w-[240px] border-r bg-gray-50/50">
          <RunHistory 
            onSelectRun={handleSelectRun}
            selectedRunId={runId}
            history={history}
          />
        </div>
      )}

      <div className="flex-1 flex">
        <div className="w-[500px] border-r">
          <WorkflowConfig 
            onToggleHistory={() => setShowHistory(!showHistory)}
            showHistory={showHistory}
            onRun={handleRunWorkflow}
            onCancel={handleCancel}
            isRunning={isRunActive(runId)}
            hasHistory={history.length > 0}
            selectedRun={history.find(r => r.id === runId)}
          />
        </div>

        <div className="flex-1">
          {runState ? (
            <WorkflowProgress 
              runState={runState}
              onReviewSubmit={handleReviewSubmit}
              onCancel={handleCancel}
            />
          ) : output ? (
            <WorkflowOutput 
              output={output} 
              onFeedback={handleFeedback}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default RunOnce; 