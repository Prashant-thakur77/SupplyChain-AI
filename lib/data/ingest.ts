/**
 * Data Ingestion Module
 * 
 * Responsible for gathering data from multiple sources:
 * - Supabase (nodes, edges, intelligence)
 * - Mem0 (memory)
 * - Tavily (news, research)
 * - Weather API
 * - Market data APIs
 */

// Fix imports to use relative paths instead of aliases
import { supabaseServer } from '../supabase/server';
import { tavilyTools } from '../fixed-tavily';
import { tavily } from '@tavily/core';
import { getMemories, retrieveMemories } from '@mem0/vercel-ai-provider';
import { IngestedData } from '../agents/forecast/types';
import { instrumentStep } from '../monitoring';

interface IngestParams {
  supplyChainId: string;
  nodeId?: string;
  timeHorizon?: number;
  enableWeather: boolean;
  enableNews: boolean;
  enableMarketData: boolean;
  enableMemory: boolean;
}

/**
 * Main function to ingest all required data for forecast
 */
export async function ingestData(params: IngestParams): Promise<IngestedData> {
  const {
    supplyChainId,
    nodeId,
    timeHorizon = 30,
    enableWeather,
    enableNews,
    enableMarketData,
    enableMemory
  } = params;

  // Track all promises for parallel execution
  const promises: Promise<any>[] = [];

  // Track promise indices for mapping results
  const promiseMap = {
    supplyChain: -1,
    nodes: -1,
    edges: -1,
    intelligence: -1,
    weather: -1,
    news: -1,
    marketData: -1,
    memory: -1
  };

  // 1. Get supply chain details
  promiseMap.supplyChain = promises.length;
  promises.push(
    Promise.resolve(
      supabaseServer
        .from('supply_chains')
        .select('*')
        .eq('supply_chain_id', supplyChainId)
        .single()
    )
  );

  // 2. Get nodes
  promiseMap.nodes = promises.length;
  if (nodeId) {
    // Get specific node if requested
    promises.push(
      Promise.resolve(
        supabaseServer
          .from('nodes')
          .select('*')
          .eq('node_id', nodeId)
      )
    );
  } else {
    // Get all nodes for the supply chain
    promises.push(
      Promise.resolve(
        supabaseServer
          .from('nodes')
          .select('*')
          .eq('supply_chain_id', supplyChainId)
      )
    );
  }

  // 3. Get edges
  promiseMap.edges = promises.length;
  promises.push(
    Promise.resolve(
      supabaseServer
        .from('edges')
        .select('*')
        .eq('supply_chain_id', supplyChainId)
    )
  );

  // 4. Get intelligence
  promiseMap.intelligence = promises.length;
  if (nodeId) {
    // Get specific node intelligence if requested
    promises.push(
      Promise.resolve(
        supabaseServer
          .from('supply_chain_intel')
          .select('*')
          .eq('node_id', nodeId)
          .order('updated_at', { ascending: false })
      )
    );
  } else {
    // Get all intelligence for the supply chain
    promises.push(
      Promise.resolve(
        supabaseServer
          .from('supply_chain_intel')
          .select('*')
          .eq('supply_chain_id', supplyChainId)
          .order('updated_at', { ascending: false })
      )
    );
  }

  // Execute all base queries in parallel
  const results = await Promise.allSettled(promises);

  // Initialize result data
  const data: IngestedData = {
    nodes: [],
    edges: [],
    intelligence: [],
    weather: [],
    news: [],
    marketData: []
  };

  // Process supply chain result
  if (
    results[promiseMap.supplyChain].status === 'fulfilled' &&
    (results[promiseMap.supplyChain] as PromiseFulfilledResult<any>).value?.data
  ) {
    data.supplyChain = (results[promiseMap.supplyChain] as PromiseFulfilledResult<any>).value.data;
  }

  // Process nodes result
  if (
    results[promiseMap.nodes].status === 'fulfilled' &&
    (results[promiseMap.nodes] as PromiseFulfilledResult<any>).value?.data
  ) {
    data.nodes = (results[promiseMap.nodes] as PromiseFulfilledResult<any>).value.data;
  }

  // Process edges result
  if (
    results[promiseMap.edges].status === 'fulfilled' &&
    (results[promiseMap.edges] as PromiseFulfilledResult<any>).value?.data
  ) {
    data.edges = (results[promiseMap.edges] as PromiseFulfilledResult<any>).value.data;
  }

  // Process intelligence result
  if (
    results[promiseMap.intelligence].status === 'fulfilled' &&
    (results[promiseMap.intelligence] as PromiseFulfilledResult<any>).value?.data
  ) {
    data.intelligence = (results[promiseMap.intelligence] as PromiseFulfilledResult<any>).value.data;
  }

  // Get target node if we're forecasting for a specific node
  const targetNode = nodeId ? data.nodes.find(n => n.node_id === nodeId) : undefined;

  // Process additional data sources in parallel
  const additionalPromises: Promise<any>[] = [];
  const additionalPromiseMap = {
    weather: -1,
    news: -1,
    marketData: -1,
    memory: -1
  };

  // 5. Get weather data if enabled
  if (enableWeather && targetNode) {
    additionalPromiseMap.weather = additionalPromises.length;
    additionalPromises.push(getWeatherForecasts(targetNode, timeHorizon));
  }

  // 6. Get news data if enabled
  if (enableNews) {
    additionalPromiseMap.news = additionalPromises.length;
    additionalPromises.push(getNewsData(data.supplyChain, targetNode));
  }

  // 7. Get market data if enabled
  if (enableMarketData && data.supplyChain) {
    additionalPromiseMap.marketData = additionalPromises.length;
    additionalPromises.push(getMarketData(data.supplyChain, targetNode));
  }

  // 8. Get memory context if enabled
  if (enableMemory && process.env.MEM0_API_KEY && targetNode) {
    additionalPromiseMap.memory = additionalPromises.length;
    additionalPromises.push(getMemoryContext(supplyChainId, targetNode));
  }

  // Execute additional data sources in parallel if there are any
  if (additionalPromises.length > 0) {
    const additionalResults = await Promise.allSettled(additionalPromises);

    // Process weather results
    if (
      additionalPromiseMap.weather !== -1 &&
      additionalResults[additionalPromiseMap.weather].status === 'fulfilled'
    ) {
      data.weather = (additionalResults[additionalPromiseMap.weather] as PromiseFulfilledResult<any>).value || [];
    }

    // Process news results
    if (
      additionalPromiseMap.news !== -1 &&
      additionalResults[additionalPromiseMap.news].status === 'fulfilled'
    ) {
      data.news = (additionalResults[additionalPromiseMap.news] as PromiseFulfilledResult<any>).value || [];
    }

    // Process market data results
    if (
      additionalPromiseMap.marketData !== -1 &&
      additionalResults[additionalPromiseMap.marketData].status === 'fulfilled'
    ) {
      data.marketData = (additionalResults[additionalPromiseMap.marketData] as PromiseFulfilledResult<any>).value || [];
    }

    // Process memory context
    if (
      additionalPromiseMap.memory !== -1 &&
      additionalResults[additionalPromiseMap.memory].status === 'fulfilled'
    ) {
      data.memoryContext = (additionalResults[additionalPromiseMap.memory] as PromiseFulfilledResult<any>).value;
    }
  }

  return data;
}

