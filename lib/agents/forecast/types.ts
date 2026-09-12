/**
 * Type definitions for the Forecast Agent
 */

export interface ForecastConfig {
  timeHorizon: number;     // Default forecast period in days (e.g., 30, 60, 90)
  maxRetries: number;      // Maximum number of retries for LLM calls
  cacheTime: number;       // Time to cache forecasts in seconds
  enableMemory: boolean;   // Whether to use Mem0 for memory
  enableWeather: boolean;  // Whether to integrate weather data
  enableNews: boolean;     // Whether to integrate news data
  enableMarketData: boolean; // Whether to integrate market data
  confidenceThreshold: number; // Minimum confidence threshold for forecast (0-1)
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ForecastRequestParams {
  supplyChainId: string;
  nodeId?: string;         // Optional - forecast for specific node
  userId?: string;         // Optional - user who requested forecast
  timeHorizon?: number;    // Optional - override default time horizon
  forecastHorizonDays?: number; // Alias for timeHorizon
  includeMetadata?: boolean; // Optional - include metadata in response
  includeRawData?: boolean;  // Optional - include raw data used in response
  includeWeather?: boolean;  // Optional - include weather data
  includeMarketData?: boolean; // Optional - include market data
}

export interface IngestedData {
  nodes: NodeData[];
  edges: EdgeData[];
  supplyChain?: SupplyChainData;
  intelligence: IntelligenceData[];
  weather: WeatherData[];
  news: NewsData[];
  marketData: MarketData[];
  memoryContext?: string;
}

export interface NodeData {
  node_id: string;
  name: string;
  type: string;
  description?: string;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  data?: any;
  upstreamNodes?: NodeData[];
  downstreamNodes?: NodeData[];
}

export interface EdgeData {
  edge_id: string;
  supply_chain_id: string;
  from_node_id: string;
  to_node_id: string;
  type?: string;
  data?: any;
}

export interface SupplyChainData {
  supply_chain_id: string;
  name: string;
  description?: string;
  organisation?: any;
  form_data?: any;
}

export interface IntelligenceData {
  intel_id: string;
  node_id: string;
  intelligence_data: any;
  risk_score: number;
  quality_score: number;
  news?: any[];
  weather?: any;
  created_at: string;
  updated_at: string;
}

export interface WeatherData {
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  forecasts: WeatherForecast[];
  source: string;
}

export interface WeatherForecast {
  date: string;
  weather: string;
  description: string;
  temp: number;
  humidity?: number;
  wind_speed?: number;
  precipitation?: number;
  severe: boolean;
}

export interface NewsData {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  source: string;
  relevance: number;
}

export interface MarketData {
  commodity?: string;
  indicator?: string;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  data?: any;
}

export interface ForecastContext {
  supplyChain: SupplyChainData;
  nodes: NodeData[];
  targetNode?: NodeData;
  edges: EdgeData[];
  intelligence: IntelligenceData[];
  relevantIntelligence?: IntelligenceData[];
  recentRiskTrend?: {
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
  };
  weather: WeatherData[];
  news: NewsData[];
  marketData: MarketData[];
  memoryContext?: string;
  timeHorizon: number;
}

export interface ForecastOutput {
  forecastId?: string;
  supplyChainId: string;
  nodeId?: string;
  forecastData: {
    forecastPeriod: number;
    forecastStartDate: string;
    forecastEndDate: string;
    summary: string;
    keyFindings: string[];
    riskAssessment: {
      overallRiskScore: number;
      riskTrend: 'increasing' | 'decreasing' | 'stable';
      riskFactors: {
        factor: string;
        probability: number;
        impact: number;
        mitigation?: string;
      }[];
    };
    demandForecast?: {
      trend: 'increasing' | 'decreasing' | 'stable';
      percentage: number;
      confidence: number;
      factors: string[];
    };
    supplyForecast?: {
      trend: 'increasing' | 'decreasing' | 'stable';
      percentage: number;
      confidence: number;
      factors: string[];
    };
    priceForecast?: {
      trend: 'increasing' | 'decreasing' | 'stable';
      percentage: number;
      confidence: number;
      factors: string[];
    };
    events: {
      title: string;
      description: string;
      probability: number;
      impact: 'low' | 'medium' | 'high' | 'critical';
      estimatedDate?: string;
      category: 'weather' | 'geopolitical' | 'economic' | 'operational' | 'regulatory' | 'other';
      scenario_json: {
        scenarioName: string;
        scenarioType: string;
        disruptionSeverity: number;
        disruptionDuration: number;
        affectedNode: string;
        description: string;
        startDate: string;
        endDate: string;
        monteCarloRuns: number;
        distributionType: string;
        cascadeEnabled: boolean;
        failureThreshold: number;
        bufferPercent: number;
        alternateRouting: boolean;
        randomSeed: string;
      };
    }[];
    recommendations: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimatedImpact: number;
      timeframe: string;
    }[];
  };
  weatherData?: any;
  newsData?: any[];
  marketData?: any;
  metadata: {
    createdAt: string;
    confidenceScore: number;
    dataPoints: number;
    sources: string[];
    performanceMetrics?: {
      totalTime: number;
      stepTimes: {
        [key: string]: number;
      };
    };
  };
}

export interface Forecast {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  forecastStart: string;
  forecastEnd: string;
  forecastHorizonDays: number;
  summary: any;
  forecastPoints: any[];
  analysis: {
    riskFactors: any[];
    opportunities?: string[];
    recommendations: string[];
    confidenceExplanation?: string;
  };
  evidence: {
    historicalDataPoints: number;
    externalSources: number;
    keyFactors: string[];
    modelConfidence: number;
    limitations?: string[];
  };
}
