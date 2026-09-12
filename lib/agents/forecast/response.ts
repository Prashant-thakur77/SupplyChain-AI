/**
 * Response Formatting Module
 * 
 * Responsible for:
 * 1. Transforming internal forecast data into API response format
 * 2. Including metadata and metrics
 * 3. Handling different response formats based on request parameters
 */

import { Forecast, ForecastOutput } from './types';
import { logError } from '../../monitoring';

/**
 * Convert a ForecastOutput to a Forecast object format
 */
function convertToForecast(output: ForecastOutput): Forecast {
  return {
    nodeId: output.nodeId || '',
    nodeName: output.forecastData?.events[0]?.title || 'Unknown',
    nodeType: output.forecastData?.events[0]?.category || 'Unknown',
    forecastStart: output.forecastData?.forecastStartDate || new Date().toISOString(),
    forecastEnd: output.forecastData?.forecastEndDate || new Date().toISOString(),
    forecastHorizonDays: output.forecastData?.forecastPeriod || 0,
    summary: {
      text: output.forecastData?.summary || '',
      keyPoints: output.forecastData?.keyFindings || [],
      riskScore: output.forecastData?.riskAssessment?.overallRiskScore || 0,
      riskTrend: output.forecastData?.riskAssessment?.riskTrend || 'stable',
      highestRiskDate: output.forecastData?.events[0]?.estimatedDate || '',
    },
    forecastPoints: output.forecastData?.events?.map((event: any) => ({
      date: event.estimatedDate || new Date().toISOString(),
      riskScore: event.probability * 10, // Scale probability to risk score
      events: [event],
    })) || [],
    analysis: {
      riskFactors: output.forecastData?.riskAssessment?.riskFactors || [],
      opportunities: [],
      recommendations: output.forecastData?.recommendations?.map((r: any) => r.title) || [],
    },
    evidence: {
      historicalDataPoints: output.metadata?.dataPoints || 0,
      externalSources: output.metadata?.sources?.length || 0,
      keyFactors: output.forecastData?.keyFindings || [],
      modelConfidence: output.metadata?.confidenceScore || 0,
    }
  };
}

interface ResponseOptions {
  includeMetadata?: boolean;
  includeRawData?: boolean;
  format?: 'full' | 'summary' | 'dashboard';
}

export interface FormattedResponse {
  success: boolean;
  forecast?: any;
  metadata?: any;
  error?: string;
}

/**
 * Format the forecast into a structured API response
 */
export async function formatResponse(
  forecastOutput: ForecastOutput | Forecast,
  options: ResponseOptions = {}
): Promise<FormattedResponse> {
  // Convert ForecastOutput to Forecast if needed
  const forecast = 'forecastData' in forecastOutput ? convertToForecast(forecastOutput) : forecastOutput as Forecast;
  try {
    const {
      includeMetadata = true,
      includeRawData = false,
      format = 'full'
    } = options;

    // Base response object
    const response: FormattedResponse = {
      success: true,
      forecast: formatForecastData(forecast, format)
    };

    // Add metadata if requested
    if (includeMetadata) {
      response.metadata = {
        generatedAt: new Date().toISOString(),
        nodeId: forecast.nodeId,
        nodeName: forecast.nodeName,
        forecastStart: forecast.forecastStart,
        forecastEnd: forecast.forecastEnd,
        confidenceScore: forecast.evidence.modelConfidence,
        sourcesUsed: forecast.evidence.externalSources,
        dataPoints: forecast.evidence.historicalDataPoints
      };
    }

    // Add raw data if requested (for debugging/analysis)
    if (includeRawData) {
      response.forecast.raw = forecast;
    }

    return response;
  } catch (error) {
    await logError('forecast.response', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error formatting forecast response'
    };
  }
}

/**
 * Format the forecast data based on the requested format
 */
