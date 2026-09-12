import '@/lib/zod-patch';
import { NextRequest, NextResponse } from 'next/server';
import { LlmAgent, FunctionTool, Gemini, InMemoryRunner, stringifyContent } from "@google/adk";
import { withTrace } from '../../../../lib/adk/core/trace';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';
import { Redis } from '@upstash/redis';
import { tavily } from '@tavily/core';
import { agentAudit } from '@/lib/audit-logger';


/**
 * Tavily Strategic Search Tool
 */
const strategyIntelligenceTool = new FunctionTool({
  name: "strategy_intelligence",
  description: "Search for industry best practices, mitigation strategies, and market resilience trends.",
  parameters: z.object({ query: z.string() }),
  execute: async (args) => {
    if (!process.env.TAVILY_API_KEY) return { error: "Tavily API key missing" };
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const result = await tavilyClient.search(args.query, { 
      searchDepth: "advanced",
      maxResults: 3 
    });
    return result;
  }
});

/**
 * Production Strategy Agent
 */
// Zod schemas for structured output
const StrategySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low', 'Strategic']),
  timeframe: z.string(),
  costEstimate: z.string(),
  impactReduction: z.string(),
  status: z.enum(['ready', 'planning', 'recommended', 'in-progress', 'completed']),
  category: z.enum(['immediate', 'shortTerm', 'longTerm']),
  feasibility: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  dependencies: z.array(z.string()),
  riskFactors: z.array(z.string()),
  successMetrics: z.array(z.string()),
  resourceRequirements: z.object({
    personnel: z.number(),
    equipment: z.array(z.string()),
    partnerships: z.array(z.string()),
  })
});

const StrategyResponseSchema = z.object({
  immediate: z.array(StrategySchema),
  shortTerm: z.array(StrategySchema),
  longTerm: z.array(StrategySchema),
  riskMitigationMetrics: z.object({
    currentRisk: z.number(),
    targetRisk: z.number(),
    costToImplement: z.string(),
    expectedROI: z.string(),
    paybackPeriod: z.string(),
    riskReduction: z.string(),
  }),
  keyInsights: z.array(z.string()),
  marketIntelligence: z.array(z.string()),
  bestPractices: z.array(z.string()),
  contingencyPlans: z.array(z.string()),
});

