// src/store/digitalTwinStore.ts
import { create } from 'zustand';
import { Node, Edge } from 'reactflow';

interface DigitalTwinState {
  // Core graph elements
  nodes: Node[];
  edges: Edge[];
  
  // UI state
  selectedElement: Node | Edge | null;
  hoveredElement: string | null;
  simulationMode: boolean;
  isControlTowerMode: boolean;
  selectedSupplyChain: string;
  disruptedNodes: string[];
  disruptedEdges: string[];
  disruptionAnalysis: any | null;
  isAnalyzingDisruption: boolean;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNode: (nodeId: string, data: any) => void;
  updateEdge: (edgeId: string, data: any) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  setSelectedElement: (element: Node | Edge | null) => void;
  setHoveredElement: (elementId: string | null) => void;
  setSimulationMode: (mode: boolean) => void;
  setControlTowerMode: (mode: boolean) => void;
  setSelectedSupplyChain: (id: string) => void;
  setDisruptedNodes: (nodes: string[]) => void;
  setDisruptedEdges: (edges: string[]) => void;
  clearDisruptions: () => void;
  setDisruptionAnalysis: (analysis: any | null) => void;
  setIsAnalyzingDisruption: (isAnalyzing: boolean) => void;
  
  // Simulation
  runSimulation: () => void;
  
  // Import/Export
  importGraph: (data: { nodes: Node[], edges: Edge[] }) => void;
  exportGraph: () => { nodes: Node[], edges: Edge[] };
}

export const useDigitalTwinStore = create<DigitalTwinState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  selectedElement: null,
  hoveredElement: null,
  simulationMode: false,
  isControlTowerMode: false,
  selectedSupplyChain: 'default-chain',
  disruptedNodes: [],
  disruptedEdges: [],
  disruptionAnalysis: null,
  isAnalyzingDisruption: false,
  
  // Node & Edge actions
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  updateNode: (nodeId, data) => set((state) => ({
    nodes: state.nodes.map((node) => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...data } }
        : node
    )
  })),
  
  updateEdge: (edgeId, data) => set((state) => ({
    edges: state.edges.map((edge) => 
      edge.id === edgeId 
        ? { ...edge, data: { ...edge.data, ...data } }
        : edge
    )
  })),
  
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),
  
  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge]
  })),
  
  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((node) => node.id !== nodeId),
    // Also remove connected edges
    edges: state.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    )
  })),
  
  removeEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter((edge) => edge.id !== edgeId)
  })),
  
  // UI state actions
  setSelectedElement: (element) => set({ selectedElement: element }),
  setHoveredElement: (elementId) => set({ hoveredElement: elementId }),
  setSimulationMode: (mode) => set({ simulationMode: mode }),
  setControlTowerMode: (mode) => set({ 
    isControlTowerMode: mode, 
    // Clear disruptions when exiting control tower mode
    ...(mode === false ? { disruptedNodes: [], disruptedEdges: [], disruptionAnalysis: null } : {})
  }),
  setSelectedSupplyChain: (id) => set({ selectedSupplyChain: id }),
  setDisruptedNodes: (nodes) => set({ disruptedNodes: nodes }),
  setDisruptedEdges: (edges) => set({ disruptedEdges: edges }),
  clearDisruptions: () => set({ disruptedNodes: [], disruptedEdges: [], disruptionAnalysis: null }),
  setDisruptionAnalysis: (analysis) => set({ disruptionAnalysis: analysis }),
  setIsAnalyzingDisruption: (isAnalyzing) => set({ isAnalyzingDisruption: isAnalyzing }),
  
  // Simulation
  runSimulation: () => {
    set({ simulationMode: true });
    
    // Mock simulation logic - in real app would call API
    // Randomly update risk scores on nodes
    const { nodes, edges } = get();
    
    const updatedNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        riskScore: Math.random()
      },
      style: {
        ...node.style,
        background: Math.random() > 0.7 
          ? '#fee2e2' // high risk 
          : Math.random() > 0.4 
            ? '#fef3c7' // medium risk
            : '#dcfce7' // low risk
      }
    }));
    
    const updatedEdges = edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        riskMultiplier: 1 + Math.random()
      },
      animated: Math.random() > 0.5
    }));
    
    set({ 
      nodes: updatedNodes,
      edges: updatedEdges
    });
  },
  
  // Import/Export
  importGraph: ({ nodes, edges }) => set({ nodes, edges }),
  exportGraph: () => {
    const { nodes, edges } = get();
    return { nodes, edges };
  }
}));