import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Settings2, ChevronLeft, History, Play, Save, Check, Loader2, RotateCcw, Star } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { useWorkflowStore } from '../stores/workflowStore';
import { AppSettingsDialog } from './AppSettingsDialog';
import { workflowService } from '@/services/workflowService';
import { useToast } from "@/hooks/use-toast";
import { VersionSelector } from './VersionSelector';
import { useToolbarStore } from '../stores/toolbarStore';
import { useWorkflowUIStore } from '../stores/workflowUIStore';

export const WorkflowHeader = () => {
  const navigate = useNavigate();
  const { name, defaultVersion, id, updateWorkflowField, setWorkflow } = useWorkflowStore();
  const {isSaving} = useWorkflowUIStore();
  const { selectedVersion, setSelectedVersion, setLocked } = useToolbarStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showPublishSettings, setShowPublishSettings] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const { toast } = useToast();

  const getSaveStatus = () => {
    if (isSaving) {
      return (
        <span className="text-muted-foreground text-sm flex items-center gap-1.5">
          <Save className="h-3 w-3 animate-spin" />
          Saving...
        </span>
      );
    }

    return (
      <span className="text-green-600 text-sm flex items-center gap-1.5">
        <Check className="h-3 w-3" />
        All changes saved
      </span>
    );
  };

  const handlePublishClick = () => {
    if (!name?.trim()) {
      setShowPublishSettings(true);
    } else {
      handlePublishWorkflow();
    }
  };

  const handlePublishWorkflow = async () => {
    if (!id) return;
    setIsPublishing(true);
    try {
      await workflowService.publishWorkflow(id);
      updateWorkflowField('status', 'published');
      toast({
        title: "Success",
        description: "Workflow has been published successfully",
      });
      setShowPublishSettings(false);
    } catch (error) {
      console.error('Failed to publish workflow:', error);
      toast({
        title: "Error",
        description: "Failed to publish workflow",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRestoreVersion = async () => {
    if (!id || !selectedVersion?.id) return;
    setIsRestoring(true);
    try {
      let result = await workflowService.restoreVersion(id, selectedVersion.id);
      setWorkflow(result);
      setSelectedVersion(null);
      setLocked(false);
      toast({
        title: "Success",
        description: "Version has been restored successfully",
      });
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast({
        title: "Error",
        description: "Failed to restore version",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSetDefaultVersion = async () => {
    if (!id || !selectedVersion?.id) return;
    setIsSettingDefault(true);
    try {
      await workflowService.setDefaultVersion(id, selectedVersion.id);
      updateWorkflowField('defaultVersion', selectedVersion.version);
      updateWorkflowField('defaultVersionId', selectedVersion.id);
      toast({
        title: "Success",
        description: "Default version has been updated successfully",
      });
    } catch (error) {
      console.error('Failed to set default version:', error);
      toast({
        title: "Error",
        description: "Failed to set default version",
        variant: "destructive",
      });
    } finally {
      setIsSettingDefault(false);
    }
  };

  return (
    <div className="flex h-14 items-center justify-between border-b px-4 bg-background relative">
      {/* Left Section */}
      <div className="flex items-center gap-2 w-[350px]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {id && <VersionSelector workflowId={id} />}
      </div>

      {/* Center Section - Absolute Positioning */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <h2 className="text-lg font-semibold">{name || 'Untitled Workflow'}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 w-[600px] justify-end">
        {getSaveStatus()}

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="h-4 w-4" />
            Test All
          </Button>

          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            History
          </Button>

          {selectedVersion ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRestoreVersion}
                disabled={isRestoring}
                className="gap-2"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={handleSetDefaultVersion}
                disabled={isSettingDefault || selectedVersion.version === defaultVersion}
                className="gap-2"
              >
                {isSettingDefault ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting Default...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    Set Default
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={handlePublishClick}
              disabled={isPublishing}
              className="gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Workflow'
              )}
            </Button>
          )}
        </div>
      </div>

      <AppSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      <AppSettingsDialog
        open={showPublishSettings}
        onOpenChange={setShowPublishSettings}
        showPublish={true}
        isPublishing={isPublishing}
        onPublish={handlePublishWorkflow}
      />
    </div>
  );
}; 