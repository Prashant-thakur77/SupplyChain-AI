/**
 * Persistence Module
 * 
 * Responsible for:
 * 1. Storing forecast data in the database
 * 2. Storing forecast in memory (Mem0)
 * 3. Managing cache
 */

import { supabaseServer } from '../../supabase/server';
import { Redis } from '@upstash/redis';
import { ForecastOutput, IngestedData } from './types';
import { addMemories } from '@mem0/vercel-ai-provider';
import { logError } from '../../monitoring';

// Initialize Redis for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

/**
 * Generate a valid UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Persist forecast data to database and memory
 */
export async function persistForecast(
  supplyChainId: string,
  nodeId: string | undefined,
  userId: string | undefined,
  forecast: ForecastOutput,
  ingestedData: IngestedData
): Promise<ForecastOutput> {
  try {
    // 1. Add IDs if missing
    const completeOutput: ForecastOutput = {
      ...forecast,
      forecastId: forecast.forecastId || crypto.randomUUID(),
      supplyChainId: supplyChainId,
      nodeId: nodeId
    };

    // 2. Store in database
    const { data, error } = await supabaseServer
      .from('forecasts')
      .insert({
        forecast_id: completeOutput.forecastId,
        supply_chain_id: supplyChainId,
        node_id: nodeId,
        user_id: userId,
        
        // Core forecast data
        forecast_data: completeOutput.forecastData,
        
        // Separate components for better querying
        weather_data: ingestedData.weather,
        news_data: ingestedData.news,
        market_data: ingestedData.marketData,
        
        // Scenario data extracted from events for simulation usage
        scenario_json: completeOutput.forecastData.events.map(event => event.scenario_json),
        
        // Risk metrics
        risk_score: completeOutput.forecastData.riskAssessment.overallRiskScore,
        confidence_score: completeOutput.metadata.confidenceScore,
        
        // Time horizons
        forecast_period: completeOutput.forecastData.forecastPeriod,
        forecast_start_date: new Date(completeOutput.forecastData.forecastStartDate),
        forecast_end_date: new Date(completeOutput.forecastData.forecastEndDate)
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 3. Store in cache
    await cacheStorage(nodeId, completeOutput);
    
    // 4. Store in Mem0 memory
    await memoryStorage(nodeId, completeOutput, ingestedData);
    
    // 5. Return the complete output with database ID
    return completeOutput;
  } catch (error) {
    await logError('forecast.persist', error, {
      supplyChainId,
      nodeId,
      userId
    });
    
    throw new Error(`Failed to persist forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Store forecast in Redis cache
 */
async function cacheStorage(nodeId: string | undefined, forecast: ForecastOutput): Promise<void> {
  try {
    if (!nodeId) return; // Only cache node-specific forecasts
    
    await redis.setex(`forecast:${nodeId}`, 1800, forecast); // 30 min TTL
  } catch (error) {
    console.warn('Redis cache storage error:', error);
    // Continue without caching - non-critical
  }
}

/**
 * Store forecast in Mem0 memory
 */
async function memoryStorage(nodeId: string | undefined, forecast: ForecastOutput, ingestedData: IngestedData): Promise<boolean> {
  try {
    if (!nodeId || !process.env.MEM0_API_KEY) return false;
    
    // Find node details
    const node = ingestedData.nodes.find(n => n.node_id === nodeId);
    if (!node) return false;
    
    // Format memory content
    const memoryContent = `
Supply Chain Forecast for ${node.name} (${node.type}) in ${node.address || 'unknown location'}:

Generated on: ${forecast.metadata.createdAt}
Forecast Period: ${forecast.forecastData.forecastPeriod} days (${new Date(forecast.forecastData.forecastStartDate).toLocaleDateString()} to ${new Date(forecast.forecastData.forecastEndDate).toLocaleDateString()})
Risk Score: ${forecast.forecastData.riskAssessment.overallRiskScore}/100 (Trend: ${forecast.forecastData.riskAssessment.riskTrend})
Confidence Score: ${(forecast.metadata.confidenceScore * 100).toFixed(1)}%

Key Findings:
${forecast.forecastData.keyFindings.map(finding => `- ${finding}`).join('\n')}

Summary: 
${forecast.forecastData.summary}

Projected Events:
${forecast.forecastData.events.map(event => 
  `- ${event.title} (${event.impact.toUpperCase()}, ${Math.round(event.probability * 100)}% probability): ${event.description}`
).join('\n')}

Top Recommendations:
${forecast.forecastData.recommendations.map(rec => 
  `- ${rec.title} (${rec.priority.toUpperCase()} priority): ${rec.description}`
).slice(0, 3).join('\n')}
`;

    // Store in Mem0
    const memoryMessages = [{
      role: 'user' as const,
      content: [{
        type: 'text' as const,
        text: memoryContent
      }]
    }];
    
    await addMemories(memoryMessages, {
      user_id: `node:${nodeId}`,
      mem0ApiKey: process.env.MEM0_API_KEY
    });
    
    return true;
  } catch (error) {
    console.warn('Memory storage error:', error);
    return false;
  }
}
