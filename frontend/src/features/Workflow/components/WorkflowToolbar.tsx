import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useReactFlow } from 'reactflow';
import {
  Megaphone,
  Lock,
  Unlock,
  Maximize2,
  FileJson,
  Upload,
  MessageCircle,
  HelpCircle,
  Minus,
  Plus,
  Map,
} from "lucide-react";
import { useToolbarStore } from '../stores/toolbarStore';
import { cn } from "@/lib/utils";
import type { ToolbarState } from '../stores/toolbarStore';

// Store selectors
const selectIsLocked = (state: ToolbarState) => state.isLocked;
const selectShowMinimap = (state: ToolbarState) => state.showMinimap;
const selectSetLocked = (state: ToolbarState) => state.setLocked;
const selectSetShowMinimap = (state: ToolbarState) => state.setShowMinimap;
const selectExportWorkflow = (state: ToolbarState) => state.exportWorkflow;
const selectImportWorkflow = (state: ToolbarState) => state.importWorkflow;

export const WorkflowToolbar = () => {
  const { 
    getZoom,
    fitView,
    getViewport,
    setViewport
  } = useReactFlow();

  // Use selectors for store access
  const isLocked = useToolbarStore(selectIsLocked);
  const showMinimap = useToolbarStore(selectShowMinimap);
  const setLocked = useToolbarStore(selectSetLocked);
  const setShowMinimap = useToolbarStore(selectSetShowMinimap);
  const exportWorkflow = useToolbarStore(selectExportWorkflow);
  const importWorkflow = useToolbarStore(selectImportWorkflow);

  const zoom = Math.round(getZoom() * 100);

  const handleExport = () => {
    const workflow = exportWorkflow();
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = 'workflow.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event: any) => {
        try {
          const workflow = JSON.parse(event.target.result);
          importWorkflow(workflow);
        } catch (error) {
          console.error('Error importing workflow:', error);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleZoomIn = () => {
    const { x, y } = getViewport();
    const currentZoom = getZoom();
    const newZoom = Math.min(2, currentZoom + 0.1);
    setViewport({ x, y, zoom: newZoom });
  };

  const handleZoomOut = () => {
    const { x, y } = getViewport();
    const currentZoom = getZoom();
    const newZoom = Math.max(0.2, currentZoom - 0.1);
    setViewport({ x, y, zoom: newZoom });
  };

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white rounded-full shadow-lg border p-1.5 z-50">
      <div className="flex items-center gap-1 pr-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Megaphone className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={5}>
            Product Updates
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-1 px-1 border-l">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6"
          onClick={handleZoomOut}
          disabled={zoom <= 20}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="text-center text-xs font-medium w-12">{zoom}%</span>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-1 px-1 border-l">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6"
              onClick={() => setLocked(!isLocked)}
            >
              {isLocked ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={5}>
            {isLocked ? 'Unlock Canvas' : 'Lock Canvas'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6"
              onClick={() => fitView({ padding: 0.1 })}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={5}>
            Fit to View
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-1 pl-1 border-l">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className={cn("h-6 w-6", showMinimap && "bg-gray-100")}
              onClick={() => setShowMinimap(!showMinimap)}
            >
              <Map className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={5}>
            {showMinimap ? 'Hide Minimap' : 'Show Minimap'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6"
              onClick={handleExport}
            >
              <FileJson className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={5}>
            Export Workflow
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6"
              onClick={handleImport}
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={5}>
            Import Workflow
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={5}>
            Annotate
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={5}>
            Help
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}; 