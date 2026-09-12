import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { ActionContext, RiskAnalysisConfig } from './types';
import { GraphAnalytics, NetworkResilience, BottleneckAnalysis } from '@/lib/analysis/graph-analytics';

export const useAdvancedRiskActions = ({ nodes, edges, panelId, props }: ActionContext) => {
  const { onHighlightNodes, onFindAndSelectEdges, onUpdateMultipleNodes, onBulkUpdateEdges } = props;

  // Calculate comprehensive risk scores
  useCopilotAction({
    name: `calculateComprehensiveRisk_${panelId}`,
    description: "Calculate comprehensive risk scores for the entire supply chain with configurable factors",
    parameters: [
      { name: "riskFactors", type: "string[]", description: "Risk factors to consider (geographic, operational, financial, political, environmental)", required: false },
      { name: "weightings", type: "object", description: "Weighting for each factor (e.g., {geographic: 0.3, operational: 0.4})", required: false },
      { name: "threshold", type: "number", description: "Risk threshold for highlighting nodes (0-1)", required: false }
    ],
    handler: ({ riskFactors = ['geographic', 'operational', 'financial'], weightings = {}, threshold = 0.7 }) => {
      const config: RiskAnalysisConfig = {
        factors: Array.isArray(riskFactors) ? riskFactors : ['geographic', 'operational', 'financial'],
        weightings: {
          geographic: 0.25,
          operational: 0.35,
          financial: 0.20,
          political: 0.15,
          environmental: 0.05,
          ...(typeof weightings === 'object' ? weightings : {})
        },
        threshold: typeof threshold === 'number' ? threshold : 0.7
      };

      const riskScores: { [nodeId: string]: { score: number; factors: any } } = {};
      const highRiskNodes: string[] = [];

      nodes.forEach(node => {
        let totalRisk = 0;
        const riskBreakdown: any = {};

        // Geographic risk
        if (config.factors.includes('geographic')) {
          const country = node.data?.country || node.data?.location?.country;
          let geoRisk = 0;
          
          // High-risk countries (simplified example)
          const highRiskCountries = ['AF', 'SY', 'IQ', 'YE', 'SO', 'SD'];
          const mediumRiskCountries = ['VE', 'IR', 'KP', 'MM', 'LB'];
          
          if (highRiskCountries.includes(country)) geoRisk = 0.9;
          else if (mediumRiskCountries.includes(country)) geoRisk = 0.6;
          else geoRisk = node.data?.countryRisk || 0.2;

          riskBreakdown.geographic = geoRisk;
          totalRisk += geoRisk * config.weightings.geographic;
        }

        // Operational risk
        if (config.factors.includes('operational')) {
          const capacity = node.data?.capacity || node.data?.productionCapacity || 100;
          const utilization = node.data?.utilization || 0.7;
          const reliability = node.data?.reliabilityPct || 95;
          
          let opRisk = 0;
          if (utilization > 0.9) opRisk += 0.3; // High utilization
          if (reliability < 90) opRisk += 0.4; // Low reliability
          if (capacity < 50) opRisk += 0.2; // Low capacity
          
          riskBreakdown.operational = Math.min(opRisk, 1);
          totalRisk += riskBreakdown.operational * config.weightings.operational;
        }

        // Financial risk
        if (config.factors.includes('financial')) {
          const cost = node.data?.operatingCost || node.data?.cost || 0;
          const profit = node.data?.profitMargin || 0.15;
          
          let finRisk = 0;
          if (profit < 0.05) finRisk += 0.4; // Low profit margin
          if (cost > 10000) finRisk += 0.2; // High operating cost
          
          riskBreakdown.financial = Math.min(finRisk, 1);
          totalRisk += riskBreakdown.financial * config.weightings.financial;
        }

        // Political risk
        if (config.factors.includes('political')) {
          const country = node.data?.country || node.data?.location?.country;
          const politicalStability = node.data?.politicalStability || 0.7;
          
          let polRisk = 1 - politicalStability;
          if (node.data?.sanctioned) polRisk = 0.9;
          
          riskBreakdown.political = polRisk;
          totalRisk += polRisk * config.weightings.political;
        }

        // Environmental risk
        if (config.factors.includes('environmental')) {
          const envScore = node.data?.environmentalScore || 0.5;
          const climateRisk = node.data?.climateRisk || 0.3;
          
          const envRisk = (1 - envScore) * 0.5 + climateRisk * 0.5;
          riskBreakdown.environmental = envRisk;
          totalRisk += envRisk * config.weightings.environmental;
        }

        const finalScore = Math.min(totalRisk, 1);
        riskScores[node.id] = { score: finalScore, factors: riskBreakdown };

        if (finalScore >= threshold) {
          highRiskNodes.push(node.id);
        }
      });

      // Update nodes with risk scores
      if (onUpdateMultipleNodes && Object.keys(riskScores).length > 0) {
        const riskUpdates: any = {};
        Object.entries(riskScores).forEach(([nodeId, riskData]) => {
          riskUpdates[nodeId] = { 
            comprehensiveRiskScore: riskData.score,
            riskFactors: riskData.factors
          };
        });
        
        const allNodeIds = Object.keys(riskScores);
        onUpdateMultipleNodes(allNodeIds, riskUpdates);
      }

      // Highlight high-risk nodes
      if (onHighlightNodes && highRiskNodes.length > 0) {
        onHighlightNodes(highRiskNodes);
      }

      toast.warning(
        `Comprehensive risk analysis complete. Found ${highRiskNodes.length} high-risk nodes ` +
        `(threshold: ${(threshold * 100).toFixed(0)}%). Check highlighted nodes.`
      );
      return `Successfully calculated comprehensive risk`;
    }
  });

  // Suggest risk mitigation strategies
  useCopilotAction({
    name: `suggestRiskMitigation_${panelId}`,
    description: "Provide specific risk mitigation strategies for identified vulnerabilities",
    parameters: [
      { name: "riskType", type: "string", description: "Type of risk to focus on (geographic, operational, supply, demand, all)", required: false, default: 'all' },
      { name: "maxSuggestions", type: "number", description: "Maximum number of suggestions to provide", required: false, default: 10 }
    ],
    handler: ({ riskType = 'all', maxSuggestions = 10 }) => {
      const mitigationStrategies: string[] = [];
      const affectedNodes: string[] = [];

      // Analyze geographic concentration
      if (riskType === 'geographic' || riskType === 'all') {
        const countryGroups: { [country: string]: string[] } = {};
        nodes.forEach(node => {
          const country = node.data?.country || node.data?.location?.country || 'Unknown';
          if (!countryGroups[country]) countryGroups[country] = [];
          countryGroups[country].push(node.id);
        });

        const dominantCountry = Object.entries(countryGroups)
          .reduce((max, [country, nodeIds]) => 
            nodeIds.length > max.count ? { country, count: nodeIds.length, nodeIds } : max, 
            { country: '', count: 0, nodeIds: [] as string[] }
          );

        if (dominantCountry.count > nodes.length * 0.6) {
          mitigationStrategies.push(`Geographic concentration risk: ${dominantCountry.count} nodes in ${dominantCountry.country}. Consider diversifying to other regions.`);
          affectedNodes.push(...dominantCountry.nodeIds.slice(0, 5));
        }
      }

      // Analyze operational risks
      if (riskType === 'operational' || riskType === 'all') {
        const highUtilizationNodes = nodes.filter(n => (n.data?.utilization || 0) > 0.85);
        if (highUtilizationNodes.length > 0) {
          mitigationStrategies.push(`${highUtilizationNodes.length} nodes operating above 85% capacity. Consider capacity expansion or load balancing.`);
          affectedNodes.push(...highUtilizationNodes.map(n => n.id));
        }

        const lowReliabilityNodes = nodes.filter(n => (n.data?.reliabilityPct || 100) < 90);
        if (lowReliabilityNodes.length > 0) {
          mitigationStrategies.push(`${lowReliabilityNodes.length} nodes with reliability below 90%. Implement preventive maintenance programs.`);
          affectedNodes.push(...lowReliabilityNodes.map(n => n.id));
        }
      }

      // Analyze supply chain structure risks
      if (riskType === 'supply' || riskType === 'all') {
        const spofNodes = GraphAnalytics.findSinglePointsOfFailure(nodes, edges);
        if (spofNodes.length > 0) {
          mitigationStrategies.push(`${spofNodes.length} single points of failure detected. Establish redundant suppliers/routes.`);
          affectedNodes.push(...spofNodes.map(n => n.id));
        }

        const bottlenecks = GraphAnalytics.identifyBottlenecks(nodes, edges);
        const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical' || b.severity === 'high');
        if (criticalBottlenecks.length > 0) {
          mitigationStrategies.push(`${criticalBottlenecks.length} critical bottlenecks identified. Increase capacity or add parallel processing.`);
          affectedNodes.push(...criticalBottlenecks.map(b => b.node.id));
        }
      }

      // Analyze demand-side risks
      if (riskType === 'demand' || riskType === 'all') {
        const retailNodes = nodes.filter(n => n.type?.includes('retailer'));
        const highDemandVariation = retailNodes.filter(n => (n.data?.demandVariability || 0) > 0.3);
        if (highDemandVariation.length > 0) {
          mitigationStrategies.push(`${highDemandVariation.length} retail nodes with high demand variability. Implement demand forecasting and safety stock.`);
          affectedNodes.push(...highDemandVariation.map(n => n.id));
        }
      }

      // Analyze transportation risks
      const highRiskRoutes = edges.filter(e => (e.data?.riskMultiplier || 1) > 1.5);
      if (highRiskRoutes.length > 0) {
        mitigationStrategies.push(`${highRiskRoutes.length} high-risk transportation routes. Establish alternative routes and contingency plans.`);
      }

      const limitedStrategies = mitigationStrategies.slice(0, maxSuggestions);
      const limitedNodes = [...new Set(affectedNodes)].slice(0, 15);

      if (limitedStrategies.length === 0) {
        toast.success("No significant risk mitigation opportunities identified. Supply chain appears well-balanced.");
        return;
      }

      if (onHighlightNodes && limitedNodes.length > 0) {
        onHighlightNodes(limitedNodes);
      }

      toast.info(`Generated ${limitedStrategies.length} risk mitigation strategies. Highlighted ${limitedNodes.length} affected nodes.`);
      // console.log('Risk Mitigation Strategies:', limitedStrategies);
      return `Successfully suggested risk mitigation`;
    }
  });

  // Identify risk cascades
  useCopilotAction({
    name: `identifyRiskCascades_${panelId}`,
    description: "Find potential cascade failure points where one failure could trigger multiple failures",
    parameters: [
      { name: "cascadeDepth", type: "number", description: "How many levels deep to analyze cascades", required: false, default: 3 },
      { name: "minimumImpact", type: "number", description: "Minimum number of nodes that must be affected", required: false, default: 3 }
    ],
    handler: ({ cascadeDepth = 3, minimumImpact = 3 }) => {
      const cascadeRisks: { initiator: string; affected: string[]; severity: string }[] = [];

      nodes.forEach(initiatorNode => {
        const affectedNodes = new Set<string>();
        const toAnalyze = [{ nodeId: initiatorNode.id, depth: 0 }];

        while (toAnalyze.length > 0) {
          const { nodeId, depth } = toAnalyze.shift()!;
          
          if (depth >= cascadeDepth) continue;

          // Find dependent nodes
          const dependentEdges = edges.filter(e => e.source === nodeId);
          dependentEdges.forEach(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (targetNode && !affectedNodes.has(edge.target)) {
              
              // Check if this node is vulnerable to cascade
              const dependencyRatio = edges.filter(e => e.target === edge.target).length;
              const nodeResilience = targetNode.data?.resilience || 0.7;
              
              if (dependencyRatio <= 2 || nodeResilience < 0.6) { // Vulnerable
                affectedNodes.add(edge.target);
                toAnalyze.push({ nodeId: edge.target, depth: depth + 1 });
              }
            }
          });
        }

        if (affectedNodes.size >= minimumImpact) {
          let severity = 'low';
          if (affectedNodes.size >= minimumImpact * 3) severity = 'critical';
          else if (affectedNodes.size >= minimumImpact * 2) severity = 'high';
          else if (affectedNodes.size >= minimumImpact * 1.5) severity = 'medium';

          cascadeRisks.push({
            initiator: initiatorNode.id,
            affected: Array.from(affectedNodes),
            severity
          });
        }
      });

      if (cascadeRisks.length === 0) {
        toast.success("No significant cascade failure risks detected.");
        return;
      }

      // Sort by severity and impact
      const sortedRisks = cascadeRisks.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
        return severityDiff !== 0 ? severityDiff : b.affected.length - a.affected.length;
      });

      const topRisk = sortedRisks[0];
      const allAffectedNodes = [topRisk.initiator, ...topRisk.affected.slice(0, 10)];

      if (onHighlightNodes) {
        onHighlightNodes(allAffectedNodes);
      }

      // Update initiator nodes with cascade risk information
      if (onUpdateMultipleNodes) {
        const cascadeUpdates = sortedRisks.slice(0, 5).reduce((acc, risk) => ({
          ...acc,
          [risk.initiator]: { 
            cascadeRisk: risk.severity,
            cascadeImpact: risk.affected.length
          }
        }), {});
        
        const initiatorIds = Object.keys(cascadeUpdates);
        onUpdateMultipleNodes(initiatorIds, cascadeUpdates);
      }

      toast.warning(
        `Found ${cascadeRisks.length} potential cascade risks. Worst case: ${topRisk.affected.length} nodes ` +
        `affected by failure of ${nodes.find(n => n.id === topRisk.initiator)?.data?.label || topRisk.initiator}.`
      );
      return `Successfully identified risk cascades`;
    }
  });

  // Assess supply chain resilience
  useCopilotAction({
    name: `assessSupplyChainResilience_${panelId}`,
    description: "Calculate overall supply chain resilience score and provide improvement recommendations",
    parameters: [
      { name: "includeRecommendations", type: "boolean", description: "Whether to include detailed recommendations", required: false, default: true }
    ],
    handler: ({ includeRecommendations = true }) => {
      const resilience: NetworkResilience = GraphAnalytics.calculateNetworkResilience(nodes, edges);
      
      // Additional resilience metrics
      const additionalMetrics = {
        averageNodeConnectivity: edges.length > 0 ? (edges.length / nodes.length) : 0,
        geographicDiversification: [...new Set(nodes.map(n => n.data?.country).filter(Boolean))].length,
        supplierTierDiversity: [...new Set(nodes.filter(n => n.type?.includes('supplier')).map(n => n.data?.supplierTier).filter(Boolean))].length,
        transportModeVariety: [...new Set(edges.map(e => e.data?.mode).filter(Boolean))].length
      };

      // Calculate component scores
      const connectivityScore = Math.min(additionalMetrics.averageNodeConnectivity * 20, 100);
      const diversityScore = (additionalMetrics.geographicDiversification * 10 + 
                             additionalMetrics.supplierTierDiversity * 15 + 
                             additionalMetrics.transportModeVariety * 10);
      
      const enhancedResilienceScore = (resilience.score * 0.6 + connectivityScore * 0.2 + diversityScore * 0.2);

      let resilienceLevel = 'Poor';
      if (enhancedResilienceScore >= 80) resilienceLevel = 'Excellent';
      else if (enhancedResilienceScore >= 70) resilienceLevel = 'Good';
      else if (enhancedResilienceScore >= 60) resilienceLevel = 'Fair';
      else if (enhancedResilienceScore >= 40) resilienceLevel = 'Weak';

      if (includeRecommendations && resilience.recommendations.length > 0) {
        // console.log('Resilience Improvement Recommendations:', resilience.recommendations.slice(0, 8));
      }

      // Highlight vulnerable areas
      const vulnerableNodes = nodes.filter(node => {
        const riskScore = node.data?.comprehensiveRiskScore || node.data?.riskScore || 0;
        return riskScore > 0.7;
      });

      if (onHighlightNodes && vulnerableNodes.length > 0) {
        onHighlightNodes(vulnerableNodes.map(n => n.id));
      }

      toast.info(
        `Resilience Score: ${enhancedResilienceScore.toFixed(1)}/100 (${resilienceLevel}). ` +
        `${resilience.vulnerabilities.length} vulnerabilities, ${resilience.recommendations.length} recommendations.`
      );
      return `Successfully assessed supply chain resilience`;
    }
  });

  // Scenario-based risk simulation
  useCopilotAction({
    name: `simulateRiskScenario_${panelId}`,
    description: "Simulate various risk scenarios and their impact on the supply chain",
    parameters: [
      { name: "scenarioType", type: "string", description: "Type of scenario (node_failure, route_disruption, capacity_reduction, demand_spike)", required: true },
      { name: "intensity", type: "string", description: "Scenario intensity (low, medium, high)", required: false, default: 'medium' },
      { name: "duration", type: "number", description: "Scenario duration in days", required: false, default: 7 },
      { name: "targetId", type: "string", description: "Specific node or edge ID to target (optional)", required: false }
    ],
    handler: ({ scenarioType, intensity = 'medium', duration = 7, targetId }) => {
      const impactAnalysis: { affected: string[]; severity: string; mitigation: string[] } = {
        affected: [],
        severity: 'low',
        mitigation: []
      };

      const intensityMultiplier = { low: 0.3, medium: 0.6, high: 0.9 }[intensity] || 0.6;

      switch (scenarioType) {
        case 'node_failure':
          let targetNode = nodes.find(n => n.id === targetId);
          if (!targetNode) {
            // Select highest risk node if no target specified
            targetNode = nodes.reduce((highest, current) => {
              const currentRisk = current.data?.comprehensiveRiskScore || current.data?.riskScore || 0;
              const highestRisk = highest.data?.comprehensiveRiskScore || highest.data?.riskScore || 0;
              return currentRisk > highestRisk ? current : highest;
            });
          }

          if (targetNode) {
            // Find all dependent nodes
            const dependentNodes = new Set<string>();
            const queue = [targetNode.id];
            
            while (queue.length > 0) {
              const currentId = queue.shift()!;
              const downstreamEdges = edges.filter(e => e.source === currentId);
              
              downstreamEdges.forEach(edge => {
                if (!dependentNodes.has(edge.target)) {
                  dependentNodes.add(edge.target);
                  // Propagate based on dependency strength
                  const dependencyStrength = edge.data?.criticality || 0.5;
                  if (dependencyStrength * intensityMultiplier > 0.3) {
                    queue.push(edge.target);
                  }
                }
              });
            }

            impactAnalysis.affected = [targetNode.id, ...Array.from(dependentNodes)];
            impactAnalysis.severity = dependentNodes.size > 5 ? 'high' : dependentNodes.size > 2 ? 'medium' : 'low';
            impactAnalysis.mitigation = [
              'Activate backup suppliers',
              'Implement emergency procurement',
              'Increase inventory levels at downstream nodes'
            ];
          }
          break;

        case 'route_disruption':
          const highRiskRoutes = edges.filter(e => (e.data?.riskMultiplier || 1) > 1.3);
          const affectedRoutes = highRiskRoutes.slice(0, Math.ceil(highRiskRoutes.length * intensityMultiplier));
          
          const affectedNodeIds = new Set<string>();
          affectedRoutes.forEach(edge => {
            affectedNodeIds.add(edge.source);
            affectedNodeIds.add(edge.target);
          });

          impactAnalysis.affected = Array.from(affectedNodeIds);
          impactAnalysis.severity = affectedRoutes.length > 3 ? 'high' : affectedRoutes.length > 1 ? 'medium' : 'low';
          impactAnalysis.mitigation = [
            'Activate alternative routes',
            'Increase transportation mode diversity',
            'Establish emergency logistics partnerships'
          ];
          break;

        case 'capacity_reduction':
          const capacityReduction = 0.2 + (intensityMultiplier * 0.5); // 20-70% reduction
          const affectedCapacityNodes = nodes.filter(n => {
            const utilization = n.data?.utilization || 0.7;
            return utilization > (1 - capacityReduction); // Nodes that would be over capacity
          });

          impactAnalysis.affected = affectedCapacityNodes.map(n => n.id);
          impactAnalysis.severity = affectedCapacityNodes.length > nodes.length * 0.3 ? 'high' : 
                                   affectedCapacityNodes.length > nodes.length * 0.1 ? 'medium' : 'low';
          impactAnalysis.mitigation = [
            'Implement load balancing',
            'Increase capacity at critical nodes',
            'Optimize production schedules'
          ];
          break;

        case 'demand_spike':
          const demandIncrease = 1 + (intensityMultiplier * 1.5); // 130-240% of normal demand
          const retailNodes = nodes.filter(n => n.type?.includes('retailer'));
          const overloadedNodes = retailNodes.filter(n => {
            const capacity = n.data?.capacity || 100;
            const demand = n.data?.demandRate || 50;
            return (demand * demandIncrease) > capacity;
          });

          impactAnalysis.affected = overloadedNodes.map(n => n.id);
          impactAnalysis.severity = overloadedNodes.length > retailNodes.length * 0.5 ? 'high' : 'medium';
          impactAnalysis.mitigation = [
            'Increase safety stock levels',
            'Implement demand prioritization',
            'Scale up capacity temporarily'
          ];
          break;
      }

      if (impactAnalysis.affected.length === 0) {
        toast.info(`${scenarioType} scenario simulation: No significant impact detected.`);
        return;
      }

      // Highlight affected nodes
      if (onHighlightNodes) {
        onHighlightNodes(impactAnalysis.affected);
      }

      // Update affected nodes with scenario impact
      if (onUpdateMultipleNodes) {
        const scenarioUpdates = impactAnalysis.affected.reduce((acc, nodeId) => ({
          ...acc,
          [nodeId]: { 
            lastScenarioImpact: impactAnalysis.severity,
            scenarioType: scenarioType,
            impactDuration: duration
          }
        }), {});
        
        onUpdateMultipleNodes(impactAnalysis.affected, scenarioUpdates);
      }

      // toast.warning(
      //   `${scenarioType} scenario (${intensity} intensity): ${impactAnalysis.affected.length} nodes affected ` +
      //   `with ${impactAnalysis.severity} severity over ${duration} days.`
      // );

      // console.log('Scenario Simulation Results:', {
      //   scenario: scenarioType,
      //   intensity,
      //   duration,
      //   impact: impactAnalysis
      // });
      return `Successfully simulated risk scenario`;
    }
  });
}; 