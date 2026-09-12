    import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { ActionContext } from './types';
import { GraphAnalytics } from '@/lib/analysis/graph-analytics';

export const useAdvancedEdgeActions = ({ nodes, edges, panelId, props }: ActionContext) => {
  const { onBulkUpdateEdges, onUpdateEdge, onFindAndSelectEdges, onHighlightNodes, onAnalyzeNetworkPaths } = props;

  // Bulk update edges
  useCopilotAction({
    name: `bulkUpdateEdges_${panelId}`,
    description: "Update properties for multiple edges at once based on filter criteria",
    parameters: [
      { name: "filter", type: "object", description: "Filter criteria for selecting edges (e.g., {mode: 'road', country: 'China'})", required: true },
      { name: "properties", type: "object", description: "Properties to update for matching edges", required: true },
      { name: "operator", type: "string", description: "Logical operator for multiple filter criteria (AND, OR)", required: false, default: 'AND' }
    ],
    handler: ({ filter, properties, operator = 'AND' }) => {
      if (onBulkUpdateEdges) {
        const matchingEdges = edges.filter(edge => {
          const matches = Object.entries(filter).map(([key, value]) => {
            const edgeValue = key.includes('.') 
              ? key.split('.').reduce((obj: any, k: string) => obj?.[k], edge)
              : edge.data?.[key] || (edge as any)[key];
            
            return edgeValue === value;
          });

          return operator === 'AND' 
            ? matches.every(Boolean)
            : matches.some(Boolean);
        });

        if (matchingEdges.length === 0) {
          toast.info("No edges match the specified filter criteria.");
          return;
        }

        const edgeIds = matchingEdges.map(e => e.id);
        onBulkUpdateEdges(edgeIds, properties);
        toast.success(`Updated ${edgeIds.length} edges with new properties.`);
        return `Successfully bulk updated edges`;
      }
      return "Failed: onBulkUpdateEdges not available";
    }
  });

  // Find bottleneck routes
  useCopilotAction({
    name: `findBottleneckRoutes_${panelId}`,
    description: "Identify transportation routes that are operating at capacity or causing delays",
    parameters: [
      { name: "criteria", type: "string", description: "Bottleneck criteria (capacity, delay, risk, all)", required: false, default: 'all' },
      { name: "threshold", type: "number", description: "Threshold value for bottleneck detection", required: false, default: 0.8 }
    ],
    handler: ({ criteria = 'all', threshold = 0.8 }) => {
      const bottleneckEdges = edges.filter(edge => {
        const utilization = edge.data?.utilization || 0;
        const avgDelay = edge.data?.avgDelayDays || 0;
        const riskMultiplier = edge.data?.riskMultiplier || 1;
        const disruptions = edge.data?.frequencyOfDisruptions || 0;

        switch (criteria) {
          case 'capacity':
            return utilization >= threshold;
          case 'delay':
            return avgDelay >= threshold * 10; // Convert threshold to days
          case 'risk':
            return riskMultiplier >= threshold * 2;
          case 'all':
            return utilization >= threshold || 
                   avgDelay >= threshold * 5 || 
                   riskMultiplier >= threshold * 1.5 ||
                   disruptions >= threshold * 3;
          default:
            return false;
        }
      });

      if (bottleneckEdges.length === 0) {
        toast.info(`No bottleneck routes found based on ${criteria} criteria.`);
        return;
      }

      const edgeIds = bottleneckEdges.map(e => e.id);
      if (onFindAndSelectEdges) {
        onFindAndSelectEdges(edgeIds);
      }

      // Also highlight the connected nodes
      const connectedNodeIds = new Set<string>();
      bottleneckEdges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      if (onHighlightNodes) {
        onHighlightNodes(Array.from(connectedNodeIds));
      }

      toast.warning(`Found ${bottleneckEdges.length} bottleneck routes. Consider alternative routes or capacity expansion.`);
      return `Successfully found bottleneck routes`;
    }
  });

  // Optimize route efficiency
  useCopilotAction({
    name: `optimizeRouteEfficiency_${panelId}`,
    description: "Analyze and suggest improvements for transportation route efficiency",
    parameters: [
      { name: "optimizationGoal", type: "string", description: "Primary optimization goal (cost, time, risk, sustainability)", required: false, default: 'cost' },
      { name: "maxSuggestions", type: "number", description: "Maximum number of optimization suggestions", required: false, default: 5 }
    ],
    handler: ({ optimizationGoal = 'cost', maxSuggestions = 5 }) => {
      const optimizationSuggestions: string[] = [];
      const inefficientEdges: string[] = [];

      edges.forEach(edge => {
        const cost = edge.data?.cost || 0;
        const transitTime = edge.data?.transitTime || 0;
        const riskMultiplier = edge.data?.riskMultiplier || 1;
        const mode = edge.data?.mode || 'road';

        let isInefficient = false;
        let suggestions: string[] = [];

        switch (optimizationGoal) {
          case 'cost':
            if (cost > 1000 && mode === 'air') {
              suggestions.push(`Consider switching from air to rail/sea transport for edge ${edge.id}`);
              isInefficient = true;
            }
            if (cost > 500 && transitTime > 10) {
              suggestions.push(`High cost and long transit time for edge ${edge.id} - explore consolidation`);
              isInefficient = true;
            }
            break;

          case 'time':
            if (transitTime > 14 && mode === 'sea') {
              suggestions.push(`Consider faster transport mode for time-critical edge ${edge.id}`);
              isInefficient = true;
            }
            if (transitTime > 7 && riskMultiplier > 1.5) {
              suggestions.push(`High-risk, slow route for edge ${edge.id} - find alternatives`);
              isInefficient = true;
            }
            break;

          case 'risk':
            if (riskMultiplier > 1.8) {
              suggestions.push(`High-risk route for edge ${edge.id} - implement risk mitigation`);
              isInefficient = true;
            }
            if (edge.data?.passesThroughChokepoint) {
              suggestions.push(`Route ${edge.id} passes through chokepoint - establish backup route`);
              isInefficient = true;
            }
            break;

          case 'sustainability':
            if (mode === 'air' && transitTime < 3) {
              suggestions.push(`Short air route ${edge.id} could use rail for better sustainability`);
              isInefficient = true;
            }
            if (mode === 'road' && cost < 200) {
              suggestions.push(`Consider rail consolidation for road route ${edge.id}`);
              isInefficient = true;
            }
            break;
        }

        if (isInefficient) {
          inefficientEdges.push(edge.id);
          optimizationSuggestions.push(...suggestions);
        }
      });

      if (inefficientEdges.length === 0) {
        toast.success("No obvious inefficiencies found in current routes.");
        return;
      }

      if (onFindAndSelectEdges) {
        onFindAndSelectEdges(inefficientEdges.slice(0, maxSuggestions));
      }

      const limitedSuggestions = optimizationSuggestions.slice(0, maxSuggestions);
      toast.info(`Found ${inefficientEdges.length} routes for optimization. Check highlighted routes for improvements.`);
      
      // Log suggestions for the AI to see
      console.log('Route Optimization Suggestions:', limitedSuggestions);
      return `Successfully optimized route efficiency`;
    }
  });

  // Analyze transport mode distribution
  useCopilotAction({
    name: `analyzeTransportModeDistribution_${panelId}`,
    description: "Analyze the distribution of transport modes and suggest optimization opportunities",
    parameters: [
      { name: "includeRecommendations", type: "boolean", description: "Whether to include optimization recommendations", required: false, default: true }
    ],
    handler: ({ includeRecommendations = true }) => {
      const modeDistribution: { [mode: string]: { count: number; totalCost: number; totalTime: number; edges: string[] } } = {};

      edges.forEach(edge => {
        const mode = edge.data?.mode || 'road';
        const cost = edge.data?.cost || 0;
        const time = edge.data?.transitTime || 0;

        if (!modeDistribution[mode]) {
          modeDistribution[mode] = { count: 0, totalCost: 0, totalTime: 0, edges: [] };
        }

        modeDistribution[mode].count++;
        modeDistribution[mode].totalCost += cost;
        modeDistribution[mode].totalTime += time;
        modeDistribution[mode].edges.push(edge.id);
      });

      const analysis = Object.entries(modeDistribution).map(([mode, data]) => ({
        mode,
        count: data.count,
        percentage: (data.count / edges.length * 100).toFixed(1),
        avgCost: (data.totalCost / data.count).toFixed(0),
        avgTime: (data.totalTime / data.count).toFixed(1),
        edges: data.edges
      }));

      // Find the most used mode for highlighting
      const dominantMode = analysis.reduce((max, current) => 
        current.count > max.count ? current : max
      );

      if (onFindAndSelectEdges && dominantMode.edges.length > 0) {
        onFindAndSelectEdges(dominantMode.edges);
      }

      let message = `Transport Mode Analysis:\n`;
      analysis.forEach(({ mode, count, percentage, avgCost, avgTime }) => {
        message += `${mode.toUpperCase()}: ${count} routes (${percentage}%), Avg Cost: $${avgCost}, Avg Time: ${avgTime} days\n`;
      });

      if (includeRecommendations) {
        const recommendations: string[] = [];
        
        if (analysis.some(a => a.mode === 'air' && parseFloat(a.percentage) > 40)) {
          recommendations.push('High air transport usage - consider rail/sea for non-urgent shipments');
        }
        
        if (analysis.some(a => a.mode === 'road' && parseFloat(a.percentage) > 60)) {
          recommendations.push('Heavy road dependence - explore intermodal options');
        }
        
        if (analysis.length < 3) {
          recommendations.push('Limited transport mode diversity - consider additional modes for resilience');
        }

        if (recommendations.length > 0) {
          message += `\nRecommendations:\n${recommendations.join('\n')}`;
        }
      }

      toast.info(`Highlighted ${dominantMode.count} ${dominantMode.mode} routes (${dominantMode.percentage}% of total).`);
      console.log('Transport Mode Analysis:', message);
      return `Successfully analyzed transport mode distribution`;
    }
  });

  // Find alternative routes
  useCopilotAction({
    name: `findAlternativeRoutes_${panelId}`,
    description: "Find alternative paths between two nodes for redundancy planning",
    parameters: [
      { name: "sourceNodeId", type: "string", description: "ID of the source node", required: true },
      { name: "targetNodeId", type: "string", description: "ID of the target node", required: true },
      { name: "maxAlternatives", type: "number", description: "Maximum number of alternative paths to find", required: false, default: 3 },
      { name: "optimizeBy", type: "string", description: "Optimization criteria (cost, time, risk)", required: false, default: 'cost' }
    ],
    handler: ({ sourceNodeId, targetNodeId, maxAlternatives = 3, optimizeBy = 'cost' }) => {
      if (onAnalyzeNetworkPaths) {
        onAnalyzeNetworkPaths(sourceNodeId, targetNodeId);
      }

      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      const targetNode = nodes.find(n => n.id === targetNodeId);

      if (!sourceNode || !targetNode) {
        toast.error("Source or target node not found.");
        return;
      }

      const alternativePaths = GraphAnalytics.findAlternativePaths(
        sourceNodeId, 
        targetNodeId, 
        nodes, 
        edges
      );

      if (alternativePaths.length === 0) {
        toast.warning(`No alternative paths found between ${sourceNode.data?.label} and ${targetNode.data?.label}.`);
        return;
      }

      // Sort paths by optimization criteria
      const sortedPaths = alternativePaths.sort((a, b) => {
        switch (optimizeBy) {
          case 'cost':
            return a.totalCost - b.totalCost;
          case 'time':
            return a.totalTime - b.totalTime;
          case 'risk':
            return a.riskScore - b.riskScore;
          default:
            return a.totalCost - b.totalCost;
        }
      });

      const topPaths = sortedPaths.slice(0, maxAlternatives);

      // Highlight nodes in the best alternative path
      const bestPath = topPaths[0];
      if (onHighlightNodes) {
        onHighlightNodes(bestPath.path);
      }

      // Highlight edges in alternative paths
      const alternativeEdgeIds: string[] = [];
      topPaths.forEach(path => {
        for (let i = 0; i < path.path.length - 1; i++) {
          const edge = edges.find(e => 
            e.source === path.path[i] && e.target === path.path[i + 1]
          );
          if (edge) {
            alternativeEdgeIds.push(edge.id);
          }
        }
      });

      if (onFindAndSelectEdges) {
        onFindAndSelectEdges(alternativeEdgeIds);
      }

      toast.success(
        `Found ${topPaths.length} alternative paths. Best path: ${bestPath.length - 1} hops, ` +
        `${optimizeBy}: ${optimizeBy === 'cost' ? '$' + bestPath.totalCost : 
           optimizeBy === 'time' ? bestPath.totalTime + ' days' : 
           bestPath.riskScore.toFixed(2) + ' risk score'}.`
      );
      return `Successfully found alternative routes`;
    }
  });

  // Analyze route resilience
  useCopilotAction({
    name: `analyzeRouteResilience_${panelId}`,
    description: "Analyze the resilience of transportation routes against disruptions",
    parameters: [
      { name: "disruptionType", type: "string", description: "Type of disruption to analyze (weather, political, infrastructure, all)", required: false, default: 'all' },
      { name: "severityLevel", type: "string", description: "Disruption severity level (low, medium, high)", required: false, default: 'medium' }
    ],
    handler: ({ disruptionType = 'all', severityLevel = 'medium' }) => {
      const vulnerableEdges: string[] = [];
      const resilienceScores: { [edgeId: string]: number } = {};

      edges.forEach(edge => {
        let vulnerabilityScore = 0;

        // Base vulnerability factors
        const riskMultiplier = edge.data?.riskMultiplier || 1;
        const disruptions = edge.data?.frequencyOfDisruptions || 0;
        const hasAltRoute = edge.data?.hasAltRoute || false;
        const passesThroughChokepoint = edge.data?.passesThroughChokepoint || false;

        vulnerabilityScore += riskMultiplier * 0.3;
        vulnerabilityScore += disruptions * 0.2;
        vulnerabilityScore += passesThroughChokepoint ? 0.3 : 0;
        vulnerabilityScore += hasAltRoute ? -0.2 : 0.2;

        // Disruption-specific factors
        if (disruptionType === 'weather' || disruptionType === 'all') {
          const mode = edge.data?.mode || 'road';
          if (mode === 'sea') vulnerabilityScore += 0.2;
          if (mode === 'air') vulnerabilityScore += 0.15;
        }

        if (disruptionType === 'political' || disruptionType === 'all') {
          // Check if route crosses multiple countries (more political risk)
          const sourceCountry = nodes.find(n => n.id === edge.source)?.data?.country;
          const targetCountry = nodes.find(n => n.id === edge.target)?.data?.country;
          if (sourceCountry !== targetCountry) {
            vulnerabilityScore += 0.25;
          }
        }

        if (disruptionType === 'infrastructure' || disruptionType === 'all') {
          const mode = edge.data?.mode || 'road';
          if (mode === 'road') vulnerabilityScore += 0.1; // More infrastructure dependent
        }

        // Adjust for severity level
        const severityMultiplier = {
          low: 0.7,
          medium: 1.0,
          high: 1.4
        }[severityLevel] || 1.0;

        vulnerabilityScore *= severityMultiplier;
        resilienceScores[edge.id] = Math.max(0, Math.min(1, vulnerabilityScore));

        // Mark as vulnerable if score is high
        if (vulnerabilityScore > 0.6) {
          vulnerableEdges.push(edge.id);
        }
      });

      if (vulnerableEdges.length === 0) {
        toast.success(`No highly vulnerable routes found for ${disruptionType} disruptions at ${severityLevel} severity.`);
        return;
      }

      if (onFindAndSelectEdges) {
        onFindAndSelectEdges(vulnerableEdges);
      }

      // Update edges with resilience scores
      if (onBulkUpdateEdges) {
        const resilienceUpdates = Object.entries(resilienceScores).reduce((acc, [edgeId, score]) => ({
          ...acc,
          [edgeId]: { resilienceScore: score }
        }), {});
        
        onBulkUpdateEdges(Object.keys(resilienceUpdates), resilienceUpdates);
      }

      toast.warning(
        `Found ${vulnerableEdges.length} vulnerable routes for ${disruptionType} disruptions. ` +
        `Consider backup routes or mitigation strategies.`
      );
      return `Successfully analyzed route resilience`;
    }
  });

  // Optimize multi-modal transport
  useCopilotAction({
    name: `optimizeMultiModalTransport_${panelId}`,
    description: "Suggest multi-modal transportation optimizations for better efficiency",
    parameters: [
      { name: "distanceThreshold", type: "number", description: "Distance threshold for multi-modal consideration (km)", required: false, default: 500 },
      { name: "costThreshold", type: "number", description: "Cost threshold for optimization suggestions", required: false, default: 1000 }
    ],
    handler: ({ distanceThreshold = 500, costThreshold = 1000 }) => {
      const optimizationCandidates: { edge: any; suggestion: string }[] = [];

      edges.forEach(edge => {
        const mode = edge.data?.mode || 'road';
        const cost = edge.data?.cost || 0;
        const transitTime = edge.data?.transitTime || 0;
        const distance = edge.data?.distance || 0;

        let suggestion = '';

        // Long-distance road transport
        if (mode === 'road' && distance > distanceThreshold) {
          suggestion = `Consider intermodal rail+road for long-distance route ${edge.id}`;
        }

        // Expensive air transport for non-urgent
        if (mode === 'air' && cost > costThreshold && transitTime > 1) {
          suggestion = `Switch from air to rail+road for non-urgent route ${edge.id}`;
        }

        // Short sea routes that could use road/rail
        if (mode === 'sea' && transitTime < 5 && distance < 1000) {
          suggestion = `Consider land-based alternatives for short sea route ${edge.id}`;
        }

        // High-cost road routes that could benefit from consolidation
        if (mode === 'road' && cost > costThreshold * 0.5) {
          suggestion = `Consider LTL consolidation or rail for high-cost road route ${edge.id}`;
        }

        if (suggestion) {
          optimizationCandidates.push({ edge, suggestion });
        }
      });

      if (optimizationCandidates.length === 0) {
        toast.info("No multi-modal optimization opportunities found with current thresholds.");
        return;
      }

      const candidateEdgeIds = optimizationCandidates.map(c => c.edge.id);
      
      if (onFindAndSelectEdges) {
        onFindAndSelectEdges(candidateEdgeIds.slice(0, 5)); // Limit to top 5
      }

      const suggestions = optimizationCandidates.slice(0, 5).map(c => c.suggestion);
      
      toast.info(`Found ${optimizationCandidates.length} multi-modal optimization opportunities.`);
      console.log('Multi-modal Optimization Suggestions:', suggestions);
      return `Successfully optimized multi modal transport`;
    }
  });
}; 