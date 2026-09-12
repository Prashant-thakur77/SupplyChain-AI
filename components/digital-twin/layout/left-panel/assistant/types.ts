import { Node, Edge } from 'reactflow';

export interface AISuggestion {
  id: string
  title: string
  description: string
  action: string
  confidence: number
  category: 'optimization' | 'risk' | 'efficiency' | 'cost' | 'planning'
}

export interface AutocompleteSuggestion {
  id: string
  text: string
  description?: string
  action?: string
  type: 'completion' | 'suggestion' | 'command'
  confidence: number
}

export interface ChatError {
  type: 'CONNECTION' | 'RATE_LIMIT' | 'VALIDATION' | 'SERVICE' | 'UNKNOWN';
  message: string;
  code?: string;
  retryable: boolean;
}

export interface AIChatPanelProps {
  simulationMode?: boolean;
  onImmersiveModeChange?: (isImmersive: boolean) => void;
  isImmersiveMode?: boolean;
  onCollapse?: () => void;
  // CopilotKit integration props
  nodes?: Node[];
  edges?: Edge[];
  onAddNode?: (nodeType: string, label: string, enhancedData?: any) => void;
  onAddNodeAtPosition?: (nodeType: string, position: { x: number; y: number }, label?: string, enhancedData?: any) => void;
  onAddMultipleNodes?: (nodes: Partial<Node>[]) => void;
  onAddMultipleEdges?: (edges: Partial<Edge>[]) => void;
  onAddEdges?: (edges: Edge[]) => void;
  onLoadTemplate?: (templateId: string) => void;
  onClearCanvas?: () => void;
  onUpdateNode?: (nodeId: string, updates: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onUpdateEdge?: (edgeId: string, updates: any) => void;
  onValidateSupplyChain?: () => void;
  onUpdateMultipleNodes?: (nodeIds: string[], properties: object) => void;
  onUpdateNodePositions?: (nodePositions: { [nodeId: string]: { x: number; y: number } }) => void;
  onFindAndSelectNode?: (nodeId: string) => void;
  onFindAndSelectEdges?: (edgeIds: string[]) => void;

  onHighlightNodes?: (nodeIds: string[]) => void;
  onFocusNode?: (nodeId: string) => void;
  onZoomToNodes?: (nodeIds: string[]) => void;
  onGetNodeConnections?: (nodeId: string) => Edge[];
  onAnalyzeNetworkPaths?: (sourceId: string, targetId: string) => void;
  onBulkUpdateEdges?: (edgeIds: string[], properties: object) => void;
  onCreateNodeGroup?: (nodeIds: string[], groupName: string) => void;
  onExportSubgraph?: (nodeIds: string[]) => void;
  pendingAIMessage?: string | null;
  setPendingAIMessage?: (message: string | null) => void;
}

export interface MessagesAreaProps {
  messages: any[];
  isLoading: boolean;
  isImmersiveMode: boolean;
  messagesHeight: string | number;
  error?: ChatError | null;
  onRetryError?: () => void;
  onDismissError?: () => void;
  retryCount?: number;
}

export interface AutocompleteInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (message: string) => void;
  isLoading: boolean;
  autocompleteSuggestions: AutocompleteSuggestion[];
  recentQueries: string[];
  onAutocompleteSelect: (suggestion: AutocompleteSuggestion) => void;
  showRecentInHeader: boolean;
}

export interface AISuggestionsProps {
  suggestions: AISuggestion[];
  isLoading: boolean;
  onApplySuggestion: (suggestion: AISuggestion, e?: React.MouseEvent) => void;
  onRefresh: () => void;
}

export interface ImmersiveHeaderProps {
  onExit: () => void;
  onCollapse?: () => void;
  internetSearch?: boolean;
  setInternetSearch?: (value: boolean) => void;
  isSearching?: boolean;
} 