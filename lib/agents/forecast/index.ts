/**
 * Forecast Agent - Main Module
 * 
 * This module orchestrates the entire forecast process following a modular architecture:
 * 1. API validation
 * 2. Data ingestion from multiple sources
 * 3. Context building
 * 4. Prompt engineering
 * 5. LLM invocation
 * 6. Output validation
 * 7. Persistence
 * 8. Response formatting
 * 9. Monitoring
 * 10. Configuration
 */

// Import from the same directory
import { validateInput } from './validate';
import { buildContext } from './context';
import { generatePrompt } from './prompt';
import { invokeLLM } from './llm';
import { validateOutput, repairOutput } from './validate';
import { persistForecast } from './persist';
import { formatResponse } from './response';
import { ForecastConfig, ForecastRequestParams, ForecastContext, ForecastOutput } from './types'; // Import from local types file

// Direct relative imports from parent directories
import { logger, logError, instrumentStep, metrics } from '../../monitoring';
import { ingestData } from '../../data/ingest';
import { getValidUserId } from './database-utils';

// Define missing types that were referenced but not in the types.ts file
interface ForecastAgentParams {
  supplyChainId: string;
  nodeId?: string;
  forecastHorizonDays: number;
  includeWeather?: boolean;
  includeMarketData?: boolean;
  options?: {
    forceRefresh?: boolean;
    detailLevel?: 'low' | 'medium' | 'high';
  };
  traceId?: string;
}

interface Forecast {
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

// Default configuration that can be overridden
const DEFAULT_CONFIG: ForecastConfig = {
  timeHorizon: 30,
  maxRetries: 3,
  cacheTime: 1800, // 30 minutes
  enableMemory: true,
  enableWeather: true,
  enableNews: true,
  enableMarketData: true,
  confidenceThreshold: 0.70,
  logLevel: 'info'
};

/**
 * The main forecast agent that handles requests and orchestrates the forecasting process
 */
class ForecastAgent {
  private config: ForecastConfig;

  constructor(config: Partial<ForecastConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }

  /**
   * Main request handler for the forecast agent
   */
  public async handleRequest(params: any): Promise<any> {
    const startTime = Date.now();
    let stepTimes: { [key: string]: number } = {};
    let currentStep = 'init';

    try {
      // Step 1: Validate Input
      currentStep = 'validation';
      const startValidation = Date.now();
      const validatedInput = await validateInput(params);
      stepTimes.validation = Date.now() - startValidation;

      // Step 2: Ingest Data from Multiple Sources
      currentStep = 'ingestion';
      const startIngestion = Date.now();
      const ingestedData = await instrumentStep(() => 
        ingestData({
          supplyChainId: validatedInput.supplyChainId,
          nodeId: validatedInput.nodeId,
          timeHorizon: validatedInput.timeHorizon || this.config.timeHorizon,
          enableWeather: this.config.enableWeather,
          enableNews: this.config.enableNews,
          enableMarketData: this.config.enableMarketData,
          enableMemory: this.config.enableMemory
        }), 
        'forecast.ingestion'
      );
      stepTimes.ingestion = Date.now() - startIngestion;

      // Step 3: Build Context
      currentStep = 'context';
      const startContext = Date.now();
      const context = await instrumentStep(() => 
        buildContext(validatedInput, ingestedData),
        'forecast.context'
      );
      stepTimes.context = Date.now() - startContext;

      // Step 4: Generate Prompt
      currentStep = 'prompt';
      const startPrompt = Date.now();
      const prompt = await instrumentStep(() => 
        generatePrompt(context, this.config),
        'forecast.prompt'
      );
      stepTimes.prompt = Date.now() - startPrompt;

      // Step 5: Invoke LLM
      currentStep = 'llm';
      const startLLM = Date.now();
      let output = await instrumentStep(() => 
        invokeLLM(prompt, this.config),
        'forecast.llm'
      );
      stepTimes.llm = Date.now() - startLLM;

      // Step 6: Validate & Repair Output
      currentStep = 'validation_repair';
      const startOutputValidation = Date.now();
      const isValid = await validateOutput(output, this.config);
      
      if (!isValid) {
        const repairedOutput = await repairOutput(output, prompt, this.config, validatedInput.supplyChainId);
        output = repairedOutput;
      }
      stepTimes.validation_repair = Date.now() - startOutputValidation;

      // Step 7: Persist Forecast
      currentStep = 'persistence';
      const startPersistence = Date.now();
      const persistedForecast = await instrumentStep(() => 
        persistForecast(
          validatedInput.supplyChainId,
          validatedInput.nodeId,
          validatedInput.userId,
          output,
          ingestedData
        ),
        'forecast.persistence'
      );
      stepTimes.persistence = Date.now() - startPersistence;

      // Step 8: Format Response
      currentStep = 'response';
      const startResponse = Date.now();
      const response = await formatResponse(persistedForecast, {
        includeMetadata: validatedInput.includeMetadata || false,
        includeRawData: validatedInput.includeRawData || false
      });
      stepTimes.response = Date.now() - startResponse;

      // Add performance metrics to response
      response.metadata = {
        ...response.metadata,
        performanceMetrics: {
          totalTime: Date.now() - startTime,
          stepTimes
        }
      };

      return response;

    } catch (error) {
      // Log and report error
      await logError('forecast.agent', error, {
        currentStep,
        params,
        config: this.config
      });

      // Return error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        step: currentStep,
        metrics: {
          totalTime: Date.now() - startTime,
          stepTimes
        }
      };
    }
  }
}

