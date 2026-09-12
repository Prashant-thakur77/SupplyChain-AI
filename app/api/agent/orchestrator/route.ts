import '@/lib/zod-patch';
import { NextRequest, NextResponse } from 'next/server';
import { LlmAgent, FunctionTool, Gemini, InMemoryRunner, stringifyContent } from '@google/adk';
import { z } from 'zod';
import { agentAudit } from '@/lib/audit-logger';
import { getAIKeyForModule, AI_MODELS } from '../../../../lib/ai-config';
import { withTrace } from '../../../../lib/adk/core/trace';
import { SessionManager } from '../../../../lib/adk/core/session';

// Import coordination utilities and types (pure helpers — no @iqai dependency)
import { agentTools } from '../../coordination/agent-tools';
import {
  calculateWorkflowEfficiency,
  type OrchestratorRequest,
  type OrchestratorResponse,
  type CoordinationStep
} from '../../coordination/types';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// FunctionTool wrappers — delegate to the existing coordination tool execute
// functions while recording CoordinationStep logs for the response payload.
// ---------------------------------------------------------------------------

function buildTools(coordinationLogs: CoordinationStep[]) {
  /** Helper: wrap an existing Vercel-AI `tool().execute` in an ADK FunctionTool */
  function wrap(
    name: string,
    description: string,
    parameters: z.ZodObject<any>,
    executeFn: (args: any, opts?: any) => Promise<any> | any,
    agentLabel: string
  ): FunctionTool {
    return new FunctionTool({
      name,
      description,
      parameters,
      execute: async (args: any) => {
        const start = Date.now();
        try {
          const result = await executeFn(args, {} as any);
          coordinationLogs.push({
            stepNumber: coordinationLogs.length + 1,
            agent: agentLabel,
            action: `Executed ${name}`,
            reasoning: `Orchestrator invoked ${name} for supply-chain analysis.`,
            input: args,
            output: result,
            processingTime: Date.now() - start,
          });
          return typeof result === 'string' ? { text: result } : result;
        } catch (e: any) {
          console.error(`[ORCHESTRATOR] Tool ${name} error:`, e);
          coordinationLogs.push({
            stepNumber: coordinationLogs.length + 1,
            agent: agentLabel,
            action: `Failed ${name}`,
            reasoning: e.message,
            input: args,
            output: { error: e.message },
            processingTime: Date.now() - start,
          });
          return { error: e.message };
        }
      }
    });
  }

  return [
    wrap(
      'gatherIntelligence',
      'Gather real-time intelligence and telemetry data from cached database. Use this first to understand the current state of disruptions, weather impacts, and market conditions.',
      z.object({
        nodeId: z.string().describe('Target node ID or "all"'),
        userId: z.string().optional().describe('User ID'),
        focusArea: z.enum(['weather', 'disruptions', 'market', 'all']).optional().describe('Specific intelligence focus')
      }),
      agentTools.gatherIntelligence.execute,
      'intelligence'
    ),

    wrap(
      'generateForecast',
      'Predictive analytics and trend analysis using cached forecast data. Best after gathering intelligence.',
      z.object({
        nodeId: z.string().describe('The supply chain node to forecast for'),
        userId: z.string().optional().describe('User ID'),
        timeHorizon: z.enum(['7d', '30d', '90d']).optional().describe('Forecast time horizon')
      }),
      agentTools.generateForecast.execute,
      'forecast'
    ),

    wrap(
      'generateScenarios',
      'What-if modeling and simulation of disruption scenarios. Best after intelligence and/or forecast.',
      z.object({
        nodeId: z.string().describe('The node to create scenarios for'),
        userId: z.string().optional().describe('User ID'),
        disruptionType: z.enum(['weather', 'geopolitical', 'economic', 'operational', 'all']).optional().describe('Type of disruption to simulate')
      }),
      agentTools.generateScenarios.execute,
      'scenario'
    ),

    wrap(
      'assessImpact',
      'Quantitative risk assessment and impact scoring. Best after scenarios are generated.',
      z.object({
        nodeId: z.string().describe('The node to assess impact for'),
        userId: z.string().optional().describe('User ID'),
        scenarios: z.any().optional().describe('Scenario data from generateScenarios')
      }),
      agentTools.assessImpact.execute,
      'impact'
    ),

    wrap(
      'generateStrategy',
      'Mitigation planning and strategic action recommendations. Best as the final step after impact assessment.',
      z.object({
        nodeId: z.string().describe('The node to generate strategies for'),
        userId: z.string().optional().describe('User ID'),
        impactAssessment: z.any().optional().describe('Impact data from assessImpact'),
        constraints: z.object({
          budget: z.number().optional(),
          timeframe: z.string().optional()
        }).optional().describe('Business constraints')
      }),
      agentTools.generateStrategy.execute,
      'strategy'
    ),
  ];
}