/**
 * Get weather forecasts for a node
 */
async function getWeatherForecasts(node: any, days: number): Promise<any[]> {
  try {
    // Check if node has location data
    if (!node.location_lat || !node.location_lng) {
      console.warn(`No location data for node ${node.node_id}`);
      return [];
    }

    // Call weather API using environment variables
    if (!process.env.OPENWEATHER_API_KEY) {
      console.warn('No OpenWeather API key configured');
      return [];
    }

    // Make API call to OpenWeather
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${node.location_lat}&lon=${node.location_lng}&units=metric&cnt=${Math.min(days, 40)}&appid=${process.env.OPENWEATHER_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Weather API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    // Transform weather data to our format
    const forecasts = data.list.map((item: any) => ({
      date: new Date(item.dt * 1000).toISOString(),
      weather: item.weather[0].main,
      description: item.weather[0].description,
      temp: item.main.temp,
      humidity: item.main.humidity,
      wind_speed: item.wind.speed,
      precipitation: item.rain ? item.rain['3h'] : 0,
      severe: isSevereWeather(item.weather[0].id)
    }));

    return [{
      location: data.city.name,
      coordinates: {
        lat: node.location_lat,
        lon: node.location_lng
      },
      forecasts,
      source: 'openweathermap'
    }];
  } catch (error) {
    console.error('Error retrieving weather forecasts:', error);
    return [];
  }
}

/**
 * Check if weather condition is severe
 */
function isSevereWeather(weatherId: number): boolean {
  // Weather condition codes: https://openweathermap.org/weather-conditions
  const severeConditions = [
    // Thunderstorms
    200, 201, 202, 210, 211, 212, 221, 230, 231, 232,
    // Heavy rain
    502, 503, 504, 522, 531,
    // Snow
    601, 602, 616, 620, 621, 622,
    // Atmosphere (fog, dust, etc.)
    731, 751, 761, 762, 771,
    // Extreme
    781, 900, 901, 902, 903, 904, 905, 906
  ];

  return severeConditions.includes(weatherId);
}

/**
 * Get news data relevant to the supply chain and node
 */
async function getNewsData(supplyChain: any, targetNode?: any): Promise<any[]> {
  try {
    if (!process.env.TAVILY_API_KEY) {
      console.warn('No Tavily API key configured');
      return [];
    }

    // Initialize Tavily client
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

    // Build search queries based on context
    const queries = [];
    
    // If we have a specific node, search for news specific to that node
    if (targetNode) {
      queries.push(`${targetNode.type} supply chain disruption ${targetNode.address || ''} recent news`);
      
      if (targetNode.data?.industry) {
        queries.push(`${targetNode.data.industry} supply chain forecast ${targetNode.address || ''}`);
      }
    }
    
    // Always include general supply chain queries
    queries.push(`${supplyChain.name} supply chain forecast`);
    
    // General industry query if we can determine it
    const industry = targetNode?.data?.industry || 
                    (typeof supplyChain.form_data === 'string' ? 
                      JSON.parse(supplyChain.form_data).industrySector : 
                      supplyChain.form_data?.industrySector);
    
    if (industry) {
      queries.push(`${industry} industry forecast next month`);
    }

    // Execute all news searches in parallel with a limit
    const maxQueries = 2; // Limit to prevent API abuse
    const searchPromises = queries.slice(0, maxQueries).map(query => 
      tavilyClient.search(query, {
        maxResults: 5,
        searchDepth: 'basic',
        topic: 'news',
        days: 30, // Look for recent news relevant to forecast period
        includeAnswer: true,
        includeDomains: [
          'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com',
          'apnews.com', 'cnn.com', 'bbc.com', 'economist.com',
          'logisticsmgmt.com', 'supplychaindive.com', 'freightwaves.com'
        ],
        excludeDomains: ['twitter.com', 'facebook.com', 'reddit.com', 'pinterest.com', 'instagram.com']
      }).catch(e => {
        console.warn(`News search error for "${query}":`, e);
        return null;
      })
    );

    const searchResults = await Promise.all(searchPromises);
    
    // Flatten and transform results
    const news = searchResults
      .filter(Boolean) // Remove failed searches
      .flatMap(result => 
        result?.results.map((r: any) => ({
          title: r.title,
          url: r.url,
          content: r.content?.substring(0, 300) || '', // Limit content size
          publishedDate: r.publishedDate,
          source: r.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im)[1] || 'unknown',
          relevance: r.score || 0.5
        })) || []
      );
    
    // Deduplicate by URL
    const uniqueNews = Array.from(
      news.reduce((map, item) => {
        if (!map.has(item.url)) {
          map.set(item.url, item);
        }
        return map;
      }, new Map()).values()
    );
    
    return uniqueNews;
  } catch (error) {
    console.error('Error retrieving news data:', error);
    return [];
  }
}

