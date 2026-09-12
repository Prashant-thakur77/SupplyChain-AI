import { Node, Edge } from 'reactflow';



export interface RiskAnalysisConfig {
  factors: string[];
  weightings: { [key: string]: number };
  threshold: number;
}

export interface ActionContext {
  nodes: Node[];
  edges: Edge[];
  panelId: string;
  internetSearchEnabled?: boolean;
  props: {
    nodes: Node[];
    edges: Edge[];
    onAddNode?: (nodeType: string, label: string, enhancedData?: any) => void;
    onAddMultipleNodes?: (nodes: Partial<Node>[]) => void;
    onAddMultipleEdges?: (edges: Partial<Edge>[]) => void;
    onLoadTemplate?: (templateId: string) => void;
    onClearCanvas?: () => void;
    onValidateSupplyChain?: () => void;
    onUpdateNode?: (nodeId: string, properties: object) => void;
    onUpdateMultipleNodes?: (nodeIds: string[], properties: object) => void;
    onUpdateNodePositions?: (nodePositions: { [nodeId: string]: { x: number; y: number } }) => void;
    onFindAndSelectNode?: (nodeId: string) => void;
    onDeleteNode?: (nodeId: string) => void;
    onUpdateEdge?: (edgeId: string, properties: object) => void;
    onFindAndSelectEdges?: (edgeIds: string[]) => void;

    onHighlightNodes?: (nodeIds: string[]) => void;
    onFocusNode?: (nodeId: string) => void;
    onZoomToNodes?: (nodeIds: string[]) => void;
    onGetNodeConnections?: (nodeId: string) => Edge[];
    onAnalyzeNetworkPaths?: (sourceId: string, targetId: string) => void;
    onBulkUpdateEdges?: (edgeIds: string[], properties: object) => void;
    onCreateNodeGroup?: (nodeIds: string[], groupName: string) => void;
    onExportSubgraph?: (nodeIds: string[]) => void;
  };
} 