function formatForecastData(forecast: Forecast, format: 'full' | 'summary' | 'dashboard'): any {
  switch (format) {
    case 'summary':
      return formatSummary(forecast);
    
    case 'dashboard':
      return formatForDashboard(forecast);
    
    case 'full':
    default:
      return formatFull(forecast);
  }
}

/**
 * Format the full forecast with all details
 */
function formatFull(forecast: Forecast): any {
  return {
    nodeDetails: {
      id: forecast.nodeId,
      name: forecast.nodeName,
      type: forecast.nodeType
    },
    period: {
      start: forecast.forecastStart,
      end: forecast.forecastEnd,
      days: forecast.forecastHorizonDays
    },
    summary: forecast.summary,
    dailyForecasts: forecast.forecastPoints.map(point => ({
      date: point.date,
      metrics: {
        production: point.productionAmount,
        inventory: point.inventoryLevel,
        demand: point.demandAmount,
        deliveryDelay: point.deliveryDelay,
        capacityUtilization: point.capacityUtilization,
      },
      risk: {
        score: point.riskScore,
        confidence: point.confidenceScore
      },
      events: point.events,
      insights: point.insights
    })),
    analysis: forecast.analysis,
    evidence: {
      keyFactors: forecast.evidence.keyFactors,
      modelConfidence: forecast.evidence.modelConfidence,
      limitations: forecast.evidence.limitations
    }
  };
}

/**
 * Format a summarized version of the forecast
 */
function formatSummary(forecast: Forecast): any {
  return {
    nodeId: forecast.nodeId,
    nodeName: forecast.nodeName,
    period: {
      start: forecast.forecastStart,
      end: forecast.forecastEnd,
      days: forecast.forecastHorizonDays
    },
    summary: forecast.summary,
    keyMetrics: {
      avgProduction: forecast.summary.averageProductionAmount,
      avgInventory: forecast.summary.averageInventoryLevel,
      avgDemand: forecast.summary.averageDemand,
      avgRiskScore: forecast.summary.averageRiskScore,
      highestRisk: {
        score: forecast.summary.highestRiskScore,
        date: forecast.summary.highestRiskDate
      }
    },
    topRisks: forecast.analysis.riskFactors.slice(0, 3),
    topRecommendations: forecast.analysis.recommendations.slice(0, 3)
  };
}

/**
 * Format the forecast data specifically for dashboard visualization
 */
function formatForDashboard(forecast: Forecast): any {
  // Extract time series data for charts
  const timeSeries = {
    dates: forecast.forecastPoints.map(p => p.date),
    production: forecast.forecastPoints.map(p => p.productionAmount),
    inventory: forecast.forecastPoints.map(p => p.inventoryLevel),
    demand: forecast.forecastPoints.map(p => p.demandAmount),
    risk: forecast.forecastPoints.map(p => p.riskScore),
  };
  
  // Extract risk profile
  const riskProfile = {
    average: forecast.summary.averageRiskScore,
    peak: {
      score: forecast.summary.highestRiskScore,
      date: forecast.summary.highestRiskDate
    },
    factors: forecast.analysis.riskFactors,
    timeline: forecast.forecastPoints.map(p => ({
      date: p.date,
      risk: p.riskScore,
      events: p.events.filter((e: any) => e.impact === 'HIGH' || e.impact === 'CRITICAL')
    }))
  };
  
  return {
    nodeDetails: {
      id: forecast.nodeId,
      name: forecast.nodeName,
      type: forecast.nodeType
    },
    period: {
      start: forecast.forecastStart,
      end: forecast.forecastEnd
    },
    summary: forecast.summary,
    timeSeries,
    riskProfile,
    recommendations: forecast.analysis.recommendations.slice(0, 5),
    keyEvents: forecast.forecastPoints
      .flatMap(p => p.events.map((e: any) => ({ ...e, date: p.date })))
      .sort((a: any, b: any) => {
        const impactOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return impactOrder[a.impact] - impactOrder[b.impact];
      })
      .slice(0, 10)
  };
}