/**
 * Get market data relevant to the supply chain
 */
async function getMarketData(supplyChain: any, targetNode?: any): Promise<any[]> {
  try {
    // In a real implementation, this would call external market data APIs
    // For now, we'll return mock data based on the supply chain industry
    
    // Try to determine industry
    const industry = targetNode?.data?.industry || 
                    (typeof supplyChain.form_data === 'string' ? 
                      JSON.parse(supplyChain.form_data).industrySector : 
                      supplyChain.form_data?.industrySector) || 
                    'general';

    // Generate mock market data based on industry
    const mockMarketData = getMockMarketDataForIndustry(industry);
    
    return mockMarketData;
  } catch (error) {
    console.error('Error retrieving market data:', error);
    return [];
  }
}

/**
 * Get mock market data for an industry
 */
function getMockMarketDataForIndustry(industry: string): any[] {
  const mockData: any[] = [];
  
  // Basic data for all industries
  mockData.push({
    indicator: 'Inflation Rate',
    value: 3.2,
    trend: 'up',
    change: 0.1,
    data: {
      forecast: 'Expected to remain elevated over the next quarter'
    }
  });
  
  mockData.push({
    indicator: 'Transportation Cost Index',
    value: 142.5,
    trend: 'up',
    change: 2.8,
    data: {
      forecast: 'Transportation costs continuing upward trend due to fuel prices'
    }
  });
  
  // Industry-specific data
  switch(industry.toLowerCase()) {
    case 'manufacturing':
    case 'electronics':
      mockData.push({
        commodity: 'Semiconductor',
        value: 125.4,
        trend: 'up',
        change: 5.2,
        data: {
          forecast: 'Semiconductor prices expected to rise due to global shortages'
        }
      });
      mockData.push({
        commodity: 'Steel',
        value: 980,
        trend: 'stable',
        change: 0.3,
        data: {
          forecast: 'Steel prices stabilizing after recent volatility'
        }
      });
      break;
      
    case 'retail':
    case 'consumer goods':
      mockData.push({
        indicator: 'Consumer Confidence Index',
        value: 98.2,
        trend: 'down',
        change: -1.4,
        data: {
          forecast: 'Consumer confidence weakening amid inflation concerns'
        }
      });
      mockData.push({
        indicator: 'Retail Sales Growth',
        value: 2.1,
        trend: 'down',
        change: -0.4,
        data: {
          forecast: 'Retail sales growth slowing but remaining positive'
        }
      });
      break;
      
    case 'energy':
    case 'oil':
    case 'gas':
      mockData.push({
        commodity: 'Crude Oil',
        value: 78.35,
        trend: 'up',
        change: 3.6,
        data: {
          forecast: 'Oil prices expected to remain volatile due to geopolitical tensions'
        }
      });
      mockData.push({
        commodity: 'Natural Gas',
        value: 3.48,
        trend: 'down',
        change: -0.2,
        data: {
          forecast: 'Natural gas prices expected to decrease slightly with seasonal adjustments'
        }
      });
      break;
      
    case 'automotive':
      mockData.push({
        commodity: 'Lithium',
        value: 18400,
        trend: 'up',
        change: 12.5,
        data: {
          forecast: 'Lithium prices continuing to rise with EV demand growth'
        }
      });
      mockData.push({
        commodity: 'Rubber',
        value: 2.15,
        trend: 'stable',
        change: 0.1,
        data: {
          forecast: 'Rubber prices expected to remain stable'
        }
      });
      break;
      
    case 'food':
    case 'agriculture':
      mockData.push({
        commodity: 'Wheat',
        value: 615.2,
        trend: 'up',
        change: 4.2,
        data: {
          forecast: 'Wheat prices rising due to weather concerns in key growing regions'
        }
      });
      mockData.push({
        commodity: 'Coffee',
        value: 185.3,
        trend: 'up',
        change: 8.7,
        data: {
          forecast: 'Coffee prices expected to continue upward trend due to supply constraints'
        }
      });
      break;
      
    // Default case for any other industry
    default:
      mockData.push({
        indicator: 'Global Economic Growth',
        value: 2.7,
        trend: 'stable',
        change: 0.0,
        data: {
          forecast: 'Global economic growth forecast remains unchanged'
        }
      });
      mockData.push({
        indicator: 'Supply Chain Resiliency Index',
        value: 65.3,
        trend: 'down',
        change: -1.2,
        data: {
          forecast: 'Supply chain resiliency under pressure from multiple global factors'
        }
      });
  }
  
  return mockData;
}

/**
 * Get memory context for forecast from Mem0
 */
async function getMemoryContext(supplyChainId: string, node: any): Promise<string> {
  try {
    if (!process.env.MEM0_API_KEY) {
      console.warn('No Mem0 API key configured');
      return '';
    }

    // Build a rich, specific search query for more relevant memories
    const searchQuery = `supply chain forecast for ${node.name} ${node.type} in ${node.address || 'this location'} ${node.industry || 'this industry'} projected trends supply demand prices`;
    
    // Retrieve textual memory context
    const memoryContext = await retrieveMemories(searchQuery, {
      user_id: `node:${node.node_id}`,
      mem0ApiKey: process.env.MEM0_API_KEY
    });
    
    return memoryContext || '';
  } catch (error) {
    console.error('Error retrieving memory context:', error);
    return '';
  }
}
