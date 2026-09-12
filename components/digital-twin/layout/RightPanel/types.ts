import { Node, Edge } from 'reactflow';

// Save status type
export type SaveStatus = 'saved' | 'unsaved' | 'saving';

export interface RightPanelProps {
  selectedElement: Node | Edge | null;
  onUpdate: (updatedElement: Node | Edge) => void;
  onDelete?: (elementId: string) => void;
  onUngroup?: (groupId: string) => void;
  onAnalyzeNode?: (nodeId: string, nodeLabel: string) => void;
  nodes?: Node[];
  onSave?: () => Promise<void>; // Add optional onSave prop for triggering parent save
}

export interface SaveStatusIndicatorProps {
  saveStatus: SaveStatus;
}