import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

// ELK is dynamically imported to avoid SSR issues

interface LayoutConfiguration {
  algorithm: 'dagre' | 'elk' | 'hierarchical' | 'force';
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  spacing: { node: number; rank: number; };
  animation?: boolean;
}

export class LayoutManager {
  private static elk: any = null;

  private static async getElk() {
    if (!this.elk && typeof window !== 'undefined') {
      try {
        const elkModule = await import('elkjs');
        this.elk = new elkModule.default();
      } catch (error) {
        console.warn('ElkJS not available:', error);
        return null;
      }
    }
    return this.elk;
  }

  /**
   * Apply Dagre layout algorithm to nodes and edges
   */
  static async applyDagreLayout(
    nodes: Node[], 
    edges: Edge[], 
    direction: string = 'TB'
  ): Promise<{ nodes: Node[], edges: Edge[] }> {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ 
      rankdir: direction,
      nodesep: 150,
      ranksep: 200,
      marginx: 50,
      marginy: 50
    });

    // Add nodes to graph
    nodes.forEach(node => {
      g.setNode(node.id, { 
        width: node.width || 150, 
        height: node.height || 100 
      });
    });

    // Add edges to graph
    edges.forEach(edge => {
      g.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(g);

    // Update node positions
    const layoutedNodes = nodes.map(node => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - (node.width || 150) / 2,
          y: nodeWithPosition.y - (node.height || 100) / 2,
        },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  /**
   * Apply ELK layout algorithm to nodes and edges
   */
  static async applyELKLayout(
    nodes: Node[], 
    edges: Edge[], 
    config: LayoutConfiguration
  ): Promise<{ nodes: Node[], edges: Edge[] }> {
    const elkNodes: any[] = nodes.map(node => ({
      id: node.id,
      width: node.width || 150,
      height: node.height || 100,
    }));

    const elkEdges: any[] = edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    }));

    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': config.direction,
        'elk.spacing.nodeNode': config.spacing.node.toString(),
        'elk.layered.spacing.nodeNodeBetweenLayers': config.spacing.rank.toString(),
      },
      children: elkNodes,
      edges: elkEdges,
    };

    const elk = await this.getElk();
    if (!elk) {
      // Fallback to Dagre if ELK is not available
      console.warn('ELK not available, falling back to Dagre layout');
      return this.applyDagreLayout(nodes, edges, config.direction);
    }

    const layoutedGraph = await elk.layout(elkGraph);

    const layoutedNodes = nodes.map(node => {
      const elkNode = layoutedGraph.children?.find((n: any) => n.id === node.id);
      return {
        ...node,
        position: {
          x: elkNode?.x || 0,
          y: elkNode?.y || 0,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  /**
   * Apply hierarchical layout for supply chain structures
   */
  static async applyHierarchicalLayout(
    nodes: Node[], 
    edges: Edge[]
  ): Promise<{ nodes: Node[], edges: Edge[] }> {
    // Group nodes by type hierarchy
    const nodeHierarchy = {
      supplier: 0,
      factory: 1,
      warehouse: 2,
      distribution: 3,
      retailer: 4
    };

    const levels: Node[][] = [];
    const maxLevel = Math.max(...Object.values(nodeHierarchy));

    // Initialize levels
    for (let i = 0; i <= maxLevel; i++) {
      levels[i] = [];
    }

    // Group nodes by level
    nodes.forEach(node => {
      const nodeType = node.type?.replace('Node', '').toLowerCase() || 'supplier';
      const level = nodeHierarchy[nodeType as keyof typeof nodeHierarchy] || 0;
      levels[level].push(node);
    });

    // Position nodes
    const layoutedNodes = nodes.map(node => {
      const nodeType = node.type?.replace('Node', '').toLowerCase() || 'supplier';
      const level = nodeHierarchy[nodeType as keyof typeof nodeHierarchy] || 0;
      const levelNodes = levels[level];
      const indexInLevel = levelNodes.findIndex(n => n.id === node.id);
      
      return {
        ...node,
        position: {
          x: indexInLevel * 250 + 100,
          y: level * 200 + 100,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  /**
   * Animate layout transition
   */
  static animateLayout(
    fromNodes: Node[], 
    toNodes: Node[], 
    duration: number = 1000
  ): void {
    // Animation implementation would go here
    // This is a placeholder for future implementation
    console.log('Animating layout transition...', { fromNodes, toNodes, duration });
  }

  /**
   * Auto-select best layout algorithm based on graph characteristics
   */
  static selectOptimalLayout(nodes: Node[], edges: Edge[]): string {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const density = nodeCount > 0 ? edgeCount / nodeCount : 0;

    // For small graphs, use hierarchical
    if (nodeCount <= 10) return 'hierarchical';
    
    // For dense graphs, use ELK
    if (density > 2) return 'elk';
    
    // Default to Dagre for medium complexity
    return 'dagre-TB';
  }
} 