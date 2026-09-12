import { Node, Edge } from 'reactflow';

export interface PathAnalysis {
  path: string[];
  length: number;
  riskScore: number;
  totalCost: number;
  totalTime: number;
}

export interface NetworkResilience {
  score: number;
  vulnerabilities: string[];
  recommendations: string[];
}

export interface BottleneckAnalysis {
  node: Node;
  severity: 'low' | 'medium' | 'high' | 'critical';
  throughputImpact: number;
  alternativeRoutes: number;
  reasons: string[];
}

export class GraphAnalytics {
  /**
   * Find all critical paths in the supply chain network
   */
  static findCriticalPaths(nodes: Node[], edges: Edge[]): PathAnalysis[] {
    const adjacencyList = this.buildAdjacencyList(edges);
    const criticalPaths: PathAnalysis[] = [];

    // Find paths from suppliers to retailers/customers
    const suppliers = nodes.filter(n => n.type?.includes('supplier'));
    const endpoints = nodes.filter(n => 
      n.type?.includes('retailer') || n.type?.includes('customer')
    );

    suppliers.forEach(supplier => {
      endpoints.forEach(endpoint => {
        const paths = this.findAllPaths(
          supplier.id, 
          endpoint.id, 
          adjacencyList, 
          nodes, 
          edges
        );
        
        paths.forEach(path => {
          const analysis = this.analyzePath(path, nodes, edges);
          if (analysis.riskScore > 0.7 || analysis.length > 5) {
            criticalPaths.push(analysis);
          }
        });
      });
    });

    return criticalPaths.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Identify bottleneck nodes in the network
   */
  static identifyBottlenecks(nodes: Node[], edges: Edge[]): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];
    const adjacencyList = this.buildAdjacencyList(edges);

    nodes.forEach(node => {
      const incomingEdges = edges.filter(e => e.target === node.id);
      const outgoingEdges = edges.filter(e => e.source === node.id);
      
      // Calculate capacity constraints
      const capacity = node.data?.capacity || node.data?.productionCapacity || 100;
      const demand = this.calculateNodeDemand(node, edges);
      const utilizationRate = demand / capacity;

      // Check for structural bottlenecks
      const isStructuralBottleneck = this.isStructuralBottleneck(node.id, adjacencyList);
      
      // Calculate alternative routes
      const alternativeRoutes = this.countAlternativeRoutes(node.id, adjacencyList);

      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const reasons: string[] = [];

      if (utilizationRate > 0.9) {
        severity = 'critical';
        reasons.push('Capacity utilization > 90%');
      } else if (utilizationRate > 0.8) {
        severity = 'high';
        reasons.push('Capacity utilization > 80%');
      } else if (utilizationRate > 0.7) {
        severity = 'medium';
        reasons.push('Capacity utilization > 70%');
      }

      if (isStructuralBottleneck) {
        severity = severity === 'low' ? 'medium' : 'critical';
        reasons.push('Single point of failure');
      }

      if (alternativeRoutes === 0) {
        severity = severity === 'low' ? 'high' : 'critical';
        reasons.push('No alternative routes available');
      }

      if (severity !== 'low') {
        bottlenecks.push({
          node,
          severity,
          throughputImpact: utilizationRate,
          alternativeRoutes,
          reasons
        });
      }
    });

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Calculate overall network resilience score
   */
  static calculateNetworkResilience(nodes: Node[], edges: Edge[]): NetworkResilience {
    const vulnerabilities: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 100;

    // Check for single points of failure
    const spofNodes = this.findSinglePointsOfFailure(nodes, edges);
    if (spofNodes.length > 0) {
      totalScore -= spofNodes.length * 15;
      vulnerabilities.push(`${spofNodes.length} single points of failure detected`);
      recommendations.push('Add redundant paths for critical nodes');
    }

    // Check geographic concentration
    const countries = [...new Set(nodes.map(n => 
      n.data?.country || n.data?.location?.country
    ).filter(Boolean))];
    
    if (countries.length === 1) {
      totalScore -= 20;
      vulnerabilities.push('Geographic concentration risk');
      recommendations.push('Diversify suppliers across multiple countries');
    } else if (countries.length < 3) {
      totalScore -= 10;
      vulnerabilities.push('Limited geographic diversification');
      recommendations.push('Consider expanding to additional regions');
    }

    // Check supplier tier diversity
    const supplierTiers = [...new Set(nodes
      .filter(n => n.type?.includes('supplier'))
      .map(n => n.data?.supplierTier)
      .filter(Boolean)
    )];

    if (supplierTiers.length < 2) {
      totalScore -= 15;
      vulnerabilities.push('Limited supplier tier diversity');
      recommendations.push('Develop relationships with tier 2 and tier 3 suppliers');
    }

    // Check for high-risk routes
    const highRiskRoutes = edges.filter(e => 
      (e.data?.frequencyOfDisruptions || 0) > 2 || 
      (e.data?.riskMultiplier || 1) > 1.5
    );

    if (highRiskRoutes.length > edges.length * 0.3) {
      totalScore -= 20;
      vulnerabilities.push('High proportion of risky transportation routes');
      recommendations.push('Establish alternative transportation modes');
    }

    return {
      score: Math.max(0, totalScore),
      vulnerabilities,
      recommendations
    };
  }