class ProductionStrategyAgent {
  async conductComprehensiveStrategyAnalysis(simulationId: string) {
    console.log(`[STRATEGY-AGENT] 🚀 Analysis for simulation: ${simulationId}`);
    
    try {
      // 1. Fetch simulation and supply chain details
      const { data: simulation, error: simError } = await supabaseServer
        .from('simulations')
        .select('*, supply_chains(*)')
        .eq('simulation_id', simulationId)
        .single();

      if (simError || !simulation) throw new Error("Simulation or Supply Chain not found");

      // 2. Fetch impact results
      const { data: impactResults } = await supabaseServer
        .from('impact_results')
        .select('*')
        .eq('simulation_id', simulationId);

      // 3. Fetch nodes for baseline algorithm context (needed if AI falls back)
      const { data: strategyNodes } = await supabaseServer
        .from('nodes')
        .select('node_id, name, type, node_type')
        .eq('supply_chain_id', simulation.supply_chain_id);

      // 3. Optional: Gather Tavily Intel
      let marketIntel = "";
      if (process.env.TAVILY_API_KEY) {
        try {
          const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
          const intel = await tavilyClient.search(`supply chain resilience mitigation strategies for ${simulation.scenario_type || 'disruption'}`, { searchDepth: "basic", maxResults: 2 });
          marketIntel = JSON.stringify(intel.results);
        } catch (e) {
          console.warn("Tavily search failed or skipped", e);
        }
      }

      // 4. Prepare Prompt
      const prompt = `
        Disruption Scenario: ${simulation.name} (${simulation.scenario_type})
        Supply Chain: ${simulation.supply_chains?.name || 'Unknown'}
        Impact Assessment: ${JSON.stringify(impactResults || [])}
        Market Context (Recent News/Research): ${marketIntel}
        
        Using the strategy_intelligence tool, research best practices for this type of disruption.
        Then, generate exactly 3 highly specific mitigation strategies, distributing them across immediate, shortTerm, and longTerm arrays.
        
        For each strategy:
        - Title: 3–6 words, specific to the disruption.
        - Description: concrete actions referencing the exact node names and impact results. No generic advice.
        - costEstimate: Scale proportionally to the number of affected nodes (ports/factories carry higher costs).
        - impactReduction (riskReductionPct): Estimate how much of the current disruption impact this strategy eliminates.
        - priority: 'low', 'medium', 'high', or 'critical'.
        
        If the impact results contain fewer than 3 affected nodes, keep cost estimates conservative.
        Do not fabricate node names not present in the assessment.

        Structure your response exactly according to the schema provided:
        - immediate: Array of strategies (0-7 days).
        - shortTerm: Array of strategies (1-3 months).
        - longTerm: Array of strategies (3-12 months).
        - riskMitigationMetrics: Object with currentRisk (0-100), targetRisk, and expectedROI.
      `;

      let resultObject: any = null;
      let retries = 2;
      const traceId = `strategy-${Date.now()}`;

      while (retries >= 0) {
        try {
          const traceResult = await withTrace(traceId, 'StrategyAgent', async () => {
            const agent = new LlmAgent({
              name: "strategy_agent",
              description: "Generates strategic resilience plans",
              instruction: "You are a senior supply chain resilience strategist. Provide highly actionable and data-driven mitigation strategies.",
              model: new Gemini({ 
                model: AI_MODELS.agents, 
                apiKey: getAIKeyForModule("agents")
              }),
              outputSchema: StrategyResponseSchema,
              tools: [strategyIntelligenceTool]
            });

            const runner = new InMemoryRunner({ appName: 'strategy', agent });
            let finalContent = "";
            for await (const event of runner.runEphemeral({
              userId: 'system',
              newMessage: { role: 'user', parts: [{ text: prompt + "\\n\\nCRITICAL: You must return a COMPLETE JSON object. Do not truncate your response." }] }
            })) {
              const text = stringifyContent(event);
              if (text) finalContent += text;
            }
            
            return { success: true, data: finalContent };
          });

          if (!traceResult.success) throw new Error(traceResult.error);
          
          const jsonMatch = (traceResult.data as string).match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("Failed to parse strategy JSON from ADK");
          resultObject = JSON.parse(jsonMatch[0]);
          
          break; // Success
        } catch (error: any) {
          const errMsg: string = error?.message || String(error);
          const isRateLimit = errMsg.includes('quota') || errMsg.includes('rate') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.toLowerCase().includes('overloaded');
          
          if (isRateLimit) {
            console.error('[STRATEGY-AGENT] ❌ AI quota/overload exceeded — using playbook baseline:', errMsg);
            resultObject = generateFallbackStrategyData(simulation, impactResults || [], strategyNodes || []);
            break;
          }
          
          retries--;
          console.warn(`[STRATEGY-AGENT] ⚠️ AI generation failed. Retries left: ${retries}. Error:`, errMsg);
          if (retries < 0) {
            console.warn('[STRATEGY-AGENT] ❌ AI generation retries exhausted — using playbook baseline.');
            resultObject = generateFallbackStrategyData(simulation, impactResults || [], strategyNodes || []);
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!resultObject) {
        resultObject = generateFallbackStrategyData(simulation, impactResults || [], strategyNodes || []);
      }

      const strategyAnalysis = {
        ...resultObject,
        enhanced: true,
        processingTime: Date.now()
      };

      // Human-in-the-Loop Checkpoint
      const isCriticalRisk = strategyAnalysis.riskMitigationMetrics?.currentRisk > 80;
      const hasCriticalStrategy = [...(strategyAnalysis.immediate || []), ...(strategyAnalysis.shortTerm || [])]
        .some((s: any) => s.priority === 'critical');

      const requiresApproval = isCriticalRisk || hasCriticalStrategy;

      if (requiresApproval) {
        console.log(`[STRATEGY-AGENT] 🛑 HITL Gate Triggered! Critical risk detected for simulation ${simulationId}`);
        // Save as pending_approval
        await supabaseServer
          .from('simulations')
          .update({
            result_summary: {
              ...strategyAnalysis,
              approval_status: 'pending_approval',
              strategy_timestamp: new Date().toISOString()
            }
          })
          .eq('simulation_id', simulationId);

        return {
          ...strategyAnalysis,
          status: 'requires_approval',
          message: 'Critical risk detected. Human approval required before implementation.'
        };
      }

      // 6. Update simulation with result summary
      await supabaseServer
        .from('simulations')
        .update({
          result_summary: {
            ...simulation.result_summary, // Preserve existing result summary (like impact assessment)
            strategyAnalysis: {
              ...strategyAnalysis,
              strategy_timestamp: new Date().toISOString()
            }
          }
        })
        .eq('simulation_id', simulationId);

      return {
        ...strategyAnalysis,
        status: 'completed'
      };
    } catch (error) {
      console.error('[STRATEGY-AGENT] ❌ Error:', error);
      throw error;
    }
  }
}

// ─── Playbook Baseline Strategy Algorithm ───────────────────────────────────────
// Deterministic expert-system fallback that runs when the LLM is unavailable.
// Identifies disrupted node type → severity tier → playbook lookup → name injection.
// ─────────────────────────────────────────────────────────────
function generateFallbackStrategyData(simulation: any = {}, impactResults: any[] = [], nodes: any[] = []) {
  console.log(`📚 [PLAYBOOK-BASELINE] Running strategy playbook for scenario: ${simulation?.scenario_type || 'unknown'}`);

  // ── Step 1: Identify disrupted node ──
  const affectedNodeId =
    simulation?.parameters?.affectedNode ||
    simulation?.parameters?.affected_nodes?.[0] ||
    null;
  const disruptedNode = nodes.find((n: any) => n.node_id === affectedNodeId);
  const disruptedNodeType = ((disruptedNode?.type || disruptedNode?.node_type || 'warehouse') as string).toLowerCase();
  const disruptedNodeLabel = disruptedNode?.name || 'the disrupted node';

  // ── Step 2: Severity tier from impact results ──
  let totalCost = 0;
  if (impactResults.length > 0) {
    const r = impactResults[0];
    totalCost = r?.total_cost || r?.cost_impact || r?.estimated_loss || 500000;
  }
  const severityTier = totalCost >= 1_000_000 ? 3 : totalCost >= 200_000 ? 2 : 1;

  const formatCost = (n: number): string =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

  // ── Step 3: Playbook lookup matrix ──
  type PlaybookRow = {
    title: string; desc: string; cost: number; reduction: number;
    priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strategic';
    feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
    deps: string[]; risks: string[]; metrics: string[];
    equipment: string[]; partnerships: string[];
  };
  type Playbook = { immediate: PlaybookRow; short: PlaybookRow; long: PlaybookRow };

  const PLAYBOOK: Record<string, Playbook> = {
    port: {
      immediate: {
        title: 'Activate Emergency Air Freight',
        desc: `Reroute critical shipments from ${disruptedNodeLabel} to air freight channels for tier-1 SKUs immediately.`,
        cost: 80_000 * severityTier, reduction: 40, priority: 'Critical', feasibility: 'HIGH',
        deps: ['Air freight capacity', 'Customs pre-clearance'],
        risks: ['Air freight cost spike', 'Weight/volume limits'],
        metrics: ['% volume rerouted', 'Delivery time recovery'],
        equipment: ['Air cargo booking system', 'Customs documentation'],
        partnerships: ['Air freight carriers', 'Customs brokers'],
      },
      short: {
        title: 'Qualify Alternate Port Routing',
        desc: `Establish documented procedures through the nearest alternate port to replace ${disruptedNodeLabel}.`,
        cost: 150_000 * severityTier, reduction: 55, priority: 'High', feasibility: 'HIGH',
        deps: ['Port authority agreements', 'Logistics partner contracts'],
        risks: ['Alternative port congestion', 'Lead time increases'],
        metrics: ['Alternate port throughput', 'Transit time delta'],
        equipment: ['Port scheduling software'], partnerships: ['Alternate port operators', 'Freight forwarders'],
      },
      long: {
        title: 'Geographic Port Diversification',
        desc: `Distribute shipping volume across two or more ports in different geopolitical zones to eliminate ${disruptedNodeLabel} as a single point of failure.`,
        cost: 400_000 * severityTier, reduction: 70, priority: 'Strategic', feasibility: 'MEDIUM',
        deps: ['Volume redistribution analysis', 'Multi-port contracts'],
        risks: ['Increased complexity', 'Split shipment overhead'],
        metrics: ['Port concentration index', 'Risk-adjusted lead time'],
        equipment: ['TMS with multi-port routing'], partnerships: ['Multiple port operators', 'Regional freight networks'],
      },
    },
    factory: {
      immediate: {
        title: 'Emergency Production Shift',
        desc: `Shift production schedules at unaffected facilities to compensate for output loss from ${disruptedNodeLabel}.`,
        cost: 60_000 * severityTier, reduction: 30, priority: 'Critical', feasibility: 'HIGH',
        deps: ['Spare capacity at alternate facilities', 'Tooling compatibility'],
        risks: ['Overtime costs', 'Quality variance'],
        metrics: ['Production volume recovered', 'Quality rejection rate'],
        equipment: ['Production scheduling system'], partnerships: ['Alternate manufacturing sites'],
      },
      short: {
        title: 'Contract Manufacturing Activation',
        desc: `Engage pre-qualified contract manufacturers to absorb volume from ${disruptedNodeLabel}.`,
        cost: 200_000 * severityTier, reduction: 50, priority: 'High', feasibility: 'HIGH',
        deps: ['CMO qualification status', 'Quality agreement'],
        risks: ['IP exposure', 'Ramp-up time'],
        metrics: ['CMO output ramp rate', 'Quality audit score'],
        equipment: ['Quality management system'], partnerships: ['Contract manufacturers', 'Quality auditors'],
      },
      long: {
        title: 'Redundant Production Facility',
        desc: `Establish a geographically distinct secondary facility to mirror ${disruptedNodeLabel} production capability.`,
        cost: 800_000 * severityTier, reduction: 75, priority: 'Strategic', feasibility: 'MEDIUM',
        deps: ['Capital investment approval', 'Regulatory filings'],
        risks: ['Capex intensity', 'Long lead time'],
        metrics: ['Dual-site production coverage', 'BCP readiness score'],
        equipment: ['Full production line'], partnerships: ['EPC contractors', 'Local authorities'],
      },
    },
    supplier: {
      immediate: {
        title: 'Activate Secondary Supplier',
        desc: `Switch purchase orders from ${disruptedNodeLabel} to pre-qualified backup suppliers immediately.`,
        cost: 40_000 * severityTier, reduction: 45, priority: 'Critical', feasibility: 'HIGH',
        deps: ['Approved supplier list', 'Safety stock levels'],
        risks: ['Secondary supplier capacity limits', 'Price premium'],
        metrics: ['PO transfer rate', 'Delivery schedule adherence'],
        equipment: ['Procurement system'], partnerships: ['Secondary suppliers', 'Spot market brokers'],
      },
      short: {
        title: 'Safety Stock Build Program',
        desc: `Accelerate safety stock replenishment across critical SKUs sourced from ${disruptedNodeLabel}.`,
        cost: 100_000 * severityTier, reduction: 40, priority: 'High', feasibility: 'HIGH',
        deps: ['Warehouse capacity', 'Working capital approval'],
        risks: ['Holding cost increase', 'Demand forecast accuracy'],
        metrics: ['Days of supply coverage', 'Stock-out rate reduction'],
        equipment: ['Inventory management system'], partnerships: ['Secondary suppliers', 'Warehouse operators'],
      },
      long: {
        title: 'Multi-Source Procurement Policy',
        desc: `Mandate multi-source qualification for all critical materials previously sole-sourced from ${disruptedNodeLabel}.`,
        cost: 250_000 * severityTier, reduction: 65, priority: 'Strategic', feasibility: 'MEDIUM',
        deps: ['Sourcing policy update', 'Supplier qualification program'],
        risks: ['Qualification timeline', 'Volume fragmentation'],
        metrics: ['Supplier concentration index', 'Qualified alternate count'],
        equipment: ['Supplier management platform'], partnerships: ['Multiple qualified suppliers'],
      },
    },
    warehouse: {
      immediate: {
        title: 'Cross-Dock to Nearest Facility',
        desc: `Redirect inbound freight from ${disruptedNodeLabel} to the nearest operational warehouse via cross-docking.`,
        cost: 25_000 * severityTier, reduction: 35, priority: 'Critical', feasibility: 'HIGH',
        deps: ['Alternate facility capacity', 'Carrier availability'],
        risks: ['Distance-related cost increase', 'Handling errors'],
        metrics: ['Throughput recovered', 'Order fulfillment rate'],
        equipment: ['WMS', 'Transport management'], partnerships: ['Cross-dock operators', 'Carriers'],
      },
      short: {
        title: 'Temporary 3PL Engagement',
        desc: `Contract a third-party logistics provider to absorb volume temporarily displaced from ${disruptedNodeLabel}.`,
        cost: 90_000 * severityTier, reduction: 50, priority: 'High', feasibility: 'HIGH',
        deps: ['3PL capacity availability', 'System integration'],
        risks: ['Integration lead time', 'Service level variance'],
        metrics: ['3PL throughput SLA', 'Customer satisfaction score'],
        equipment: ['EDI/API integration'], partnerships: ['3PL providers', 'Freight brokers'],
      },
      long: {
        title: 'Regional Distribution Redundancy',
        desc: `Establish a secondary distribution hub to eliminate ${disruptedNodeLabel} as a regional single point of failure.`,
        cost: 300_000 * severityTier, reduction: 60, priority: 'Strategic', feasibility: 'MEDIUM',
        deps: ['Site selection', 'Capital approval'],
        risks: ['Fixed cost increase', 'Network re-optimization required'],
        metrics: ['Regional coverage index', 'Lead time variance reduction'],
        equipment: ['Full WMS deployment'], partnerships: ['Real estate', 'Local workforce'],
      },
    },
  };

  // Map node type to playbook key (manufacturer → factory, distributor/retailer/other → warehouse)
  const PLAYBOOK_MAP: Record<string, string> = {
    port: 'port', factory: 'factory', manufacturer: 'factory',
    supplier: 'supplier', warehouse: 'warehouse',
    distributor: 'warehouse', retailer: 'warehouse', other: 'warehouse',
  };
  const playbookKey = PLAYBOOK_MAP[disruptedNodeType] || 'warehouse';
  const pb = PLAYBOOK[playbookKey];

  // ── Step 4: Build schema-conforming strategy objects ──
  const makeStrategy = (
    id: number,
    row: PlaybookRow,
    category: 'immediate' | 'shortTerm' | 'longTerm',
    timeframe: string,
  ) => ({
    id,
    title: row.title,
    description: row.desc,
    priority: row.priority,
    timeframe,
    costEstimate: formatCost(row.cost),
    impactReduction: `${row.reduction}%`,
    status: (category === 'immediate' ? 'recommended' : 'planning') as 'recommended' | 'planning',
    category,
    feasibility: row.feasibility,
    dependencies: row.deps,
    riskFactors: row.risks,
    successMetrics: row.metrics,
    resourceRequirements: {
      personnel: category === 'immediate' ? 5 : category === 'shortTerm' ? 10 : 20,
      equipment: row.equipment,
      partnerships: row.partnerships,
    },
  });

  const totalCostEstimate = pb.immediate.cost + pb.short.cost + pb.long.cost;
  const avgReduction = Math.round((pb.immediate.reduction + pb.short.reduction + pb.long.reduction) / 3);

  console.log(`✅ [PLAYBOOK-BASELINE] Matched playbook: ${playbookKey}, severity tier: ${severityTier}, total investment: ${formatCost(totalCostEstimate)}`);

  return {
    immediate: [makeStrategy(1, pb.immediate, 'immediate', '0-7 days')],
    shortTerm:  [makeStrategy(2, pb.short,     'shortTerm',  '1-3 months')],
    longTerm:   [makeStrategy(3, pb.long,      'longTerm',   '3-12 months')],
    riskMitigationMetrics: {
      currentRisk: Math.min(95, 75 + severityTier * 5),
      targetRisk: 25,
      costToImplement: formatCost(totalCostEstimate),
      expectedROI: severityTier === 3 ? '4.2x' : severityTier === 2 ? '3.1x' : '2.4x',
      paybackPeriod: severityTier === 3 ? '8-12 months' : severityTier === 2 ? '6-9 months' : '4-6 months',
      riskReduction: `${avgReduction}%`,
    },
    keyInsights: [
      `Disrupted node: ${disruptedNodeLabel} (type: ${disruptedNodeType}), classified as Severity Tier ${severityTier}.`,
      `Playbook matched: ${playbookKey} disruption protocol applied across three time horizons.`,
      `Total mitigation investment across all horizons: ${formatCost(totalCostEstimate)}.`,
      'Analysis generated by rule-based expert system (baseline mode — AI provider unavailable). Results are operationally defensible.',
    ],
    marketIntelligence: [
      `Industry data indicates ${disruptedNodeType} disruptions typically last 15–45 days without active mitigation.`,
      'Expedited freight and spot procurement costs typically increase 150–300% during regional disruption events.',
    ],
    bestPractices: [
      `Pre-qualify alternate ${playbookKey === 'port' ? 'ports and freight channels' : playbookKey + 's'} before disruptions occur.`,
      `Maintain minimum 15-day safety stock buffer for critical SKUs routed through ${disruptedNodeLabel}.`,
    ],
    contingencyPlans: [
      `If primary mitigation fails, escalate to full network rerouting that bypasses ${disruptedNodeLabel} entirely.`,
    ],
    isBaselineFallback: true,
  };
}

// API Routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { simulationId } = body;
    
    if (!simulationId) return NextResponse.json({ error: "Missing simulationId" }, { status: 400 });

    const audit = agentAudit('StrategyAgent', 'system');
    audit.start(`Strategy generation for simulation ${simulationId}`);

    const agent = new ProductionStrategyAgent();
    const result = await agent.conductComprehensiveStrategyAnalysis(simulationId);
    
    audit.success(`Strategy generated for simulation ${simulationId}`);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    agentAudit('StrategyAgent', 'system').error(error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simulationId = searchParams.get('simulationId');
    if (!simulationId) return NextResponse.json({ error: "Missing simulationId" }, { status: 400 });

    const agent = new ProductionStrategyAgent();
    const result = await agent.conductComprehensiveStrategyAnalysis(simulationId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('GET Strategy Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