// ---------------------------------------------------------------------------
// POST handler — the single entry-point for multi-agent orchestration
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: OrchestratorRequest = await request.json();
    const { query, nodeId, preferences = {} } = body;
    const userId = (body as any).userId || null;
    const supplyChainId = body.supplyChainId || undefined;

    if (!query) {
      return NextResponse.json({ error: 'Query is required for orchestration' }, { status: 400 });
    }

    console.log(`[ADK-ORCHESTRATOR] 🎯 Starting multi-agent workflow for query: "${query}"`);

    // ---- Session state (persisted in Supabase) ----------------------------
    const sessionId = `orch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    if (supplyChainId) {
      const initialState = SessionManager.createInitialState({
        supplyChainId,
        userId: userId || 'anonymous',
        query,
        nodeId: nodeId || undefined
      });
      await SessionManager.saveSession(sessionId, initialState);
    }

    // ---- Build ADK tools --------------------------------------------------
    const coordinationLogs: CoordinationStep[] = [];
    const tools = buildTools(coordinationLogs);

    // ---- Compose prompt ---------------------------------------------------
    const prompt = `Supply Chain Analysis Request: "${query}"
${nodeId ? `Target Node ID: ${nodeId}` : 'Target: All nodes in supply chain network'}
${userId ? `User ID: ${userId}` : ''}

Coordinate the appropriate specialized agent tools to provide comprehensive supply chain intelligence.
Build insights progressively — gather intelligence first, then forecast, then scenarios, impact, and strategy as needed.
Format the final analysis as structured markdown with clear headings, bullet points, and actionable business insights.`;

    // ---- Execute via ADK --------------------------------------------------
    const traceResult = await withTrace(`orchestrator-${sessionId}`, 'MasterOrchestrator', async () => {
      const orchestrator = new LlmAgent({
        name: 'master_orchestrator',
        description: 'SupplyChain AI Master Orchestrator — advanced AI coordination system',
        instruction: `You are the SupplyChain AI Master Orchestrator — an advanced AI coordination system for supply chain resilience.

RULES:
1. Always start by calling gatherIntelligence to understand the current state.
2. Based on intelligence results, decide whether to call generateForecast, generateScenarios, or both.
3. After scenarios are generated, call assessImpact with the scenario data.
4. Finally, call generateStrategy with the impact assessment to create actionable recommendations.
5. Synthesise ALL tool results into a cohesive, structured markdown report.
6. Never skip the final synthesis — the user expects a complete analysis.`,
        model: new Gemini({
          model: AI_MODELS.agents,
          apiKey: getAIKeyForModule('orchestrator')
        }),
        tools,
      });

      const runner = new InMemoryRunner({ appName: 'supplychain-orchestrator', agent: orchestrator });

      let finalContent = '';
      for await (const event of runner.runEphemeral({
        userId: userId || 'system',
        newMessage: { role: 'user', parts: [{ text: prompt }] },
      })) {
        const text = stringifyContent(event);
        if (text) finalContent += text;
      }

      return { success: true, data: finalContent };
    });

    if (!traceResult.success) throw new Error(traceResult.error);

    const responseText = traceResult.data as string;

    // ---- Persist final session state --------------------------------------
    if (supplyChainId) {
      await SessionManager.saveSession(sessionId, {
        workflowStage: 'complete',
        agentsInvoked: [...new Set(coordinationLogs.map(l => l.agent))],
      }).catch(err => console.warn('[ADK-ORCHESTRATOR] Session save failed (non-fatal):', err));
    }

    // ---- Build response ---------------------------------------------------
    const totalTime = Date.now() - startTime;
    const agentsInvolved = [...new Set(coordinationLogs.map(log => log.agent))];
    const workflowEfficiency = calculateWorkflowEfficiency(coordinationLogs);

    const response: OrchestratorResponse = {
      analysis: responseText,
      coordinationLogs,
      totalSteps: coordinationLogs.length,
      agentsInvolved,
      processingTime: totalTime,
      workflowEfficiency,
      finalRecommendations: extractRecommendationsFromText(responseText),
    };

    console.log(`[ADK-ORCHESTRATOR] ✅ Workflow complete in ${totalTime}ms | Agents: ${agentsInvolved.join(', ')} | Session: ${sessionId}`);

    agentAudit('Orchestrator', userId || 'system').success(`Orchestration complete: "${query.substring(0, 80)}" — ${agentsInvolved.length} agents involved in ${totalTime}ms`, { agentsInvolved, totalSteps: coordinationLogs.length, processingTime: totalTime });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`[ADK-ORCHESTRATOR] ❌ Error:`, error);
    return NextResponse.json({
      error: 'Failed to orchestrate multi-agent analysis',
      details: error.message,
      processingTime: Date.now() - startTime,
    }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractRecommendationsFromText(text: string): string[] {
  const recommendations: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.match(/^\d+\./) ||
      trimmed.startsWith('•') ||
      trimmed.startsWith('-') ||
      trimmed.toLowerCase().includes('recommend')
    ) {
      if (trimmed.length > 10 && trimmed.length < 200) {
        recommendations.push(trimmed);
      }
    }
  }
  return recommendations.slice(0, 5);
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    orchestrator: 'operational (@google/adk)',
    version: '3.0',
    timestamp: new Date().toISOString(),
  });
}