// Export a singleton instance
export const forecastAgent = new ForecastAgent();

/**
 * Modern orchestration function that follows the 10-layer architecture
 * This provides a more explicit, functional approach compared to the class-based implementation
 */
export async function orchestrateForecastFlow(
  params: ForecastAgentParams
): Promise<ForecastOutput> {
  const startTime = Date.now();
  const traceId = params.traceId || `forecast-${Date.now()}`;
  
  // Define defaultConfig at the beginning of the function to avoid hoisting issues
  const defaultConfig: ForecastConfig = {
    timeHorizon: params.forecastHorizonDays || 30,
    maxRetries: 2,
    cacheTime: 1800,
    enableMemory: true,
    enableWeather: true,
    enableNews: true,
    enableMarketData: true,
    confidenceThreshold: 0.7,
    logLevel: 'info'
  };
  
  logger.info({
    message: 'Starting forecast flow',
    params,
    traceId
  });
  
  try {
    // 1. Validate input parameters
    const validatedParams = await instrumentStep(
      async () => validateInput(params),
      'forecast.validate_input'
    );
    metrics.record('forecast.step.validate_input', Date.now() - startTime, { traceId });
    
    // 2. Ingest data from multiple sources
    const ingestStartTime = Date.now();
    const ingestedData = await instrumentStep(
      async () => ingestData({
        supplyChainId: validatedParams.supplyChainId,
        nodeId: validatedParams.nodeId,
        timeHorizon: validatedParams.forecastHorizonDays,
        enableWeather: validatedParams.includeWeather ?? true,
        enableNews: true,
        enableMarketData: validatedParams.includeMarketData ?? true,
        enableMemory: true
      }),
      'forecast.ingest_data'
    );
    metrics.record('forecast.step.ingest_data', Date.now() - ingestStartTime, { traceId });
    
    // 3. Build context
    const contextStartTime = Date.now();
    const context = await instrumentStep(
      async () => buildContext(validatedParams, ingestedData),
      'forecast.build_context'
    );
    metrics.record('forecast.step.build_context', Date.now() - contextStartTime, { traceId });
    
    // 4. Generate prompt
    const promptStartTime = Date.now();
    const prompt = await instrumentStep(
      async () => generatePrompt(context, defaultConfig),
      'forecast.generate_prompt'
    );
    metrics.record('forecast.step.generate_prompt', Date.now() - promptStartTime, { traceId });
    
    // 5. Invoke LLM
    const llmStartTime = Date.now();
    const rawForecast = await instrumentStep(
      async () => invokeLLM(prompt, {
        ...defaultConfig,
        maxRetries: 2  // Override the retries setting
      }, validatedParams.supplyChainId),
      'forecast.invoke_llm'
    );
    metrics.record('forecast.step.invoke_llm', Date.now() - llmStartTime, { traceId });
    
    // 6. Validate and repair output if needed
    const validateStartTime = Date.now();
    const isValid = await validateOutput(rawForecast, defaultConfig);
    let finalForecast = rawForecast;
    
    if (!isValid) {
      logger.warn({
        message: 'Forecast validation failed, attempting repair',
        traceId
      });
      
      finalForecast = await repairOutput(rawForecast, prompt, defaultConfig, validatedParams.supplyChainId);
    }
    metrics.record('forecast.step.validate_output', Date.now() - validateStartTime, { traceId });
    
    // 7. Persist forecast
    const persistStartTime = Date.now();
    const persistedForecast = await instrumentStep(
      async () => {
        // Get a valid user ID or use undefined (making it optional in the database)
        const validUserId = validatedParams.userId || (await getValidUserId()) || undefined;
        return persistForecast(
          validatedParams.supplyChainId,
          validatedParams.nodeId,
          validUserId,
          finalForecast,
          ingestedData
        );
      },
      'forecast.persist'
    );
    metrics.record('forecast.step.persist', Date.now() - persistStartTime, { traceId });
    
    logger.info({
      message: 'Forecast flow completed successfully',
      duration: Date.now() - startTime,
      traceId
    });
    
    return persistedForecast;
    
  } catch (error) {
    // Log comprehensive error with context
    logger.error({
      message: 'Error in forecast flow',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params,
      duration: Date.now() - startTime,
      traceId
    });
    
    // Re-throw the error to be handled by the API layer
    throw error;
  }
}
