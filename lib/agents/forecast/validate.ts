/**
 * Validation Module
 * 
 * Handles:
 * 1. Input validation
 * 2. Output validation
 * 3. Output repair if needed
 */

import { z } from 'zod';
import { ForecastConfig, ForecastOutput, ForecastRequestParams } from './types';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { logError } from '../../monitoring';
import { AI_MODELS, getAIKeyForModule } from '@/lib/ai-config';

// Input schema for request validation
const inputSchema = z.object({
  supplyChainId: z.string().uuid({ message: 'Supply chain ID must be a valid UUID' }),
  nodeId: z.string().uuid({ message: 'Node ID must be a valid UUID' }).optional(),
  userId: z.string().uuid({ message: 'User ID must be a valid UUID' }).optional(),
  timeHorizon: z.number().int().positive().max(365).optional(),
  includeMetadata: z.boolean().optional().default(false),
  includeRawData: z.boolean().optional().default(false)
});

// Output schema defines the expected structure of the forecast output
const outputSchema = z.object({
  forecastData: z.object({
    forecastPeriod: z.number().int().positive(),
    forecastStartDate: z.string().datetime(),
    forecastEndDate: z.string().datetime(),
    summary: z.string().min(50),
    keyFindings: z.array(z.string()).min(1),
    riskAssessment: z.object({
      overallRiskScore: z.number().min(0).max(100),
      riskTrend: z.enum(['increasing', 'decreasing', 'stable']),
      riskFactors: z.array(z.object({
        factor: z.string().min(5),
        probability: z.number().min(0).max(1),
        impact: z.number().min(0).max(100),
        mitigation: z.string().optional()
      })).min(1)
    }),
    events: z.array(z.object({
      title: z.string().min(5),
      description: z.string().min(10),
      probability: z.number().min(0).max(1),
      impact: z.enum(['low', 'medium', 'high', 'critical']),
      estimatedDate: z.string().optional(),
      category: z.enum(['weather', 'geopolitical', 'economic', 'operational', 'regulatory', 'other']),
      scenario_json: z.object({
        scenarioName: z.string(),
        scenarioType: z.string(),
        disruptionSeverity: z.number().min(0).max(100),
        disruptionDuration: z.number().min(1).max(365),
        affectedNode: z.string(),
        description: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        monteCarloRuns: z.number().min(1000).max(50000),
        distributionType: z.enum(['normal', 'lognormal', 'uniform', 'exponential', 'beta']),
        cascadeEnabled: z.boolean(),
        failureThreshold: z.number().min(0).max(1),
        bufferPercent: z.number().min(0).max(100),
        alternateRouting: z.boolean(),
        randomSeed: z.string()
      })
    })),
    recommendations: z.array(z.object({
      title: z.string().min(5),
      description: z.string().min(10),
      priority: z.enum(['low', 'medium', 'high']),
      estimatedImpact: z.number().min(0).max(100),
      timeframe: z.string().min(3)
    }))
  }),
  supplyChainId: z.string(),
  nodeId: z.string().optional(),
  metadata: z.object({
    createdAt: z.string().datetime(),
    confidenceScore: z.number().min(0).max(1),
    dataPoints: z.number().int().nonnegative(),
    sources: z.array(z.string())
  })
});

/**
 * Validates input parameters for the forecast request
 */
export async function validateInput(params: any): Promise<ForecastRequestParams> {
  try {
    const validatedInput = inputSchema.parse(params);
    return validatedInput;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod errors for better readability
      const formattedErrors = error.errors.map(e => {
        return `${e.path.join('.')}: ${e.message}`;
      }).join('; ');

      throw new Error(`Invalid input parameters: ${formattedErrors}`);
    }
    
    throw error;
  }
}

/**
 * Validates the forecast output structure and content
 */
