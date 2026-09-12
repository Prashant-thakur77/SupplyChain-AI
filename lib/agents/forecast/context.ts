/**
 * Context Building Module
 * 
 * Responsible for:
 * 1. Organizing and structuring all ingested data
 * 2. Identifying key supply chain relationships
 * 3. Extracting relevant intelligence
 * 4. Preparing data for prompt engineering
 */

import { ForecastContext, ForecastRequestParams, IngestedData, NodeData } from './types';
import { logError } from '../../monitoring';

/**
 * Build the forecast context from ingested data
 */
export async function buildContext(
  params: ForecastRequestParams,
  ingestedData: IngestedData
): Promise<ForecastContext> {
  try {
    const {
      supplyChainId,
      nodeId,
      timeHorizon = 30
    } = params;

    // Start with a basic context structure
    const context: ForecastContext = {
      supplyChain: ingestedData.supplyChain || { 
        supply_chain_id: supplyChainId,
        name: 'Unknown Supply Chain'
      },
      nodes: ingestedData.nodes || [],
      edges: ingestedData.edges || [],
      intelligence: ingestedData.intelligence || [],
      weather: ingestedData.weather || [],
      news: ingestedData.news || [],
      marketData: ingestedData.marketData || [],
      memoryContext: ingestedData.memoryContext,
      timeHorizon
    };

    // If we have a specific node ID, set the target node
    if (nodeId) {
      context.targetNode = context.nodes.find(node => node.node_id === nodeId);
    }

    // Ensure we have at least the basic supply chain data
    if (!context.supplyChain) {
      throw new Error('Supply chain data not found');
    }
    
    // Process form_data if it exists but is a string
    if (context.supplyChain.form_data && typeof context.supplyChain.form_data === 'string') {
      try {
        context.supplyChain.form_data = JSON.parse(context.supplyChain.form_data);
      } catch (error) {
        console.warn('Error parsing supply chain form_data:', error);
        // Keep the string version if parsing fails
      }
    }

    // Enhance context with node relationships
    if (context.targetNode) {
      // Find connected nodes specific to the target node
      context.targetNode.upstreamNodes = findUpstreamNodes(context.targetNode.node_id, context.nodes, context.edges);
      context.targetNode.downstreamNodes = findDownstreamNodes(context.targetNode.node_id, context.nodes, context.edges);
      
      // Add intelligence specific to connected nodes
      const connectedNodeIds = [
        context.targetNode.node_id,
        ...(context.targetNode.upstreamNodes || []).map((n: NodeData) => n.node_id),
        ...(context.targetNode.downstreamNodes || []).map((n: NodeData) => n.node_id)
      ];

      // Filter intelligence to focus on target and connected nodes
      context.relevantIntelligence = context.intelligence.filter(intel => 
        connectedNodeIds.includes(intel.node_id)
      );
    } else {
      // If no target node, consider all intelligence relevant
      context.relevantIntelligence = context.intelligence;
    }

    // Enhance the context with recent trends
    context.recentRiskTrend = analyzeRiskTrend(context.intelligence);
    
    // Return the enhanced context
    return context;
  } catch (error) {
    logError('forecast.context', error);
    throw new Error(`Failed to build forecast context: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find upstream nodes (suppliers/sources) for a given node
 */
function findUpstreamNodes(nodeId: string, allNodes: any[], edges: any[]): any[] {
  const upstreamNodeIds = edges
    .filter(edge => edge.to_node_id === nodeId)
    .map(edge => edge.from_node_id);

  return allNodes.filter(node => upstreamNodeIds.includes(node.node_id));
}

/**
 * Find downstream nodes (customers/destinations) for a given node
 */
function findDownstreamNodes(nodeId: string, allNodes: any[], edges: any[]): any[] {
  const downstreamNodeIds = edges
    .filter(edge => edge.from_node_id === nodeId)
    .map(edge => edge.to_node_id);

  return allNodes.filter(node => downstreamNodeIds.includes(node.node_id));
}

/**
 * Analyze recent risk trends from intelligence data
 */
function analyzeRiskTrend(intelligence: any[]): {
  trend: 'increasing' | 'decreasing' | 'stable';
  change: number;
  data?: number[];
} {
  if (!intelligence || intelligence.length < 2) {
    return {
      trend: 'stable',
      change: 0,
      data: []
    };
  }

  try {
    // Sort by date, most recent first
    const sortedIntel = [...intelligence].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    // Extract risk scores
    const riskScores = sortedIntel
      .map(intel => intel.risk_score)
      .filter(score => typeof score === 'number');

    if (riskScores.length < 2) {
      return {
        trend: 'stable',
        change: 0,
        data: riskScores
      };
    }

    // Calculate change between most recent and previous
    const change = riskScores[0] - riskScores[1];
    
    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (change >= 5) {
      trend = 'increasing';
    } else if (change <= -5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      change,
      data: riskScores
    };
  } catch (error) {
    console.warn('Error analyzing risk trend:', error);
    return {
      trend: 'stable',
      change: 0,
      data: []
    };
  }
}
