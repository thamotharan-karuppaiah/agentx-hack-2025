import { Loader2 } from "lucide-react";

const WorkspaceLoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">Setting up your workspace...</h2>
        <p className="text-sm text-muted-foreground">
          This may take a few moments
        </p>
      </div>
    </div>
  );
};

export default WorkspaceLoadingScreen; 