export async function validateOutput(output: any, config: ForecastConfig): Promise<boolean> {
  try {
    // Basic schema validation
    outputSchema.parse(output);
    
    // Additional validation logic
    const { forecastData } = output;
    
    // 1. Check if confidence score meets threshold
    if (output.metadata.confidenceScore < config.confidenceThreshold) {
      console.warn(`Forecast confidence score (${output.metadata.confidenceScore}) below threshold (${config.confidenceThreshold})`);
      return false;
    }
    
    // 2. Check timing coherence
    const startDate = new Date(forecastData.forecastStartDate);
    const endDate = new Date(forecastData.forecastEndDate);
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setDate(startDate.getDate() + forecastData.forecastPeriod);
    
    const endDateDiff = Math.abs(endDate.getTime() - expectedEndDate.getTime());
    if (endDateDiff > 86400000) { // More than 1 day difference
      console.warn('Forecast end date inconsistent with forecast period');
      return false;
    }
    
    // 3. Event probability and impact correlation check
    for (const event of forecastData.events) {
      // High probability (>0.7) events with low impact are suspicious
      if (event.probability > 0.7 && event.impact === 'low') {
        console.warn(`Suspicious event correlation: High probability (${event.probability}) with low impact`);
        // This might be okay, so don't fail validation, just log warning
      }
      
      // Low probability (<0.3) with critical impact should be examined
      if (event.probability < 0.3 && event.impact === 'critical') {
        console.warn(`Potential black swan event detected: Low probability (${event.probability}) with critical impact`);
        // This might be valid, just log for analysis
      }
    }
    
    // 4. Check risk factor coverage
    const riskCategories = forecastData.events.map((e: any) => e.category);
    const uniqueCategories = new Set(riskCategories);
    
    if (uniqueCategories.size < 2) {
      console.warn('Limited risk category coverage: only one category present');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Forecast output validation error:', error);
    return false;
  }
}

/**
 * Repairs invalid output by sending it back through the LLM with instructions
 */
export async function repairOutput(
  invalidOutput: any, 
  originalPrompt: string, 
  config: ForecastConfig,
  supplyChainId?: string
): Promise<any> {
  try {
    let errors: string[] = [];
    
    try {
      outputSchema.parse(invalidOutput);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors = error.errors.map(e => {
          return `${e.path.join('.')}: ${e.message}`;
        });
      }
    }
    
    // Add custom validation errors
    if (invalidOutput.metadata?.confidenceScore < config.confidenceThreshold) {
      errors.push(`Confidence score (${invalidOutput.metadata?.confidenceScore}) below required threshold (${config.confidenceThreshold})`);
    }
    
    const repairPrompt = `
You are an AI tasked with repairing an invalid supply chain forecast. The original forecast had the following issues:

${errors.join('\n')}

Here's the original invalid forecast:
${JSON.stringify(invalidOutput, null, 2)}

And here was the original prompt that generated it:
${originalPrompt}

Please generate a repaired version that fixes all the issues while maintaining as much of the original analysis as possible.
Ensure all dates are properly formatted ISO strings, all risk scores are within proper ranges (0-100),
probabilities are decimal values between 0 and 1, and that the analysis is comprehensive and well-supported.

CRITICAL REQUIREMENT: Every event in the events array MUST include a complete scenario_json object with all required fields:
- scenarioName, scenarioType, disruptionSeverity (0-100), disruptionDuration (1-365)
- affectedNode, description, startDate, endDate (ISO format)
- monteCarloRuns (1000-50000), distributionType (normal/lognormal/uniform/exponential/beta)
- cascadeEnabled (boolean), failureThreshold (0-1), bufferPercent (0-100)
- alternateRouting (boolean), randomSeed (string)

If the confidence score was too low, improve the quality of the analysis with more specific details and evidence-based statements.
`;

    // Generate repaired output using higher temperature for more creativity in fixing issues
    const google = createGoogleGenerativeAI({ apiKey: getAIKeyForModule('agents') });
    const repairedOutput = await generateObject({
      model: google(AI_MODELS.agents),
      schema: outputSchema,
      prompt: repairPrompt,
      temperature: 0.4
    });

    console.log('Successfully repaired forecast output');
    
    // Override supplyChainId with the correct one, just like in the main LLM function
    const result = repairedOutput.object;
    if (supplyChainId) {
      result.supplyChainId = supplyChainId;
    }
    
    return result;
    
  } catch (error) {
    logError('forecast.repair', error, { originalOutput: invalidOutput });
    
    // If repair fails, create a minimal valid output
    return createFallbackOutput(invalidOutput, supplyChainId);
  }
}

/**
 * Creates a minimal valid output when repair fails
 */
function createFallbackOutput(invalidOutput: any, supplyChainId?: string): ForecastOutput {
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + 30); // Default 30-day forecast
  
  // Use provided supplyChainId or generate a valid UUID
  const validSupplyChainId = supplyChainId || crypto.randomUUID();
  const nodeId = invalidOutput?.nodeId;
  
  return {
    supplyChainId: validSupplyChainId,
    nodeId,
    forecastData: {
      forecastPeriod: 30,
      forecastStartDate: now.toISOString(),
      forecastEndDate: endDate.toISOString(),
      summary: 'This is a fallback forecast generated due to errors in processing. Limited data quality or availability may have affected the forecast generation.',
      keyFindings: [
        'Forecast generation encountered technical issues',
        'Limited data was available for analysis',
        'Consider requesting a new forecast with additional data'
      ],
      riskAssessment: {
        overallRiskScore: 50, // Neutral score when uncertain
        riskTrend: 'stable',
        riskFactors: [
          {
            factor: 'Data quality issues',
            probability: 1.0,
            impact: 70,
            mitigation: 'Request a new forecast with additional data sources'
          }
        ]
      },
      events: [
        {
          title: 'Potential data gap',
          description: 'Insufficient data was available to generate a complete forecast',
          probability: 1.0,
          impact: 'medium',
          category: 'operational',
          scenario_json: {
            scenarioName: "Data Quality Gap",
            scenarioType: "operational",
            disruptionSeverity: 30,
            disruptionDuration: 1,
            affectedNode: "system-fallback",
            description: "Forecast generation system experienced data quality issues",
            startDate: now.toISOString(),
            endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            monteCarloRuns: 1000,
            distributionType: "normal",
            cascadeEnabled: false,
            failureThreshold: 0.8,
            bufferPercent: 20,
            alternateRouting: true,
            randomSeed: "data-gap-fallback-" + now.getFullYear()
          }
        }
      ],
      recommendations: [
        {
          title: 'Improve data quality',
          description: 'Ensure all required data sources are available and functioning',
          priority: 'high',
          estimatedImpact: 80,
          timeframe: 'Immediate'
        }
      ]
    },
    metadata: {
      createdAt: now.toISOString(),
      confidenceScore: 0.5,
      dataPoints: 0,
      sources: ['system-fallback']
    }
  };
}
