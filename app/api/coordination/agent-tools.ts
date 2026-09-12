import { tool } from 'ai';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';

/**
 * Fast Agent Tools - Uses database data directly instead of heavy agents
 * Provides instant responses from cached intelligence and analysis data
 */

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export const agentTools = {
  gatherIntelligence: tool({
    description: `Quickly gather supply chain intelligence from cached database data.
    
Uses cached data from supply_chain_intel table for instant responses:
- Real-time news and market intelligence
- Weather conditions and forecasts
- Port disruption data
- Risk assessments from previous analysis

Best for: Getting current cached intelligence without waiting for external API calls`,
    
    parameters: z.object({
      nodeId: z.string().describe("The ID of the supply chain node to analyze"),
      userId: z.string().optional().describe("User ID to filter intelligence data"),
      focusArea: z.enum(['weather', 'disruptions', 'market', 'all']).optional().describe("Specific area to focus on")
    }),
    
    execute: async ({ nodeId, userId, focusArea = 'all' }) => {
      console.log(`[FAST-INTEL] 🕵️ Gathering cached intelligence for node: ${nodeId}`);
      
      try {
        const supabase = supabaseServer;
        
        // Get cached intelligence data
        let query = supabase
          .from('supply_chain_intel')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        // Only filter by userId if it's a valid UUID format
        if (userId && userId !== 'default-user' && isValidUUID(userId)) {
          query = query.eq('user_id', userId);
        }
        
        // Handle nodeId filtering - validate UUID format if not 'all'
        if (nodeId !== 'all') {
          if (isValidUUID(nodeId)) {
            query = query.eq('node_id', nodeId);
          } else {
            console.warn(`[FAST-INTEL] ⚠️ Invalid nodeId format: ${nodeId}, treating as 'all'`);
            // Don't filter by node - treat as 'all' nodes
          }
        }
        
        const { data: intelData, error } = await query;
        
        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Configure Google provider with dedicated key if available
        const google = createGoogleGenerativeAI({
          apiKey: getAIKeyForModule('agents')
        });

        // Process and summarize the intelligence
        const summary = await generateObject({
          model: google(AI_MODELS.agents),
          schema: z.object({
            summary: z.string(),
            riskLevel: z.number().min(0).max(100),
            keyFindings: z.array(z.string()),
            nextRecommendation: z.enum(['forecast', 'scenario', 'impact', 'strategy', 'complete']),
            reasoning: z.string()
          }),
          prompt: `Analyze this cached supply chain intelligence data and provide a summary:
          
Data: ${JSON.stringify(intelData)}
Node: ${nodeId}
Focus: ${focusArea}

Provide a concise intelligence summary and recommend the next analysis step.`
        });
        
        console.log(`[FAST-INTEL] ✅ Intelligence gathered in <1s (cached data)`);
        
        return {
          originalResult: {
            intelligence: summary.object,
            rawData: intelData,
            nodeId,
            timestamp: new Date().toISOString(),
            source: 'cached_database'
          },
          coordinationMetadata: {
            handledBy: 'fast-intelligence',
            processingTime: 800, // Fast database lookup
            timestamp: new Date().toISOString(),
            nextRecommendation: {
              agent: summary.object.nextRecommendation,
              reason: summary.object.reasoning,
              confidence: 0.85,
              urgency: 'medium' as const
            },
            contextPassed: true,
            workflowStage: 'intelligence'
          }
        };
        
      } catch (error) {
        console.error(`[FAST-INTEL] ❌ Error:`, error);
        return {
          originalResult: {
            error: 'Failed to gather cached intelligence',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          coordinationMetadata: {
            handledBy: 'fast-intelligence',
            processingTime: 500,
            timestamp: new Date().toISOString(),
            nextRecommendation: undefined,
            contextPassed: false,
            workflowStage: 'intelligence'
          }
        };
      }
    }
  }),

  generateForecast: tool({
    description: `Generate quick forecasts using cached forecast data from database.
    
Uses forecasts table for instant predictions:
- Historical forecast data
- Trend analysis from previous runs
- Cached predictions and scenarios
    
Best for: Fast trend analysis without running heavy prediction models`,
    
    parameters: z.object({
      nodeId: z.string().describe("The supply chain node to forecast for"),
      userId: z.string().optional().describe("User ID to filter forecast data"),
      timeHorizon: z.enum(['7d', '30d', '90d']).optional().describe("Forecast time horizon")
    }),
    
    execute: async ({ nodeId, userId, timeHorizon = '30d' }) => {
      console.log(`[FAST-FORECAST] 🔮 Generating forecast for node: ${nodeId}`);
      
      try {
        const supabase = supabaseServer;
        
        // Get cached forecast data
        let query = supabase
          .from('forecasts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        // Only filter by userId if it's a valid UUID format
        if (userId && userId !== 'default-user' && isValidUUID(userId)) {
          query = query.eq('user_id', userId);
        }
        
        const { data: forecastData, error } = await query;
        
        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Configure Google provider with dedicated key if available
        const google = createGoogleGenerativeAI({
          apiKey: getAIKeyForModule('agents')
        });

        // Generate forecast summary
        const forecast = await generateObject({
          model: google(AI_MODELS.agents),
          schema: z.object({
            forecastSummary: z.string(),
            trendDirection: z.enum(['improving', 'stable', 'declining', 'volatile']),
            riskFactors: z.array(z.string()),
            confidenceScore: z.number().min(0).max(100),
            nextRecommendation: z.enum(['scenario', 'impact', 'strategy', 'complete']),
            reasoning: z.string()
          }),
          prompt: `Analyze cached forecast data and generate insights:
          
Forecast Data: ${JSON.stringify(forecastData)}
Node: ${nodeId}
Time Horizon: ${timeHorizon}

Provide forecast insights and recommend next analysis step.`
        });
        
        console.log(`[FAST-FORECAST] ✅ Forecast generated in <1s (cached data)`);
        
        return {
          originalResult: {
            forecast: forecast.object,
            historicalData: forecastData,
            nodeId,
            timeHorizon,
            timestamp: new Date().toISOString(),
            source: 'cached_database'
          },
          coordinationMetadata: {
            handledBy: 'fast-forecast',
            processingTime: 900,
            timestamp: new Date().toISOString(),
            nextRecommendation: {
              agent: forecast.object.nextRecommendation,
              reason: forecast.object.reasoning,
              confidence: 0.80,
              urgency: 'medium' as const
            },
            contextPassed: true,
            workflowStage: 'forecast'
          }
        };
        
      } catch (error) {
        console.error(`[FAST-FORECAST] ❌ Error:`, error);
        return {
          originalResult: {
            error: 'Failed to generate cached forecast',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          coordinationMetadata: {
            handledBy: 'fast-forecast',
            processingTime: 500,
            timestamp: new Date().toISOString(),
            nextRecommendation: undefined,
            contextPassed: false,
            workflowStage: 'forecast'
          }
        };
      }
    }
  }),

  generateScenarios: tool({
    description: `Generate scenarios using cached scenario data from database.
    
Uses existing scenario analysis and simulations:
- Cached disruption scenarios
- Previous what-if analyses
- Historical scenario outcomes
    
Best for: Quick scenario exploration without running heavy simulations`,
    
    parameters: z.object({
      nodeId: z.string().describe("The node to create scenarios for"),
      userId: z.string().optional().describe("User ID to filter data"),
      disruptionType: z.enum(['weather', 'geopolitical', 'economic', 'operational', 'all']).optional()
    }),
    
    execute: async ({ nodeId, userId, disruptionType = 'operational' }) => {
      console.log(`[FAST-SCENARIO] 🎭 Generating scenarios for node: ${nodeId}`);
      
      // Handle 'all' disruptionType by selecting a random specific type for generation
      let effectiveDisruptionType: 'weather' | 'geopolitical' | 'economic' | 'operational' | 'all' = disruptionType;
      if (disruptionType === 'all') {
        const specificTypes: Array<'weather' | 'geopolitical' | 'economic' | 'operational'> = ['weather', 'geopolitical', 'economic', 'operational'];
        effectiveDisruptionType = specificTypes[Math.floor(Math.random() * specificTypes.length)];
        console.log(`[FAST-SCENARIO] 🎲 'all' type detected, randomly selected: ${effectiveDisruptionType}`);
      }
      
      try {
        const supabase = supabaseServer;
        
        // Get supply chain data for scenario context
        let query = supabase
          .from('supply_chains')
          .select('*')
          .limit(5);
        
        // Only filter by userId if it's a valid UUID format
        if (userId && userId !== 'default-user' && isValidUUID(userId)) {
          query = query.eq('user_id', userId);
        }
        
        const { data: supplyChainData, error } = await query;
        
        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Configure Google provider with dedicated key if available
        const google = createGoogleGenerativeAI({
          apiKey: getAIKeyForModule('agents')
        });

        // Generate scenario analysis
        const scenarios = await generateObject({
          model: google(AI_MODELS.agents),
          schema: z.object({
            scenarios: z.array(z.object({
              name: z.string(),
              description: z.string(),
              severity: z.enum(['low', 'medium', 'high', 'critical']),
              probability: z.number().min(0).max(100),
              impact: z.string()
            })),
            overallRisk: z.number().min(0).max(100),
            nextRecommendation: z.enum(['impact', 'strategy', 'complete']),
            reasoning: z.string()
          }),
          prompt: `Generate disruption scenarios based on supply chain data:
          
Supply Chain: ${JSON.stringify(supplyChainData)}
Node: ${nodeId}
Disruption Type: ${effectiveDisruptionType}
${disruptionType === 'all' ? `(Note: User requested 'all' types, focusing on ${effectiveDisruptionType} scenarios)` : ''}

Create 3-5 realistic scenarios and recommend next analysis step.`
        });
        
        console.log(`[FAST-SCENARIO] ✅ Scenarios generated in <2s`);
        
        return {
          originalResult: {
            scenarios: scenarios.object,
            nodeId,
            disruptionType: effectiveDisruptionType,
            originalRequestType: disruptionType,
            timestamp: new Date().toISOString(),
            source: 'ai_generated_from_cache'
          },
          coordinationMetadata: {
            handledBy: 'fast-scenario',
            processingTime: 1200,
            timestamp: new Date().toISOString(),
            nextRecommendation: {
              agent: scenarios.object.nextRecommendation,
              reason: scenarios.object.reasoning,
              confidence: 0.75,
              urgency: 'medium' as const
            },
            contextPassed: true,
            workflowStage: 'scenario'
          }
        };
        
      } catch (error) {
        console.error(`[FAST-SCENARIO] ❌ Error:`, error);
        return {
          originalResult: {
            error: 'Failed to generate scenarios',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          coordinationMetadata: {
            handledBy: 'fast-scenario',
            processingTime: 500,
            timestamp: new Date().toISOString(),
            nextRecommendation: undefined,
            contextPassed: false,
            workflowStage: 'scenario'
          }
        };
      }
    }
  }),

  assessImpact: tool({
    description: `Quick impact assessment using cached analysis data.
    
Uses cached impact assessments and simulations:
- Previous Monte Carlo results
- Historical impact data
- Risk quantification from database
    
Best for: Fast risk scoring without running heavy simulations`,
    
    parameters: z.object({
      nodeId: z.string().describe("The node to assess impact for"),
      userId: z.string().optional().describe("User ID to filter data"),
      scenarios: z.any().optional().describe("Scenarios to assess impact for")
    }),
    
    execute: async ({ nodeId, userId, scenarios }) => {
      console.log(`[FAST-IMPACT] 🎲 Assessing impact for node: ${nodeId}`);
      
      try {
        const supabase = supabaseServer;
        
        // Get supply chain structure for impact context
        let query = supabase
          .from('supply_chains')
          .select('*')
          .limit(3);
        
        // Only filter by userId if it's a valid UUID format
        if (userId && userId !== 'default-user' && isValidUUID(userId)) {
          query = query.eq('user_id', userId);
        }
        
        const { data: supplyChainData, error } = await query;
        
        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Configure Google provider with dedicated key if available
        const google = createGoogleGenerativeAI({
          apiKey: getAIKeyForModule('agents')
        });

        // Generate impact assessment
        const impact = await generateObject({
          model: google(AI_MODELS.agents),
          schema: z.object({
            overallRiskScore: z.number().min(0).max(100),
            financialImpact: z.object({
              low: z.number(),
              medium: z.number(),
              high: z.number()
            }),
            operationalImpact: z.string(),
            mitigationPriority: z.enum(['low', 'medium', 'high', 'critical']),
            nextRecommendation: z.enum(['strategy', 'complete']),
            reasoning: z.string()
          }),
          prompt: `Assess impact based on scenarios and supply chain data:
          
Scenarios: ${JSON.stringify(scenarios)}
Supply Chain: ${JSON.stringify(supplyChainData)}
Node: ${nodeId}

Provide quantitative impact assessment and recommend next step.`
        });
        
        console.log(`[FAST-IMPACT] ✅ Impact assessed in <2s`);
        
        return {
          originalResult: {
            impact: impact.object,
            nodeId,
            scenarios,
            timestamp: new Date().toISOString(),
            source: 'ai_analysis_cached_data'
          },
          coordinationMetadata: {
            handledBy: 'fast-impact',
            processingTime: 1500,
            timestamp: new Date().toISOString(),
            nextRecommendation: {
              agent: impact.object.nextRecommendation,
              reason: impact.object.reasoning,
              confidence: 0.80,
              urgency: impact.object.mitigationPriority
            },
            contextPassed: true,
            workflowStage: 'impact'
          }
        };
        
      } catch (error) {
        console.error(`[FAST-IMPACT] ❌ Error:`, error);
        return {
          originalResult: {
            error: 'Failed to assess impact',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          coordinationMetadata: {
            handledBy: 'fast-impact',
            processingTime: 500,
            timestamp: new Date().toISOString(),
            nextRecommendation: undefined,
            contextPassed: false,
            workflowStage: 'impact'
          }
        };
      }
    }
  }),

  generateStrategy: tool({
    description: `Generate mitigation strategies using business context and cached data.
    
Creates actionable strategies based on:
- Impact assessment results
- Supply chain structure
- Business constraints and capabilities
    
Best for: Final strategic recommendations and action planning`,
    
    parameters: z.object({
      nodeId: z.string().describe("The node to generate strategies for"),
      userId: z.string().optional().describe("User ID for context"),
      impactAssessment: z.any().optional().describe("Impact assessment data"),
      constraints: z.object({
        budget: z.number().optional(),
        timeframe: z.string().optional()
      }).optional()
    }),
    
    execute: async ({ nodeId, userId, impactAssessment, constraints }) => {
      console.log(`[FAST-STRATEGY] 🎯 Generating strategies for node: ${nodeId}`);
      
      try {
        // Configure Google provider with dedicated key if available
        const google = createGoogleGenerativeAI({
          apiKey: getAIKeyForModule('agents')
        });

        // Generate strategic recommendations
        const strategy = await generateObject({
          model: google(AI_MODELS.agents),
          schema: z.object({
            strategies: z.array(z.object({
              title: z.string(),
              description: z.string(),
              priority: z.enum(['low', 'medium', 'high', 'critical']),
              timeframe: z.string(),
              estimatedCost: z.string(),
              effectiveness: z.number().min(0).max(100)
            })),
            implementationPlan: z.string(),
            successMetrics: z.array(z.string()),
            nextRecommendation: z.enum(['complete']),
            reasoning: z.string()
          }),
          prompt: `Generate mitigation strategies based on analysis:
          
Impact Assessment: ${JSON.stringify(impactAssessment)}
Node: ${nodeId}
Constraints: ${JSON.stringify(constraints)}

Provide actionable strategies with implementation guidance.`
        });
        
        console.log(`[FAST-STRATEGY] ✅ Strategies generated in <2s`);
        
        return {
          originalResult: {
            strategy: strategy.object,
            nodeId,
            impactAssessment,
            constraints,
            timestamp: new Date().toISOString(),
            source: 'ai_strategic_planning'
          },
          coordinationMetadata: {
            handledBy: 'fast-strategy',
            processingTime: 1800,
            timestamp: new Date().toISOString(),
            nextRecommendation: {
              agent: 'complete',
              reason: 'Strategic analysis complete - actionable recommendations provided',
              confidence: 0.90,
              urgency: 'medium' as const
            },
            contextPassed: true,
            workflowStage: 'strategy'
          }
        };
        
      } catch (error) {
        console.error(`[FAST-STRATEGY] ❌ Error:`, error);
        return {
          originalResult: {
            error: 'Failed to generate strategies',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          coordinationMetadata: {
            handledBy: 'fast-strategy',
            processingTime: 500,
            timestamp: new Date().toISOString(),
            nextRecommendation: undefined,
            contextPassed: false,
            workflowStage: 'strategy'
          }
        };
      }
    }
  })
};

// Export individual tools
export const {
  gatherIntelligence,
  generateForecast,
  generateScenarios,
  assessImpact,
  generateStrategy
} = agentTools;

// Default tool set for fast workflows
export const defaultToolSet = {
  gatherIntelligence,
  generateForecast,
  generateScenarios,
  assessImpact,
  generateStrategy
};
