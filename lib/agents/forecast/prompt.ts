/**
 * Prompt Engineering Module
 * 
 * Responsible for:
 * 1. Crafting optimized prompts for the LLM
 * 2. Formatting context data for maximum effectiveness
 * 3. Including specific instructions based on forecast requirements
 */

import { ForecastConfig, ForecastContext } from './types';

/**
 * Generate an optimized prompt for the forecast LLM
 */
export async function generatePrompt(
  context: ForecastContext,
  config: ForecastConfig
): Promise<string> {
  // Extract key data from context
  const {
    supplyChain,
    nodes,
    targetNode,
    edges,
    intelligence,
    weather,
    news,
    marketData,
    memoryContext,
    timeHorizon
  } = context;

  // Base prompt structure with clear instructions
  let prompt = `
You are an expert supply chain forecasting AI with deep domain expertise in logistics, economics, and market analysis.

TASK: Generate a comprehensive ${timeHorizon}-day forecast for ${targetNode ? `the ${targetNode.type} node "${targetNode.name}"` : `the entire "${supplyChain.name}" supply chain`}.

FORECAST PERIOD: ${timeHorizon} days from today.

SUPPLY CHAIN CONTEXT:
- Name: ${supplyChain.name}
- Type: ${supplyChain.form_data?.businessType || 'General Supply Chain'}
- Industry: ${supplyChain.form_data?.industrySector || 'Various'}
- Geographic Focus: ${supplyChain.form_data?.geographicFocus || 'Global'}
- Complexity: ${supplyChain.form_data?.supplyChainComplexity || 'Medium'}
- Primary Risk Concerns: ${supplyChain.form_data?.primaryRisks || 'Various'}
- Nodes: ${nodes.length} (${nodes.map(n => n.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')})
`;

  // Add target node specific context if applicable
  if (targetNode) {
    prompt += `
TARGET NODE DETAILS:
- Name: ${targetNode.name}
- Type: ${targetNode.type}
- Location: ${targetNode.address || 'Unknown'}
- Description: ${targetNode.description || 'No description available'}
`;

    // Add upstream/downstream relationships if available
    const upstreamNodes = findUpstreamNodes(targetNode.node_id, nodes, edges);
    const downstreamNodes = findDownstreamNodes(targetNode.node_id, nodes, edges);

    prompt += `
SUPPLY CHAIN RELATIONSHIPS:
- Upstream Suppliers (${upstreamNodes.length}): ${upstreamNodes.map(n => n.name).join(', ') || 'None'}
- Downstream Customers (${downstreamNodes.length}): ${downstreamNodes.map(n => n.name).join(', ') || 'None'}
`;
  }

  // Add intelligence data
  if (intelligence && intelligence.length > 0) {
    // Sort by recency
    const sortedIntel = [...intelligence].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    const relevantIntel = targetNode 
      ? sortedIntel.filter(intel => intel.node_id === targetNode.node_id).slice(0, 1)
      : sortedIntel.slice(0, 3);

    prompt += `
RECENT INTELLIGENCE:
${relevantIntel.map((intel, idx) => {
  const nodeInfo = nodes.find(n => n.node_id === intel.node_id);
  const nodeName = nodeInfo ? nodeInfo.name : 'Unknown node';
  const date = new Date(intel.updated_at || intel.created_at).toISOString().split('T')[0];
  
  return `
INTELLIGENCE #${idx + 1} (for ${nodeName}, ${date}):
Risk Score: ${intel.risk_score}/100
${formatIntelligenceData(intel.intelligence_data)}
${extractCriticalEvents(intel.intelligence_data).length > 0 ? 
  `Critical Events:
${extractCriticalEvents(intel.intelligence_data).map(event => 
  `- ${event.title} (${event.impact}): ${event.summary}`
).join('\n')}` : 'No critical events reported.'
}`;
}).join('\n')}
`;
  }

  // Add weather forecast data if available
  if (weather && weather.length > 0) {
    const weatherLoc = weather[0].location || 'this location';
    const severeDays = weather[0].forecasts?.filter(f => f.severe)?.length || 0;
    
    prompt += `
WEATHER FORECAST (${weather[0].location || 'Target region'}):
${severeDays > 0 ? `⚠️ Warning: ${severeDays} days of severe weather detected in forecast period.` : 'No severe weather conditions forecasted.'}
${weather[0].forecasts?.slice(0, 5).map(f => {
  const date = new Date(f.date).toISOString().split('T')[0];
  return `- ${date}: ${f.weather} (${f.temp}°C)${f.severe ? ' ⚠️ SEVERE' : ''}`;
}).join('\n') || 'No detailed forecast available'}

Weather Impact Assessment:
${severeDays > 0 ? 
  `Potential disruptions to logistics in ${weatherLoc} due to severe weather conditions.` : 
  `Normal weather patterns expected in ${weatherLoc} during the forecast period.`}
`;
  }

  // Add news data if available
  if (news && news.length > 0) {
    const relevantNews = news.slice(0, 5);
    
    prompt += `
RELEVANT NEWS:
${relevantNews.map(n => {
  const date = n.publishedDate ? new Date(n.publishedDate).toISOString().split('T')[0] : 'Unknown date';
  return `- [${date}] ${n.title.substring(0, 100)}
  Summary: ${n.content.substring(0, 150)}...
  Source: ${n.source}`;
}).join('\n\n')}
`;
  }

  // Add market data if available
  if (marketData && marketData.length > 0) {
    prompt += `
MARKET INDICATORS:
${marketData.map(m => {
  const indicator = m.commodity || m.indicator;
  const trend = m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→';
  const changeValue = m.change ?? 0;
  const change = changeValue > 0 ? `+${changeValue}%` : `${changeValue}%`;
  
  return `- ${indicator}: ${m.value} ${trend} (${change})
  ${m.data?.forecast || ''}`;
}).join('\n\n')}
`;
  }

  // Add memory context if available
  if (memoryContext && memoryContext.length > 0) {
    prompt += `
HISTORICAL CONTEXT:
${memoryContext.substring(0, 1000)}${memoryContext.length > 1000 ? '...' : ''}
`;
  }

  // Add forecasting instructions
  prompt += `
FORECASTING INSTRUCTIONS:
1. Generate a comprehensive ${timeHorizon}-day forecast addressing:
   - Demand trends and fluctuations
   - Supply availability and constraints
   - Price movements and volatility
   - Operational risks and disruptions
   - Lead time variations

2. Risk Assessment Requirements:
   - Calculate an overall risk score (0-100)
   - Identify the trend from previous assessments
   - Detail specific risk factors with probability and impact scores

3. Event Forecasting Requirements:
   - Identify potential disruptive events in the forecast period
   - Assign probability and impact ratings
   - Categorize by type (weather, geopolitical, economic, operational, regulatory)
   - CRITICAL: Include scenario_json for EVERY event with these fields:
     * scenarioName: descriptive name
     * scenarioType: natural, geopolitical, economic, operational, regulatory, other
     * disruptionSeverity: 0-100 severity score
     * disruptionDuration: 1-365 days duration
     * affectedNode: realistic node ID from the supply chain
     * description: detailed scenario description
     * startDate, endDate: ISO formatted dates
     * monteCarloRuns: 1000-50000 simulation runs
     * distributionType: normal, lognormal, uniform, exponential, beta
     * cascadeEnabled: boolean for cascade failure modeling
     * failureThreshold: 0-1 node failure threshold
     * bufferPercent: 0-100 buffer capacity percentage
     * alternateRouting: boolean for routing alternatives
     * randomSeed: lowercase-hyphenated reproducible identifier

4. Recommendations Requirements:
   - Provide 3-5 specific, actionable recommendations
   - Prioritize by urgency and potential impact
   - Include estimated timeframes for implementation

FORECAST OUTPUT FORMAT:
Follow the JSON schema requirements exactly. Ensure all dates are in ISO format, all scores are within specified ranges, and all required fields are populated with meaningful content.

CRITICAL REQUIREMENT: Every event in the events array MUST include a complete scenario_json object. This is not optional. Each scenario_json should realistically match the event characteristics (e.g., natural disasters have higher severity and enable cascades, economic events have longer duration, operational issues have shorter duration).

Generate a highly specific, evidence-based forecast with practical business value.
`;

  return prompt;
}

