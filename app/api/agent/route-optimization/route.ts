import '@/lib/zod-patch';
import { NextRequest, NextResponse } from 'next/server';
import { LlmAgent, Gemini, InMemoryRunner, stringifyContent } from '@google/adk';
import { withTrace } from '../../../../lib/adk/core/trace';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';
import { z } from 'zod';

const RouteOptimizationSchema = z.object({
  severity: z.enum(['Low', 'Medium', 'High']).describe('Severity of the disruption based on the description'),
  impactDescription: z.string().describe('A detailed 2-3 sentence analysis of the operational impact on the supply chain'),
  alternateRoutes: z.array(z.string()).describe('An array of 1 to 3 specific recommended alternate routes or mitigation steps')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nodeId, description, nodes, edges } = body;

    if (!nodeId || !description) {
      return NextResponse.json({ error: 'nodeId and description are required' }, { status: 400 });
    }

    const disruptedNode = nodes.find((n: any) => n.id === nodeId);
    const nodeName = disruptedNode?.data?.label || nodeId;

    console.log(`🧠 AI Agent Analyzing disruption at ${nodeName}: ${description}`);

    const prompt = `
    You are a logistics route optimization specialist.

    Failed node ID: ${nodeId} (${nodeName})
    Disruption: ${description}
    
    Supply Chain Context:
    Nodes: ${JSON.stringify(nodes.map((n:any) => ({ 
      id: n.id, 
      name: n.data.label, 
      type: n.type,
      preKnownRisks: n.data.hasPreKnownRisks ? n.data.riskExplanation : null 
    })))}
    Edges (Routes): ${JSON.stringify(edges.map((e:any) => ({ 
      from: e.source, 
      to: e.target,
      mode: e.data?.mode,
      historicalDisruptionsPerYear: e.data?.frequencyOfDisruptions,
      userDefinedAlternativeRoutes: e.data?.hasAltRoute ? e.data?.altRouteDetails : null
    })))}

    Step 1: Identify every route in the graph that passes through the failed node.
    Step 2: For each affected route, find an alternate path using only nodes and edges present in the graph that does not pass through the failed node. If multiple alternates exist for one route, include only the lowest-cost one.
    Step 3: Write each alternate route as a string in the format: "NodeName → NodeName → NodeName" using the exact node labels from the graph, ordered from origin to final destination.
    Step 4: If an alternate route passes through a node that has a known elevated risk (or preKnownRisks), append "(elevated risk)" after that node name in the route string.
    Step 5: Rank alternateRoutes by lowest additional cost first. If cost data is absent from the graph, rank by fewest additional hops.
    Step 6: If no complete bypass route exists for any affected path, include the best partial reroute and append "(partial — full bypass unavailable)" to that route string.

    IMPORTANT: If the disrupted node or its connected routes have user-defined 'userDefinedAlternativeRoutes' in the context data above, you MUST explicitly mention them and prioritize them.
    Provide your analysis matching the JSON schema exactly.
    `;

    const traceId = `route-opt-${Date.now()}`;
    const traceResult = await withTrace(traceId, 'RouteOptAgent', async () => {
      const agent = new LlmAgent({
        name: 'route_optimization_agent',
        description: 'Analyzes supply chain disruptions and recommends optimal alternate routes.',
        instruction: 'You are a logistics route optimization specialist. Analyze the disrupted node and supply chain graph, then return alternate routing recommendations as valid JSON matching the schema exactly.',
        model: new Gemini({ model: AI_MODELS.agents, apiKey: getAIKeyForModule('agents') }),
        outputSchema: RouteOptimizationSchema,
        disallowTransferToParent: true,
        disallowTransferToPeers: true,
      });

      const runner = new InMemoryRunner({ appName: 'route-optimization', agent });
      let finalContent = '';
      for await (const event of runner.runEphemeral({
        userId: 'system',
        newMessage: { role: 'user', parts: [{ text: prompt }] },
      })) {
        const text = stringifyContent(event);
        if (text) finalContent += text;
      }
      return { success: true, data: finalContent };
    });

    if (!traceResult.success) throw new Error(traceResult.error);

    const rawData = traceResult.data as string;
    const jsonMatch = rawData.match(/\{[\s\S]*\}/);
    
    let object;
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found in ADK response. Raw output:', rawData);
      // Trigger the fallback mechanism for empty/invalid responses
      throw new Error('OVERLOADED_OR_EMPTY: Failed to parse route-optimization JSON');
    } else {
      object = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json(object);
  } catch (error: any) {
    const errMsg: string = error?.message || '';
    const isRateLimit = errMsg.includes('quota') || errMsg.includes('rate') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.toLowerCase().includes('overloaded');
    
    if (isRateLimit) {
      console.warn('⚠️ AI quota/overload exceeded — using fallback route optimization data');
      return NextResponse.json({
        severity: 'High',
        impactDescription: `Simulation of disruption. Immediate downstream delays expected across connected nodes. AI rate limits currently active, displaying projected fallback analysis.`,
        alternateRoutes: [
          "Wait for conditions to clear.",
          "Check secondary nodes for capacity.",
          "Reroute critical shipments via nearest functional port."
        ]
      });
    }

    console.error('Error in route-optimization agent:', error);
    return NextResponse.json({ error: errMsg || 'Failed to process route optimization' }, { status: 500 });
  }
}
