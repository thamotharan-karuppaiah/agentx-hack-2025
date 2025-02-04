import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, X } from "lucide-react";
import { workflowService } from '@/services/workflowService';
import { Badge } from '@/components/ui/badge';
import { ToolbarState, useToolbarStore } from '../stores/toolbarStore';
import { useWorkflowStore, WorkflowState } from '../stores/workflowStore';
import { WorkflowConfig } from '../types';

// Store selectors
const selectSelectedVersion = (state: ToolbarState) => state.selectedVersion;
const selectSetSelectedVersion = (state: ToolbarState) => state.setSelectedVersion;
const selectSetLocked = (state: ToolbarState) => state.setLocked;

const selectTotalVersions = (state: WorkflowState) => state.totalVersions;
const selectDefaultVersion = (state: WorkflowState) => state.defaultVersion;
interface Version {
  id: string;
  version: number;
  createdAt: string;
  createdBy: {
    name: string;
  };
  config: WorkflowConfig;
}

interface VersionSelectorProps {
  workflowId: string;
}

export function VersionSelector({ workflowId }: VersionSelectorProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);

  // Use selectors for store access
  const selectedVersion = useToolbarStore(selectSelectedVersion);
  const setSelectedVersion = useToolbarStore(selectSetSelectedVersion);
  const setLocked = useToolbarStore(selectSetLocked);
  const totalVersions = useWorkflowStore(selectTotalVersions);
  const defaultVersion = useWorkflowStore(selectDefaultVersion);

  const fetchVersions = async () => {
    if (!workflowId) return;
    setLoading(true);
    try {
      const data = await workflowService.getWorkflowVersions(workflowId);
      const sortedVersions = data.sort((a, b) => b.version - a.version);
      setVersions(sortedVersions);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchVersions();
    const interval = setInterval(fetchVersions, 30000);
    return () => clearInterval(interval);
  }, [workflowId]);

  // Refresh versions when workflow changes (e.g., after publish)
  useEffect(() => {
    if (totalVersions) {
      fetchVersions();
    }
  }, [totalVersions]);

  const handleVersionSelect = async (version: Version) => {
    try {
      const versionData = await workflowService.getWorkflowVersion(workflowId, version.id);
      setSelectedVersion(versionData);
      setLocked(true); // Lock the designer when viewing a version
    } catch (error) {
      console.error('Failed to fetch version data:', error);
    }
  };

  const handleClearVersion = () => {
    setSelectedVersion(null);
    setLocked(false); // Unlock the designer when clearing version selection
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'less than a minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 120) return '1 hour ago';
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            disabled={loading}
          >
            <Clock className="h-4 w-4" />
            Versions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[400px] p-0">
          {versions.map((version) => (
            <DropdownMenuItem 
              key={version.id}
              onClick={() => handleVersionSelect(version)}
              className="px-4 py-2 focus:bg-gray-50 cursor-pointer"
            >
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-gray-900">Version {version.version}</span>
                    {defaultVersion && version.version === defaultVersion && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 font-normal px-2 h-5">
                        Default
                      </Badge>
                    )}
                  </div>
                  <span className="text-[13px] text-gray-500">
                    {formatTimeAgo(version.createdAt)}
                  </span>
                </div>
                <div className="text-[13px] text-gray-500">
                  by {version.createdBy?.name || 'Unknown'}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedVersion && (
        <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1">
          <span className="text-gray-500 text-sm">Viewing</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Version {selectedVersion.version}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-gray-200"
              onClick={handleClearVersion}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 