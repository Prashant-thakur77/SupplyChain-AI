// /app/api/scenario-impact/route.ts

import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { AI_MODELS, getAIKeyForModule } from '@/lib/ai-config';
// ───────────────────────────────────────────────────────────────────────────────
// 1️⃣ Define Zod schemas matching your SupplyChainImpactData shape
// ───────────────────────────────────────────────────────────────────────────────


const MetricSchema = z.object({
  day: z.number(),
  actual: z.number().nullable(),
  projected: z.number().optional(),
  level: z.number().optional(),
  output: z.number().optional(),
  inventory: z.number().optional(),
});

const NodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  statusDetail: z.string(),
  downtime: z.string(),
  outputDrop: z.string(),
  recovery: z.string(),
  riskScore: z.number(),
  x: z.number(),
  y: z.number(),
  dailyMetrics: z.array(MetricSchema).optional(),
});

const LinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  value: z.number(),
});

const ScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string(),
  supplyChain: z.string(),
  affectedNode: z.string(),
  duration: z.string(),
  severity: z.string(),
  monteCarloRuns: z.number(),
  cascadingThreshold: z.string(),
  inventoryBuffer: z.string(),
  lastUpdated: z.string(),
});

const SupplyChainImpactDataSchema = z.object({
  scenario: ScenarioSchema,
  nodes: z.array(NodeSchema),
  links: z.array(LinkSchema),
  productionData: z
    .array(
      z.object({
        day: z.number(),
        actual: z
          .number()
          .max(100, { message: 'Actual must not exceed 100' })
          .nullable(),
        projected: z
          .number()
          .max(100, { message: 'Projected must not exceed 100' }),
      })
    )
    .length(30, { message: 'Must include exactly 30 days of data' }),
  inventoryData: z.array(MetricSchema),
});

// ───────────────────────────────────────────────────────────────────────────────
// 2️⃣ API handler: accepts POST with { simulationConfig, company_sitemap }
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    let supplyChains;
    const { simulationConfig, user_id } = await req.json();

    try {
        // Use the existing supabaseServer client
        const supabase = supabaseServer;
    
        // Get the user's supply chain
        const { data } = await supabase
          .from('supply_chains')
          .select('*')
          .eq('user_id', user_id);
        
        if (!data || data.length === 0) {
          return NextResponse.json({ error: "No supply chains found for user" }, { status: 404 });
        }

        supplyChains = data;
    } catch (innerError) {
        console.error('❌ Inner Error:', innerError);
        return NextResponse.json(
          { error: 'Failed to fetch user or supply chain data.' },
          { status: 500 }
        );
    }

    // Build a precise, instruction-rich prompt that emphasizes compact output
    const prompt = `
    You are a senior supply chain simulation analyst AI.
    
    Your task is to return a **single, fully-formed JSON object** matching **exactly** the schema below, strictly without extra text, commentary, or explanations. You must **only** return this object.
    
    🧠 You are given:
    - A disruption scenario (severity, duration, Monte Carlo runs, thresholds, buffers)
    - A company supply chain map (nodes, edges, inventories)
    
    ▶️ Simulation Rules:
    1. Apply disruption severity to the affected node’s daily output.
    2. Deplete inventory buffer day‑by‑day. If inputs fall below the cascading failure threshold, mark the node as "failed".
    3. Propagate failures downstream based on links. Update outputs of affected nodes accordingly.
    4. Recovery time = disruption duration + days until buffer or alternate routing restores full flow.
    5. Risk score = severity × node.riskScore × (1 + downstreamDependencies/10), clamped to 0–100.
    6. Generate daily **productionData** and **inventoryData** for a 30-day simulation.
    7. Assign each node a position (x, y) from the map.
    8. Perform **Monte Carlo** simulations internally, but return a single, **median** representative outcome.
    9. Last updated timestamp must be generated in this format: "Today, HH:MM AM/PM".
    
    ⚠️ ABSOLUTE RULES:
    - You must return a single JSON object that matches this exact schema:
    ${SupplyChainImpactDataSchema.toString()}
    
    - productionData:
      • Must be exactly 30 objects (days 1–30)
      • Values:
        – actual: number (0–100) from day 1–21, **null from day 22–30**
        – projected: number (0–100) for all 30 days
      • Follow this pattern:
        – Day 1–7: ramp down
        – Day 8–15: low/stable phase
        – Day 16–21: ramp up
        – Day 22–30: future projected values (actual: null)
    
    - inventoryData:
      • Same 30-day timeline
      • Track daily inventory changes for affected and critical nodes
    
    ✅ Your response must include:
    - A valid \`scenario\` object
    - Updated \`nodes\` (with correct status, outputDrop, downtime, recovery, and x,y)
    - \`links\` as-is from input
    - Complete 30-day \`productionData\` and \`inventoryData\`
    
    📥 Inputs:
    SimulationConfig:
    ${JSON.stringify(simulationConfig, null, 2)}
    
    CompanySitemap:
    ${JSON.stringify(supplyChains, null, 2)}
    `.trim();
    

    try {
      // Invoke the LLM with structured output and explicit limits
      const google = createGoogleGenerativeAI({ apiKey: getAIKeyForModule('agents') });
      const { object: result } = await generateObject({
        model: google(AI_MODELS.agents, {    
          useSearchGrounding: true 
        }),
        schema: SupplyChainImpactDataSchema,
        prompt,
      });

      return NextResponse.json({ result });
    } catch (llmError) {
      console.error('❌ LLM Error:', llmError);
      
      // Attempt to provide a fallback for development purposes
      return NextResponse.json({
        error: 'Failed to generate complete impact assessment. The response may be too large.',
        message: 'Consider reducing the complexity of your supply chain or the simulation duration.',
        details: llmError instanceof Error ? llmError.message : 'Unknown LLM error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Scenario Impact Agent Error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate supply chain impact.' },
      { status: 500 }
    );
  }
}