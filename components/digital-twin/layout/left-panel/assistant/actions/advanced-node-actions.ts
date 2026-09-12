import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { ActionContext } from './types';
import { GraphAnalytics } from '@/lib/analysis/graph-analytics';

export const useAdvancedNodeActions = ({ nodes, edges, panelId, props }: ActionContext) => {
  const { onUpdateMultipleNodes, onHighlightNodes, onCreateNodeGroup, onFocusNode, onZoomToNodes } = props;

  // Create node group
  useCopilotAction({
    name: `createNodeGroup_${panelId}`,
    description: "Create a group of nodes for easier management and bulk operations",
    parameters: [
      { name: "nodeIds", type: "string[]", description: "Array of node IDs to group together", required: true },
      { name: "groupName", type: "string", description: "Name for the node group", required: true },
      { name: "groupProperties", type: "object", description: "Common properties to apply to all nodes in the group", required: false }
    ],
    handler: ({ nodeIds, groupName, groupProperties = {} }: { nodeIds: string[], groupName: string, groupProperties?: Record<string, any> }) => {
      if (onCreateNodeGroup && Array.isArray(nodeIds)) {
        // Validate that all nodeIds exist
        const validNodeIds = nodeIds.filter((id: string) => nodes.some(n => n.id === id));
        
        if (validNodeIds.length === 0) {
          toast.error("No valid nodes found for grouping.");
          return;
        }

        if (validNodeIds.length < nodeIds.length) {
          toast.warning(`Only ${validNodeIds.length} of ${nodeIds.length} nodes found for grouping.`);
        }

        // Apply group properties to all nodes
        if (onUpdateMultipleNodes && groupProperties && Object.keys(groupProperties).length > 0) {
          const groupPropsWithGroupInfo = {
            ...groupProperties,
            groupName,
            isGrouped: true
          };
          onUpdateMultipleNodes(validNodeIds, groupPropsWithGroupInfo);
        }

        onCreateNodeGroup(validNodeIds, groupName);
        toast.success(`Created group "${groupName}" with ${validNodeIds.length} nodes.`);
        return `Successfully created group ${groupName}`;
      }
      return "Failed to create group: onCreateNodeGroup not available";
    }
  });

  // Update node group
  useCopilotAction({
    name: `updateNodeGroup_${panelId}`,
    description: "Update properties for all nodes in a specific group",
    parameters: [
      { name: "groupName", type: "string", description: "Name of the group to update", required: true },
      { name: "properties", type: "object", description: "Properties to apply to all nodes in the group", required: true }
    ],
    handler: ({ groupName, properties }: { groupName: string, properties: Record<string, any> }) => {
      if (onUpdateMultipleNodes) {
        const groupedNodes = nodes.filter(n => n.data?.groupName === groupName);
        
        if (groupedNodes.length === 0) {
          toast.error(`No nodes found in group "${groupName}".`);
          return;
        }

        const nodeIds = groupedNodes.map(n => n.id);
        onUpdateMultipleNodes(nodeIds, properties);
        toast.success(`Updated ${nodeIds.length} nodes in group "${groupName}".`);
        return `Successfully updated group ${groupName}`;
      }
      return "Failed to update group: onUpdateMultipleNodes not available";
    }
  });

  // Dissolve node group
  useCopilotAction({
    name: `dissolveNodeGroup_${panelId}`,
    description: "Remove grouping from a set of nodes while keeping the nodes themselves",
    parameters: [
      { name: "groupName", type: "string", description: "Name of the group to dissolve", required: true }
    ],
    handler: ({ groupName }: { groupName: string }) => {
      if (onUpdateMultipleNodes) {
        const groupedNodes = nodes.filter(n => n.data?.groupName === groupName);
        
        if (groupedNodes.length === 0) {
          toast.error(`No nodes found in group "${groupName}".`);
          return;
        }

        const nodeIds = groupedNodes.map(n => n.id);
        const ungroupProperties = {
          groupName: null,
          isGrouped: false
        };
        
        onUpdateMultipleNodes(nodeIds, ungroupProperties);
        toast.success(`Dissolved group "${groupName}" affecting ${nodeIds.length} nodes.`);
        return `Successfully dissolved group ${groupName}`;
      }
      return "Failed to dissolve group: onUpdateMultipleNodes not available";
    }
  });

  // Select nodes by group
  useCopilotAction({
    name: `selectNodesByGroup_${panelId}`,
    description: "Highlight and focus on all nodes belonging to a specific group",
    parameters: [
      { name: "groupName", type: "string", description: "Name of the group to select", required: true }
    ],
    handler: ({ groupName }: { groupName: string }) => {
      const groupedNodes = nodes.filter(n => n.data?.groupName === groupName);
      
      if (groupedNodes.length === 0) {
        toast.error(`No nodes found in group "${groupName}".`);
        return;
      }

      const nodeIds = groupedNodes.map(n => n.id);
      
      if (onHighlightNodes) {
        onHighlightNodes(nodeIds);
      }

      if (onZoomToNodes) {
        onZoomToNodes(nodeIds);
      }

      toast.success(`Selected ${nodeIds.length} nodes from group "${groupName}".`);
      return `Successfully selected nodes by group`;
    }
  });

  // Analyze node dependencies
  useCopilotAction({
    name: `analyzeNodeDependencies_${panelId}`,
    description: "Analyze and highlight upstream and downstream dependencies for a specific node",
    parameters: [
      { name: "nodeId", type: "string", description: "ID of the node to analyze", required: true },
      { name: "depth", type: "number", description: "How many levels deep to analyze (default: 2)", required: false, default: 2 }
    ],
    handler: ({ nodeId, depth = 2 }: { nodeId: string, depth?: number }) => {
      const targetNode = nodes.find(n => n.id === nodeId);
      if (!targetNode) {
        toast.error(`Node with ID "${nodeId}" not found.`);
        return;
      }

      // Find upstream dependencies (nodes that feed into this node)
      const upstreamNodes = new Set<string>();
      const downstreamNodes = new Set<string>();

      // BFS to find dependencies up to specified depth
      const findDependencies = (currentNodeId: string, currentDepth: number, isUpstream: boolean) => {
        if (currentDepth >= depth) return;

        const relevantEdges = isUpstream 
          ? edges.filter(e => e.target === currentNodeId)
          : edges.filter(e => e.source === currentNodeId);

        relevantEdges.forEach(edge => {
          const nextNodeId = isUpstream ? edge.source : edge.target;
          const targetSet = isUpstream ? upstreamNodes : downstreamNodes;
          
          if (!targetSet.has(nextNodeId)) {
            targetSet.add(nextNodeId);
            findDependencies(nextNodeId, currentDepth + 1, isUpstream);
          }
        });
      };

      findDependencies(nodeId, 0, true);  // Find upstream
      findDependencies(nodeId, 0, false); // Find downstream

      const allDependencyNodes = [nodeId, ...Array.from(upstreamNodes), ...Array.from(downstreamNodes)];

      if (onHighlightNodes) {
        onHighlightNodes(allDependencyNodes);
      }

      if (onFocusNode) {
        onFocusNode(nodeId);
      }

      toast.success(
        `Found ${upstreamNodes.size} upstream and ${downstreamNodes.size} downstream dependencies for "${targetNode.data?.label || nodeId}".`
      );
      return `Successfully analyzed dependencies`;
    }
  });

  // Find node clusters
  useCopilotAction({
    name: `findNodeClusters_${panelId}`,
    description: "Identify and highlight tightly connected groups of nodes in the supply chain",
    parameters: [
      { name: "minClusterSize", type: "number", description: "Minimum number of nodes in a cluster (default: 3)", required: false, default: 3 },
      { name: "connectionThreshold", type: "number", description: "Minimum connections required between cluster nodes", required: false, default: 2 }
    ],
    handler: ({ minClusterSize = 3, connectionThreshold = 2 }: { minClusterSize?: number, connectionThreshold?: number }) => {
      // Simple clustering algorithm based on node connectivity
      const clusters: string[][] = [];
      const visited = new Set<string>();

      nodes.forEach(node => {
        if (visited.has(node.id)) return;

        const cluster: string[] = [];
        const queue = [node.id];
        
        while (queue.length > 0) {
          const currentNodeId = queue.shift()!;
          if (visited.has(currentNodeId)) continue;
          
          visited.add(currentNodeId);
          cluster.push(currentNodeId);

          // Find connected nodes
          const connectedEdges = edges.filter(e => 
            e.source === currentNodeId || e.target === currentNodeId
          );

          connectedEdges.forEach(edge => {
            const connectedNodeId = edge.source === currentNodeId ? edge.target : edge.source;
            if (!visited.has(connectedNodeId)) {
              // Check if this node has enough connections to be part of cluster
              const nodeConnections = edges.filter(e => 
                e.source === connectedNodeId || e.target === connectedNodeId
              ).length;

              if (nodeConnections >= connectionThreshold) {
                queue.push(connectedNodeId);
              }
            }
          });
        }

        if (cluster.length >= minClusterSize) {
          clusters.push(cluster);
        }
      });

      if (clusters.length === 0) {
        toast.info(`No clusters found with minimum size ${minClusterSize} and connection threshold ${connectionThreshold}.`);
        return;
      }

      // Highlight the largest cluster
      const largestCluster = clusters.reduce((largest, current) => 
        current.length > largest.length ? current : largest
      );

      if (onHighlightNodes) {
        onHighlightNodes(largestCluster);
      }

      toast.success(`Found ${clusters.length} clusters. Highlighted largest cluster with ${largestCluster.length} nodes.`);
      return `Successfully found node clusters`;
    }
  });

  // Calculate node centrality
  useCopilotAction({
    name: `calculateNodeCentrality_${panelId}`,
    description: "Calculate and highlight the most critical nodes based on centrality measures",
    parameters: [
      { name: "measureType", type: "string", description: "Type of centrality measure (degree, betweenness, closeness, all)", required: false, default: 'all' },
      { name: "topN", type: "number", description: "Number of top nodes to highlight", required: false, default: 5 }
    ],
    handler: ({ measureType = 'all', topN = 5 }: { measureType?: string, topN?: number }) => {
      const centrality = GraphAnalytics.calculateNodeCentrality(nodes, edges);
      
      let sortedNodes: { nodeId: string; score: number; importance: string }[] = [];

      switch (measureType) {
        case 'degree':
          sortedNodes = Object.entries(centrality)
            .map(([nodeId, data]) => ({ nodeId, score: data.degree, importance: data.importance }))
            .sort((a, b) => b.score - a.score);
          break;
        case 'betweenness':
          sortedNodes = Object.entries(centrality)
            .map(([nodeId, data]) => ({ nodeId, score: data.betweenness, importance: data.importance }))
            .sort((a, b) => b.score - a.score);
          break;
        case 'closeness':
          sortedNodes = Object.entries(centrality)
            .map(([nodeId, data]) => ({ nodeId, score: data.closeness, importance: data.importance }))
            .sort((a, b) => b.score - a.score);
          break;
        default: // 'all' - use composite score
          sortedNodes = Object.entries(centrality)
            .map(([nodeId, data]) => ({ 
              nodeId, 
              score: data.degree + data.betweenness * 10 + data.closeness * 5, 
              importance: data.importance 
            }))
            .sort((a, b) => b.score - a.score);
      }

      const topNodes = sortedNodes.slice(0, topN);
      const criticalNodeIds = topNodes.map(n => n.nodeId);

      if (onHighlightNodes) {
        onHighlightNodes(criticalNodeIds);
      }

      // Update nodes with centrality information
      if (onUpdateMultipleNodes) {
        const centralityUpdates = topNodes.reduce((acc, { nodeId, importance }) => ({
          ...acc,
          [nodeId]: { centralityImportance: importance }
        }), {});
        
        onUpdateMultipleNodes(criticalNodeIds, centralityUpdates);
      }

      toast.success(`Highlighted top ${topNodes.length} critical nodes based on ${measureType} centrality.`);
      return `Successfully calculated node centrality`;
    }
  });

  // Filter nodes by criteria
  useCopilotAction({
    name: `filterNodesByCriteria_${panelId}`,
    description: "Find and highlight nodes that match specific criteria or properties",
    parameters: [
      { name: "criteria", type: "object", description: "Filter criteria object (e.g., {type: 'supplier', country: 'China'})", required: true },
      { name: "operator", type: "string", description: "Logical operator for multiple criteria (AND, OR)", required: false, default: 'AND' }
    ],
    handler: ({ criteria, operator = 'AND' }: { criteria: Record<string, any>, operator?: string }) => {
      const matchingNodes = nodes.filter(node => {
        const matches = Object.entries(criteria).map(([key, value]) => {
          const nodeValue = key.includes('.') 
            ? key.split('.').reduce((obj: any, k: string) => obj?.[k], node)
            : node.data?.[key] || (node as any)[key];
          
          return nodeValue === value;
        });

        return operator === 'AND' 
          ? matches.every(Boolean)
          : matches.some(Boolean);
      });

      if (matchingNodes.length === 0) {
        toast.info("No nodes match the specified criteria.");
        return;
      }

      const nodeIds = matchingNodes.map(n => n.id);
      
      if (onHighlightNodes) {
        onHighlightNodes(nodeIds);
      }

      toast.success(`Found and highlighted ${matchingNodes.length} nodes matching the criteria.`);
      return `Successfully filtered nodes`;
    }
  });
}; 