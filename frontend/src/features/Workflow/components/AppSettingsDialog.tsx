import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, Loader2 } from "lucide-react";
import { useWorkflowStore } from '../stores/workflowStore';
import { useWorkflowUIStore, WorkflowUIState } from '../stores/workflowUIStore';
import { Button } from '@/components/ui/button';
import type { WorkflowState } from '../stores/workflowStore';

interface AppSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    showPublish?: boolean;
    isPublishing?: boolean;
    onPublish?: () => void;
}

// Store selectors
const selectName = (state: WorkflowState) => state.name;
const selectDescription = (state: WorkflowState) => state.description;
const selectReadme = (state: WorkflowState) => state.readme;
const selectIsSaving = (state: WorkflowUIState) => state.isSaving;
const selectUpdateWorkflowField = (state: WorkflowState) => state.updateWorkflowField;
export const AppSettingsDialog = ({
    open,
    onOpenChange,
    showPublish = false,
    isPublishing = false,
    onPublish
}: AppSettingsDialogProps) => {
    // Use selectors for store access
    const name = useWorkflowStore(selectName);
    const description = useWorkflowStore(selectDescription);
    const readme = useWorkflowStore(selectReadme);
    const isSaving = useWorkflowUIStore(selectIsSaving);
    const updateWorkflowField = useWorkflowStore(selectUpdateWorkflowField);

    const [localSettings, setLocalSettings] = useState({
        name: name || '',
        description: description || '',
        readme: readme || ''
    });

    // Update local settings when workflow changes
    useEffect(() => {
        if (name) {
            setLocalSettings({
                name: name,
                description: description || '',
                readme: readme || ''
            });
        }
    }, [name, description, readme]);

    const handleChange = (field: keyof typeof localSettings) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const newValue = e.target.value;
        setLocalSettings(prev => ({ ...prev, [field]: newValue }));

        updateWorkflowField(field, newValue);
    };

    const canPublish = localSettings.name.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>Tool Settings</DialogTitle>
                    {isSaving ? (
                        <span className="text-muted-foreground text-sm flex items-center gap-1.5">Saving...</span>
                    ) : (
                        <span className="text-green-600 text-sm flex items-center gap-1.5">
                            <Check className="h-3 w-3" />
                            All changes saved
                        </span>
                    )}
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tool Name</label>
                        <Input
                            value={localSettings.name}
                            onChange={handleChange('name')}
                            placeholder="Enter tool name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center justify-between">
                            Tool Description
                            <span className="text-sm text-muted-foreground">(Optional)</span>
                        </label>
                        <Textarea
                            value={localSettings.description}
                            onChange={handleChange('description')}
                            placeholder="Write an optional description for your tool."
                            className="h-24 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center justify-between">
                            Readme
                            <span className="text-sm text-muted-foreground">(Optional)</span>
                        </label>
                        <Textarea
                            value={localSettings.readme}
                            onChange={handleChange('readme')}
                            placeholder="Write documentation, usage instructions, or any other relevant information."
                            className="h-48 resize-none"
                        />
                    </div>

                    {showPublish && (
                        <div className="pt-4 border-t flex justify-end">
                            <Button
                                size="sm"
                                className="gap-2"
                                onClick={onPublish}
                                disabled={!canPublish || isPublishing}
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
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}; 