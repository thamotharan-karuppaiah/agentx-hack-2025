import { create } from 'zustand';
import { Viewport } from 'reactflow';
import { WorkflowConfig } from '../types';

interface Version {
  id: string;
  version: number;
  createdAt: string;
  createdBy: {
    name: string;
  };
  config: WorkflowConfig;
}

export interface ToolbarState {
  // Canvas states
  isLocked: boolean;
  zoom: number;
  showMinimap: boolean;
  viewport: Viewport;
  selectedVersion: Version | null;

  // Actions
  setLocked: (locked: boolean) => void;
  setZoom: (zoom: number) => void;
  setShowMinimap: (show: boolean) => void;
  setViewport: (viewport: Viewport) => void;
  setSelectedVersion: (version: Version | null) => void;
  exportWorkflow: () => any;
  importWorkflow: (workflow: any) => void;
  resetToolbar: () => void;
}

export const useToolbarStore = create<ToolbarState>((set) => ({
  isLocked: false,
  zoom: 1,
  showMinimap: localStorage.getItem('showMinimap') !== 'false',
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedVersion: null,

  setLocked: (locked) => set({ isLocked: locked }),
  setZoom: (zoom) => set({ zoom }),
  setViewport: (viewport) => set({ viewport }),
  setSelectedVersion: (version) => set({ selectedVersion: version }),
  setShowMinimap: (show) => {
    localStorage.setItem('showMinimap', String(show));
    set({ showMinimap: show });
  },
  exportWorkflow: () => {
    // Export logic here
    return {};
  },
  importWorkflow: () => {
    // Import logic here
  },
  resetToolbar: () => {
    set({
      isLocked: false,
      zoom: 1,
      showMinimap: localStorage.getItem('showMinimap') !== 'false',
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedVersion: null,
    });
  },
})); 