/**
 * Find upstream nodes (suppliers/sources) for a given node
 */
function findUpstreamNodes(nodeId: string, allNodes: any[], edges: any[]): any[] {
  const upstreamNodeIds = edges
    .filter((edge: any) => edge.to_node_id === nodeId)
    .map((edge: any) => edge.from_node_id);

  return allNodes.filter((node: any) => upstreamNodeIds.includes(node.node_id));
}

/**
 * Find downstream nodes (customers/destinations) for a given node
 */
function findDownstreamNodes(nodeId: string, allNodes: any[], edges: any[]): any[] {
  const downstreamNodeIds = edges
    .filter((edge: any) => edge.from_node_id === nodeId)
    .map((edge: any) => edge.to_node_id);

  return allNodes.filter((node: any) => downstreamNodeIds.includes(node.node_id));
}

/**
 * Format intelligence data for the prompt
 */
function formatIntelligenceData(intelligenceData: any): string {
  if (!intelligenceData) {
    return 'No intelligence data available.';
  }
  
  try {
    // Handle different possible structures
    const intelligence = typeof intelligenceData === 'string' 
      ? JSON.parse(intelligenceData) 
      : intelligenceData;
    
    // Extract the key information
    const marketInsights = intelligence.marketIntelligence || intelligence.intelligence?.marketIntelligence;
    const riskInfo = intelligence.riskAssessment || intelligence.intelligence?.riskAssessment;
    
    let result = '';
    
    // Add risk assessment if available
    if (riskInfo) {
      result += `Overall Risk: ${riskInfo.overallRiskScore}/100\n`;
      
      if (riskInfo.riskFactors && riskInfo.riskFactors.length > 0) {
        result += 'Top Risk Factors:\n';
        riskInfo.riskFactors.slice(0, 3).forEach((risk: any, i: number) => {
          result += `- ${risk.factor} (Impact: ${risk.impact}, Probability: ${risk.probability})\n`;
        });
      }
    }
    
    // Add market insights if available
    if (marketInsights) {
      if (marketInsights.priceFluctuations && marketInsights.priceFluctuations.length > 0) {
        result += '\nPrice Trends:\n';
        marketInsights.priceFluctuations.slice(0, 2).forEach((price: any) => {
          const direction = price.change > 0 ? 'increase' : 'decrease';
          result += `- ${price.commodity}: ${Math.abs(price.change)}% ${direction} (${price.reason})\n`;
        });
      }
      
      if (marketInsights.demandShifts && marketInsights.demandShifts.length > 0) {
        result += '\nDemand Shifts:\n';
        marketInsights.demandShifts.slice(0, 2).forEach((shift: string) => {
          result += `- ${shift}\n`;
        });
      }
    }
    
    return result || 'Intelligence data structure not recognized.';
  } catch (error) {
    console.warn('Error formatting intelligence data:', error);
    return 'Error processing intelligence data.';
  }
}

/**
 * Extract critical events from intelligence data
 */
function extractCriticalEvents(intelligenceData: any): any[] {
  if (!intelligenceData) {
    return [];
  }
  
  try {
    // Handle different possible structures
    const intelligence = typeof intelligenceData === 'string' 
      ? JSON.parse(intelligenceData) 
      : intelligenceData;
    
    // Extract critical events
    return (intelligence.criticalEvents || intelligence.intelligence?.criticalEvents || [])
      .filter((event: any) => {
        // Consider any event with HIGH or CRITICAL impact, or severity > 70
        const highImpact = event.impact === 'HIGH' || event.impact === 'CRITICAL';
        const highSeverity = typeof event.severity === 'number' && event.severity > 70;
        return highImpact || highSeverity;
      });
  } catch (error) {
    console.warn('Error extracting critical events:', error);
    return [];
  }
}
