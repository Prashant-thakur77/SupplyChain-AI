import '@/lib/zod-patch';
/**
 * Production Scenario Generator Agent (ADK Version)
 * Generates realistic "What-if" supply chain disruption scenarios
 */

import { NextRequest, NextResponse } from 'next/server';
import { LlmAgent, Gemini, InMemoryRunner, stringifyContent } from "@google/adk";
import { withTrace } from '../../../../lib/adk/core/trace';
import { supabaseServer } from '@/lib/supabase/server';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';
import { agentAudit } from '@/lib/audit-logger';

/**
 * Production Scenario Agent
 */
class ProductionScenarioAgent {
  async generateScenarios(supplyChainId: string, scenarioCount: number = 3) {
    console.log(`[SCENARIO-AGENT] 🎭 Generating ${scenarioCount} scenarios via ADK for ${supplyChainId}`);

    try {
      // 1. Fetch supply chain structure
      const { data: chain, error: chainError } = await supabaseServer
        .from('supply_chains')
        .select(`*, nodes(*)`)
        .eq('supply_chain_id', supplyChainId)
        .single();

      if (chainError || !chain) throw new Error("Supply chain not found");

      // 2. Prepare Prompt
      const prompt = `
        Supply Chain Context: ${chain.name} - ${chain.description}
        Nodes: ${JSON.stringify(chain.nodes || [])}
        
        Generate exactly ${scenarioCount} realistic disruption scenarios.
        Each scenario should include:
        - scenarioName: Short title
        - scenarioType: e.g., NATURAL_DISASTER, CYBER_ATTACK, GEOPOLITICAL
        - disruptionSeverity: 0-100 score
        - affectedNode: ID of the primary node affected
        - description: Detailed description of the event
        - probability: 0-1 score
        
        Return the response as a valid JSON array of scenario objects.
      `;

      const result = await withTrace(`trace-${Date.now()}`, 'ScenarioAgent', async () => {
        const agent = new LlmAgent({
          name: "scenario_agent",
          description: "Simulates supply chain disruptions",
          instruction: "You are a risk modeling expert. Create diverse, high-impact, and realistic scenarios based on the provided supply chain structure.",
          model: new Gemini({ model: AI_MODELS.agents, apiKey: getAIKeyForModule("agents") }),
        });

        const runner = new InMemoryRunner({ appName: 'scenario', agent });
        
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

      if (!result.success) throw new Error(result.error);
      const response = result.data as string;

      // 4. Parse JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      const scenarios = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      // 5. Store scenarios in Supabase
      const dbRecords = scenarios.map((s: any) => ({
        supply_chain_id: supplyChainId,
        name: s.scenarioName,
        scenario_type: s.scenarioType,
        parameters: s,
        status: 'generated'
      }));

      await supabaseServer
        .from('simulations')
        .insert(dbRecords);

      return {
        success: true,
        scenarios,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[SCENARIO-AGENT] ❌ Error:', error);
      throw error;
    }
  }
}

// API Routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplyChainId, scenarioCount = 3 } = body;

    if (!supplyChainId) return NextResponse.json({ error: "Missing supplyChainId" }, { status: 400 });

    const audit = agentAudit('ScenarioAgent', 'system');
    audit.start(`Generating ${scenarioCount} scenarios for supply chain ${supplyChainId}`);

    const agent = new ProductionScenarioAgent();
    const result = await agent.generateScenarios(supplyChainId, scenarioCount);
    
    audit.success(`Generated scenarios for supply chain ${supplyChainId}`);
    return NextResponse.json(result);
  } catch (error) {
    agentAudit('ScenarioAgent', 'system').error(error instanceof Error ? error.message : "Internal Error");
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supplyChainId = searchParams.get('supplyChainId');
  if (!supplyChainId) return NextResponse.json({ error: "Missing supplyChainId" }, { status: 400 });

  const agent = new ProductionScenarioAgent();
  const result = await agent.generateScenarios(supplyChainId);
  return NextResponse.json(result);
}