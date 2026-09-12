import { NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { AI_MODELS, getAIKeyForModule } from '@/lib/ai-config';
import { agentAudit } from '@/lib/audit-logger';

// ─────────────────────────────────────────────────────────
// 🧠 Zod Schema for Scenario Output (Strictly Matched)
// ─────────────────────────────────────────────────────────
const ScenarioOutputSchema = z.object({
  scenarioName: z.string(),
  scenarioType: z.string(),
  disruptionSeverity: z.number(),
  disruptionDuration: z.number(),
  affectedNode: z.string(),
  description: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  monteCarloRuns: z.number(),
  distributionType: z.string(),
  cascadeEnabled: z.boolean(),
  failureThreshold: z.number(),
  bufferPercent: z.number(),
  alternateRouting: z.boolean(),
  randomSeed: z.string(),
});

const ScenariosOutputSchema = z.array(ScenarioOutputSchema).length(5);

// Generate LLM prompt with simplified context
function generatePrompt(supplyChains: any[], intelData: any[]) {
  const limitedSupplyChains = supplyChains.map(chain => ({
    id: chain.id,
    name: chain.name,
    nodeCount: chain.nodes?.length || 0,
    linkCount: chain.links?.length || 0,
    nodes: chain.nodes?.slice(0, 20) || [],
    links: chain.links?.slice(0, 30) || [],
  }));

  const simplifiedIntel = intelData.map(item => ({
    news: Array.isArray(item.news) ? item.news.slice(0, 5) : [],
    weather: item.weather,
    node_id: item.node_id
  }));

  return `
You are a highly experienced global supply chain strategist.

Your task is to analyze the company's supply chain structure and recent real-world data (news, weather, node-level reports). Based on this, simulate **5 different likely future disruption scenarios** on vulnerable nodes.

⚙️ Inputs:
- The supply chain structure: all nodes and links
- Recent intelligence: news, weather, and node-level data

🔍 Instructions:
1. Analyze the vulnerabilities (natural disasters, political issues, labor strikes, etc.).
2. Identify different weak or at-risk nodes for each scenario.
3. Choose realistic scenarios such as strike, flood, fire, outage, cyberattack, embargo, etc.
4. Accurately generate 5 different scenarios with all required fields below.
5. Each scenario should be distinct in its affected node, type, or severity.
6. Duration must match event type.
7. Severity between 0–100. Use good judgment.
8. RandomSeed should be a lowercase, hyphenated version of the event title + year.
9. Current date is April 20, 2025.

📦 Required Output:
An array of 5 valid JSON objects **strictly matching** this schema:

${ScenarioOutputSchema.toString()}

🧠 Example Intel:
${JSON.stringify(simplifiedIntel, null, 2)}

📦 Supply Chain:
${JSON.stringify(limitedSupplyChains, null, 2)}
`;
}

// AI model configuration
const MODEL_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 4096,
  topK: 40,
  topP: 0.95,
};

// ─────────────────────────────────────────────────────────
// 🚀 POST: Generates 5 Disruption Scenarios via LLM
// ─────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const supabase = supabaseServer;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required in request body' }, { status: 400 });
    }

    console.log('🧾 Received userId:', userId);

    const [supplyChainResult, intelResult] = await Promise.all([
      supabase
        .from('supply_chains')
        .select('name,description,  nodes, edges, supply_chain_id , connections , organisation')
        .eq('user_id', userId),
      supabase
        .from('supply_chain_intel')
        .select('news, weather, node_id')
        .eq('user_id', userId)
    ]);

    const supplyChains = supplyChainResult.data || [];
    const intelData = (intelResult.data && intelResult.data.length > 0)
      ? intelResult.data
      : [{ news: [], weather: {}, node_id: null }];

    console.log('🔗 Supply Chains:', JSON.stringify(supplyChains, null, 2));
    console.log('📰 Intel Data:', JSON.stringify(intelData, null, 2));

    if (supplyChains.length === 0) {
      return NextResponse.json({ error: 'No supply chains found for this user' }, { status: 404 });
    }

    const prompt = generatePrompt(supplyChains, intelData);

    const audit = agentAudit('ScenarioAgent', userId);
    audit.start(`Generating 5 disruption scenarios based on live intel`);

    const google = createGoogleGenerativeAI({ apiKey: getAIKeyForModule('agents') });
    const { object: scenarios } = await generateObject({
      model: google(AI_MODELS.agents, {
        ...MODEL_CONFIG,
        useSearchGrounding: true,
      }),
      schema: ScenariosOutputSchema,
      prompt,
    });

    audit.success(`Successfully generated 5 disruption scenarios`);

    return NextResponse.json({
      scenarios,
      meta: {
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Scenario Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate scenarios' }, { status: 500 });
  }
}