  /**
   * Find alternative paths between two nodes
   */
  static findAlternativePaths(
    source: string, 
    target: string, 
    nodes: Node[], 
    edges: Edge[]
  ): PathAnalysis[] {
    const adjacencyList = this.buildAdjacencyList(edges);
    const allPaths = this.findAllPaths(source, target, adjacencyList, nodes, edges);
    
    return allPaths
      .map(path => this.analyzePath(path, nodes, edges))
      .sort((a, b) => a.riskScore - b.riskScore);
  }

  /**
   * Find shortest path between nodes using Dijkstra's algorithm
   */
  static findShortestPath(
    source: string, 
    target: string, 
    nodes: Node[], 
    edges: Edge[],
    weightBy: 'cost' | 'time' | 'risk' = 'cost'
  ): PathAnalysis | null {
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const unvisited = new Set(nodes.map(n => n.id));

    // Initialize distances
    nodes.forEach(node => {
      distances[node.id] = node.id === source ? 0 : Infinity;
      previous[node.id] = null;
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current = Array.from(unvisited).reduce((min, node) => 
        distances[node] < distances[min] ? node : min
      );

      if (distances[current] === Infinity) break;
      
      unvisited.delete(current);

      if (current === target) {
        // Reconstruct path
        const path: string[] = [];
        let currentNode: string | null = target;
        
        while (currentNode !== null) {
          path.unshift(currentNode);
          currentNode = previous[currentNode];
        }

        return this.analyzePath(path, nodes, edges);
      }

      // Update distances to neighbors
      const neighbors = edges
        .filter(e => e.source === current)
        .map(e => e.target);

      neighbors.forEach(neighbor => {
        if (!unvisited.has(neighbor)) return;

        const edge = edges.find(e => e.source === current && e.target === neighbor);
        if (!edge) return;

        let weight = 1;
        switch (weightBy) {
          case 'cost':
            weight = edge.data?.cost || 1;
            break;
          case 'time':
            weight = edge.data?.transitTime || 1;
            break;
          case 'risk':
            weight = edge.data?.riskMultiplier || 1;
            break;
        }

        const distance = distances[current] + weight;
        if (distance < distances[neighbor]) {
          distances[neighbor] = distance;
          previous[neighbor] = current;
        }
      });
    }

    return null;
  }

  /**
   * Calculate centrality measures for nodes
   */
  static calculateNodeCentrality(nodes: Node[], edges: Edge[]): { [nodeId: string]: {
    degree: number;
    betweenness: number;
    closeness: number;
    importance: 'low' | 'medium' | 'high' | 'critical';
  }} {
    const centrality: { [nodeId: string]: any } = {};

    nodes.forEach(node => {
      const inDegree = edges.filter(e => e.target === node.id).length;
      const outDegree = edges.filter(e => e.source === node.id).length;
      const degree = inDegree + outDegree;

      // Calculate betweenness centrality (simplified)
      const betweenness = this.calculateBetweennessCentrality(node.id, nodes, edges);
      
      // Calculate closeness centrality (simplified)
      const closeness = this.calculateClosenessCentrality(node.id, nodes, edges);

      let importance: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (degree >= 5 || betweenness > 0.3) importance = 'critical';
      else if (degree >= 3 || betweenness > 0.2) importance = 'high';
      else if (degree >= 2 || betweenness > 0.1) importance = 'medium';

      centrality[node.id] = {
        degree,
        betweenness,
        closeness,
        importance
      };
    });

    return centrality;
  }

  // Helper methods
  private static buildAdjacencyList(edges: Edge[]): { [key: string]: string[] } {
    const adjacencyList: { [key: string]: string[] } = {};
    
    edges.forEach(edge => {
      if (!adjacencyList[edge.source]) adjacencyList[edge.source] = [];
      if (!adjacencyList[edge.target]) adjacencyList[edge.target] = [];
      adjacencyList[edge.source].push(edge.target);
    });

    return adjacencyList;
  }

  private static findAllPaths(
    start: string,
    end: string,
    adjacencyList: { [key: string]: string[] },
    nodes: Node[],
    edges: Edge[],
    visited: Set<string> = new Set(),
    currentPath: string[] = []
  ): string[][] {
    visited.add(start);
    currentPath.push(start);

    if (start === end) {
      return [[...currentPath]];
    }

    const allPaths: string[][] = [];
    const neighbors = adjacencyList[start] || [];

    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        const paths = this.findAllPaths(
          neighbor, 
          end, 
          adjacencyList, 
          nodes, 
          edges, 
          new Set(visited), 
          [...currentPath]
        );
        allPaths.push(...paths);
      }
    });

    return allPaths;
  }

  private static analyzePath(path: string[], nodes: Node[], edges: Edge[]): PathAnalysis {
    let totalCost = 0;
    let totalTime = 0;
    let riskScore = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const edge = edges.find(e => e.source === path[i] && e.target === path[i + 1]);
      if (edge) {
        totalCost += edge.data?.cost || 0;
        totalTime += edge.data?.transitTime || 0;
        riskScore += edge.data?.riskMultiplier || 1;
      }
    }

    return {
      path,
      length: path.length,
      riskScore: riskScore / Math.max(path.length - 1, 1),
      totalCost,
      totalTime
    };
  }

  private static calculateNodeDemand(node: Node, edges: Edge[]): number {
    // Simplified demand calculation based on incoming flow
    const incomingEdges = edges.filter(e => e.target === node.id);
    return incomingEdges.reduce((total, edge) => {
      return total + (edge.data?.flow || edge.data?.capacity || 10);
    }, 0);
  }

  private static isStructuralBottleneck(nodeId: string, adjacencyList: { [key: string]: string[] }): boolean {
    // Check if removing this node would disconnect the graph
    const allNodes = new Set(Object.keys(adjacencyList));
    allNodes.delete(nodeId);

    // Simplified check - if node has high connectivity, it's likely a bottleneck
    const connections = (adjacencyList[nodeId] || []).length;
    return connections > 3;
  }

  private static countAlternativeRoutes(nodeId: string, adjacencyList: { [key: string]: string[] }): number {
    // Count alternative paths that bypass this node
    const incomingNodes = Object.keys(adjacencyList).filter(key => 
      adjacencyList[key].includes(nodeId)
    );
    const outgoingNodes = adjacencyList[nodeId] || [];

    let alternatives = 0;
    incomingNodes.forEach(source => {
      outgoingNodes.forEach(target => {
        // Check if there's a direct connection bypassing nodeId
        if (adjacencyList[source]?.includes(target)) {
          alternatives++;
        }
      });
    });

    return alternatives;
  }

  static findSinglePointsOfFailure(nodes: Node[], edges: Edge[]): Node[] {
    const adjacencyList = this.buildAdjacencyList(edges);
    
    return nodes.filter(node => {
      // Remove node and check if graph becomes disconnected
      const remainingNodes = nodes.filter(n => n.id !== node.id);
      const remainingEdges = edges.filter(e => 
        e.source !== node.id && e.target !== node.id
      );
      
      if (remainingNodes.length === 0) return false;
      
      // Check connectivity of remaining graph
      const visited = new Set<string>();
      const stack = [remainingNodes[0].id];
      visited.add(remainingNodes[0].id);

      while (stack.length > 0) {
        const current = stack.pop()!;
        const neighbors = adjacencyList[current] || [];
        
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor) && remainingNodes.some(n => n.id === neighbor)) {
            visited.add(neighbor);
            stack.push(neighbor);
          }
        });
      }

      return visited.size < remainingNodes.length;
    });
  }

  private static calculateBetweennessCentrality(nodeId: string, nodes: Node[], edges: Edge[]): number {
    // Simplified betweenness centrality calculation
    let betweenness = 0;
    const adjacencyList = this.buildAdjacencyList(edges);

    nodes.forEach(source => {
      if (source.id === nodeId) return;
      
      nodes.forEach(target => {
        if (target.id === nodeId || target.id === source.id) return;
        
        const allPaths = this.findAllPaths(
          source.id, 
          target.id, 
          adjacencyList, 
          nodes, 
          edges
        );
        
        const pathsThroughNode = allPaths.filter(path => path.includes(nodeId));
        
        if (allPaths.length > 0) {
          betweenness += pathsThroughNode.length / allPaths.length;
        }
      });
    });

    return betweenness / ((nodes.length - 1) * (nodes.length - 2));
  }

  private static calculateClosenessCentrality(nodeId: string, nodes: Node[], edges: Edge[]): number {
    // Calculate average shortest path distance to all other nodes
    let totalDistance = 0;
    let reachableNodes = 0;

    nodes.forEach(target => {
      if (target.id === nodeId) return;
      
      const shortestPath = this.findShortestPath(nodeId, target.id, nodes, edges);
      if (shortestPath) {
        totalDistance += shortestPath.length;
        reachableNodes++;
      }
    });

    return reachableNodes > 0 ? reachableNodes / totalDistance : 0;
  }
} 