import '@/lib/zod-patch';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getRedisClient } from '@/lib/clients/redis';

import { supabaseServer } from '@/lib/supabase/server';
import { agentAudit } from '@/lib/audit-logger';
import { getAIKeyForModule, AI_MODELS } from '../../../../lib/ai-config';
import { logger } from '../../../../lib/monitoring';

import { LlmAgent, FunctionTool, Gemini, InMemoryRunner, stringifyContent } from "@google/adk";
import { withTrace } from '../../../../lib/adk/core/trace';

// ─── Input validation ────────────────────────────────────────────────────────
const ForecastRequestSchema = z.object({
  supplyChainId: z.string().uuid(),
  nodeId: z.string().uuid().optional(),
  forecastHorizon: z.number().int().positive().default(30),
  includeWeather: z.boolean().default(true),
  includeMarketData: z.boolean().default(true),
  options: z.object({
    forceRefresh: z.boolean().default(false),
    detailLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  }).optional(),
});

/**
 * Forecast Data Tool for ADK (using FunctionTool)
 */
const forecastDataTool = new FunctionTool({
  name: "get_forecast_data",
  description: "Fetch historical forecasts and supply chain intelligence for a specific supply chain or node.",
  parameters: z.object({
    nodeId: z.string().optional(),
    supplyChainId: z.string()
  }),
  execute: async (args) => {
    try {
      const supabase = supabaseServer;
      
      let forecastQuery = supabase
        .from('forecasts')
        .select('*')
        .eq('supply_chain_id', args.supplyChainId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (args.nodeId) forecastQuery = forecastQuery.eq('node_id', args.nodeId);
      const { data: forecasts } = await forecastQuery;
      
      let intelQuery = supabase
        .from('supply_chain_intel')
        .select('*')
        .eq('supply_chain_id', args.supplyChainId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (args.nodeId) intelQuery = intelQuery.eq('node_id', args.nodeId);
      const { data: intel } = await intelQuery;
      
      return {
        historicalForecasts: forecasts || [],
        recentIntelligence: intel || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ForecastDataTool] Error fetching data:', error);
      return { error: "Failed to fetch context data" };
    }
  }
});

class ProductionForecastAgent {
  async generateForecast(params: any, supplyChain: any, nodeCount: number, edgeCount: number, uniqueTypes: string, nodeNames: string, intelSummary: string) {
    const traceId = `forecast-adk-${Date.now()}`;
    logger.info({ message: 'Generating forecast via ADK', supplyChainId: params.supplyChainId, traceId });

    const prompt = `You are a supply chain risk intelligence analyst specializing in predictive threat modeling.

SUPPLY CHAIN: ${supplyChain.name || 'Unknown'}
DESCRIPTION: ${supplyChain.description || 'No description provided'}
NETWORK TOPOLOGY:
- Total Nodes: ${nodeCount}
- Total Connections: ${edgeCount}
- Node Types: ${uniqueTypes}
- Node Names: ${nodeNames}
FORECAST HORIZON: ${params.forecastHorizon} days
RECENT INTELLIGENCE: ${intelSummary}

REQUIREMENTS:
- Generate 4–6 disruption forecasts. Each forecast must satisfy all of the following:
1. Geography: tied to a country or region where at least one node in the network is located. Do not forecast events for regions absent from the node list.
2. Event type diversity: cover distinct categories (natural disaster, geopolitical, labor action, infrastructure failure, cyber threat). Do not repeat the same event type more than twice.
3. Severity (1–5): calibrate against real-world precedent (1=minor delay, 5=catastrophic).
4. Probability (0.00–1.00): ground the value in known regional base rates (e.g., typhoon probability for SE Asia is high). Do not assign > 0.85 unless very high historical frequency.
5. Duration: based on comparable historical incidents.
- Use the actual node names (${nodeNames}) in affectedNode fields where possible.
- Return the exact JSON schema requested.
- Each scenario must be unique and cover different risk categories
- Include at least one scenario affecting a key hub node (high-connectivity node)
- Make descriptions specific and quantified (e.g., "78% probability", "40% reduction in capacity")
- Consider geographic, logistic, and operational risks for this network

Generate realistic, actionable forecast scenarios that a supply chain manager would find genuinely useful.`;

    const result = await withTrace(`trace-${traceId}`, 'ForecastAgent', async () => {
      const agent = new LlmAgent({
        name: "forecast_agent",
        description: "High-fidelity forecasting agent",
        instruction: "You are an expert forecaster. Analyze historic patterns, contextual intelligence, and market variables to predict supply chain trends.",
        model: new Gemini({ 
          model: AI_MODELS.agents, 
          apiKey: getAIKeyForModule('agents') 
        }),
        outputSchema: ForecastOutputSchema,
        tools: [forecastDataTool]
      });

      const runner = new InMemoryRunner({ appName: 'forecast', agent });
      
      let finalContent = "";
      for await (const event of runner.runEphemeral({
        userId: 'system',
        newMessage: { role: 'user', parts: [{ text: prompt }] }
      })) {
        const text = stringifyContent(event);
        if (text) {
          finalContent += text;
        }
      }

      return { success: true, data: finalContent };
    });

    if (!result.success) {
      console.error('[FORECAST-AGENT] ❌ Error:', result.error);
      throw new Error(result.error);
    }

    // Parse the JSON string from ADK
    const jsonMatch = (result.data as string).match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse forecast JSON");
    }

    return JSON.parse(jsonMatch[0]);
  }
}

/**
 * POST /api/agent/forecast
 */
// ─── Scenario schema (must match what forecast-scenarios/route.ts reads) ──────
const ScenarioSchema = z.object({
  scenarioName: z.string().describe('Short, specific name of the disruption scenario'),
  scenarioType: z.enum(['disruption', 'natural', 'economic', 'political', 'operational'])
    .describe('Category of disruption'),
  description: z.string().describe('2–3 sentence description of the scenario with a probability estimate and reasoning based on the supply chain structure'),
  disruptionSeverity: z.number().int().min(10).max(95).describe('Severity 0–100'),
  disruptionDuration: z.number().int().min(3).max(90).describe('Duration in days'),
  affectedNode: z.string().describe('Name of the primary node affected (use actual node names if available)'),
  monteCarloRuns: z.number().int().default(1000),
  distributionType: z.enum(['normal', 'log-normal', 'uniform']).default('normal'),
  cascadeEnabled: z.boolean().describe('True if this scenario likely cascades to downstream nodes'),
  failureThreshold: z.number().min(10).max(80).describe('% threshold at which the network is considered failed'),
  bufferPercent: z.number().min(5).max(30).describe('Recommended buffer inventory percentage'),
  alternateRouting: z.boolean().describe('True if alternate routes exist for this scenario'),
});

const ForecastOutputSchema = z.object({
  scenarios: z.array(ScenarioSchema).min(2).max(4)
    .describe('2–4 high-impact forecast scenarios specific to this supply chain'),
  overallRiskScore: z.number().min(0).max(100).describe('Overall risk score for the supply chain right now'),
  confidenceScore: z.number().min(0).max(1).describe('Confidence in this forecast (0–1)'),
  forecastSummary: z.string().describe('Executive summary of the forecast in 2–3 sentences'),
});

// ─── POST /api/agent/forecast ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const traceId = `forecast-${Date.now()}`;
  const startTime = Date.now();

  try {
    const requestBody = await request.json();
    const validationResult = ForecastRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const params = validationResult.data;
    logger.info({ message: 'Starting AI forecast generation', supplyChainId: params.supplyChainId, traceId });

    const audit = agentAudit('ForecastAgent', 'system');
    audit.start(`Forecast generation for supply chain ${params.supplyChainId}`);

    // ── 1. Verify supply chain exists ─────────────────────────────────────────
    const { data: supplyChain, error: supplyChainError } = await supabaseServer
      .from('supply_chains')
      .select('*')
      .eq('supply_chain_id', params.supplyChainId)
      .single();

    if (supplyChainError || !supplyChain) {
      return NextResponse.json(
        { error: 'Supply chain not found', details: supplyChainError?.message },
        { status: 404 }
      );
    }

    // ── 2. Fetch supply chain topology ────────────────────────────────────────
    const [{ data: nodes }, { data: edges }] = await Promise.all([
      supabaseServer.from('nodes').select('node_id, name, type, description, data').eq('supply_chain_id', params.supplyChainId),
      supabaseServer.from('edges').select('edge_id, from_node_id, to_node_id, data').eq('supply_chain_id', params.supplyChainId),
    ]);

    const nodeCount = nodes?.length ?? 0;
    const edgeCount = edges?.length ?? 0;
    const nodeNames = nodes?.map((n: any) => n.name || n.node_id).join(', ') || 'Unknown nodes';
    const nodeTypes = nodes?.map((n: any) => n.type).filter(Boolean) || [];
    const uniqueTypes = [...new Set(nodeTypes)].join(', ') || 'mixed';

    // ── 3. Check for recent intel from supply_chain_intel table ────────────────
    const { data: intel } = await supabaseServer
      .from('supply_chain_intel')
      .select('intelligence_data, news, risk_score')
      .eq('supply_chain_id', params.supplyChainId)
      .order('created_at', { ascending: false })
      .limit(3);

    const intelSummary = intel && intel.length > 0
      ? `Recent intelligence available for ${intel.length} node(s) with risk scores: ${intel.map((i: any) => i.risk_score).join(', ')}`
      : 'No recent intelligence available for this supply chain.';

    let forecastOutput;
    try {
      const agent = new ProductionForecastAgent();
      forecastOutput = await agent.generateForecast(params, supplyChain, nodeCount, edgeCount, uniqueTypes, nodeNames, intelSummary);
    } catch (aiError: any) {
      logger.error({ message: 'AI generation failed', error: aiError.message, traceId });
      return NextResponse.json(
        { error: 'AI forecast generation failed', message: aiError.message, traceId },
        { status: 500 }
      );
    }

    // ── 5. Add start/end dates to each scenario ───────────────────────────────
    const now = Date.now();
    const scenariosWithDates = forecastOutput.scenarios.map((scenario: any, i: number) => ({
      ...scenario,
      startDate: new Date(now + (i + 1) * 2 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now + (i + 1) * 2 * 24 * 60 * 60 * 1000 + scenario.disruptionDuration * 24 * 60 * 60 * 1000).toISOString(),
      randomSeed: `forecast-ai-${params.supplyChainId.substring(0, 8)}-${i}`,
    }));

    // ── 6. Save to Supabase forecasts table ───────────────────────────────────
    const forecastRecord = {
      supply_chain_id: params.supplyChainId,
      node_id: params.nodeId || null,
      forecast_data: {
        summary: forecastOutput.forecastSummary,
        overallRiskScore: forecastOutput.overallRiskScore,
        generatedAt: new Date().toISOString(),
        nodeCount,
        edgeCount,
      } as any,
      scenario_json: scenariosWithDates as any,
      confidence_score: forecastOutput.confidenceScore,
      risk_score: forecastOutput.overallRiskScore,
      forecast_period: params.forecastHorizon,
      forecast_start_date: new Date().toISOString(),
      forecast_end_date: new Date(now + params.forecastHorizon * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: savedForecast, error: saveError } = await supabaseServer
      .from('forecasts')
      .insert(forecastRecord)
      .select('forecast_id')
      .single();

    if (saveError) {
      logger.error({ message: 'Failed to save forecast to Supabase', error: saveError.message, traceId });
      // Still return the generated scenarios even if save fails
    } else {
      logger.info({ message: 'Forecast saved to Supabase', forecastId: savedForecast?.forecast_id, traceId });
    }

    const processingTime = Date.now() - startTime;
    logger.info({ message: 'Forecast generation completed', processingTimeMs: processingTime, supplyChainId: params.supplyChainId, traceId });

    audit.success(`Forecast generated for supply chain ${params.supplyChainId}`, { forecastHorizon: params.forecastHorizon, riskScore: forecastOutput.overallRiskScore, processingTime });

    return NextResponse.json({
      success: true,
      forecast: {
        summary: forecastOutput.forecastSummary,
        overallRiskScore: forecastOutput.overallRiskScore,
        confidenceScore: forecastOutput.confidenceScore,
        scenarios: scenariosWithDates,
      },
      metadata: {
        processingTime,
        generated: new Date().toISOString(),
        supplyChainId: params.supplyChainId,
        nodeId: params.nodeId,
        forecastHorizon: params.forecastHorizon,
        savedToDatabase: !saveError,
        forecastId: savedForecast?.forecast_id,
      },
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    logger.error({ message: 'Error generating forecast', error: error.message, processingTimeMs: processingTime, traceId });
    agentAudit('ForecastAgent', 'system').error(error.message);
    return NextResponse.json(
      { error: 'Error generating forecast', message: error.message, traceId },
      { status: 500 }
    );
  }
}

// ─── GET /api/agent/forecast — retrieve stored forecasts ─────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supply_chain_id = searchParams.get('supply_chain_id');
    const node_id = searchParams.get('node_id');
    const force_refresh = searchParams.get('force_refresh') === 'true';

    if (!supply_chain_id) {
      return NextResponse.json({ error: 'Missing supply_chain_id parameter' }, { status: 400 });
    }

    // ── 1. Check Redis cache first (skip if force_refresh) ───────────────────
    if (!force_refresh && node_id) {
      try {
        const cachedForecast = await getRedisClient().get(`forecast:${node_id}`);
        if (cachedForecast) {
          logger.info({ message: 'Serving forecast from Redis cache', nodeId: node_id });
          return NextResponse.json(cachedForecast);
        }
      } catch (cacheErr) {
        // Non-critical — fall through to DB
        logger.warn?.({ message: 'Redis cache read failed, falling back to DB', error: cacheErr });
      }
    }

    // ── 2. Hit Supabase ──────────────────────────────────────────────────────
    let query = supabaseServer
      .from('forecasts')
      .select('*')
      .eq('supply_chain_id', supply_chain_id)
      .order('created_at', { ascending: false });

    if (node_id) query = query.eq('node_id', node_id);

    const { data: forecasts, error } = await query.limit(node_id ? 1 : 20);

    if (error) {
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    // ── 3. Write single-node result back to Redis (30 min TTL) ───────────────
    if (node_id && forecasts && forecasts.length > 0) {
      try {
        await getRedisClient().setex(`forecast:${node_id}`, 1800, forecasts[0]);
      } catch (cacheErr) {
        // Non-critical
        console.warn('Redis cache write failed:', cacheErr);
      }
    }

    return NextResponse.json({
      message: forecasts && forecasts.length > 0
        ? 'Forecasts retrieved successfully'
        : 'No forecasts found for the specified criteria',
      count: forecasts?.length ?? 0,
      forecasts: forecasts ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve forecasts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
