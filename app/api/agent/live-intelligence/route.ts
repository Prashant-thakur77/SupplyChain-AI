import '@/lib/zod-patch';
import { NextRequest, NextResponse } from 'next/server';
import { LlmAgent, Gemini, InMemoryRunner, stringifyContent } from '@google/adk';
import { withTrace } from '../../../../lib/adk/core/trace';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';
import { getTavilyClient } from '@/lib/clients/tavily';
import { z } from 'zod';
import { agentAudit } from '@/lib/audit-logger';

const LiveIntelligenceSchema = z.object({
  disruptionsFound: z.boolean().describe('True if any node has a critical risk score > 0.80'),
  nodeRisks: z.array(z.object({
    nodeId: z.string().describe('The ID of the evaluated node'),
    riskScore: z.number().describe('A dynamically calculated risk score from 0.10 (safe) to 0.99 (critical disruption) based on the news severity'),
    reason: z.string().describe('A concise explanation of why this risk score was assigned based on the news sentiment and events')
  })).describe('List of all requested nodes with their updated dynamic risk scores'),
  description: z.string().describe('An overall executive summary of the live global supply chain threat landscape')
});

export async function POST(req: NextRequest) {
  let nodes: any[] = [];
  try {
    const body = await req.json();
    nodes = body.nodes || [];

    if (!nodes || nodes.length === 0) {
      return NextResponse.json({ error: 'nodes are required' }, { status: 400 });
    }

    // Group nodes by country to perform regional searches (avoids the single combined search problem)
    const regionalGroups = nodes.reduce((acc: Record<string, string[]>, n: any) => {
      // Prioritize country, fallback to general address string, or 'global'
      const region = n.data?.location?.country || n.data?.country || n.data?.address?.split(',').pop()?.trim() || 'global';
      if (!acc[region]) acc[region] = [];
      if (n.data?.label) acc[region].push(n.data.label);
      return acc;
    }, {});

    console.log(`🔍 Scanning live intelligence across ${Object.keys(regionalGroups).length} regions...`);

    let searchContext = "";
    try {
      // Execute searches in parallel per region
      const searchPromises = Object.entries(regionalGroups).map(async ([region, names]) => {
        // Build a targeted query for this specific region
        const searchQuery = `supply chain disruption logistics news ${region !== 'global' ? region : ''} ${names.join(' OR ')}`.trim();
        // Scale results based on number of nodes in this region, capped at 5 per region to manage context window
        const resultsCount = Math.min(Math.max(names.length, 3), 5);

        const result = await getTavilyClient().search(searchQuery, { topic: 'news', days: 3, maxResults: resultsCount });
        return `\n--- News for Region: ${region} ---\n` + result.results.map(r => `${r.title}: ${r.content}`).join('\n');
      });

      const searchResults = await Promise.allSettled(searchPromises);
      searchContext = searchResults
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value)
        .join('\n');
    } catch (err) {
      console.warn('Tavily search failed or missing API key, proceeding with fallback:', err);
    }

    const prompt = `
    You are an elite Supply Chain Risk Intelligence Agent. 
    Your objective is to analyze live global news and assign a dynamic risk score to specific supply chain nodes.

    ### The Nodes to Evaluate:
    ${JSON.stringify(nodes.map((n:any) => ({ id: n.id, name: n.data.label, type: n.type, location: n.data.location?.country || n.data.address })))}

    ### Live Intelligence Feed:
    ${searchContext || "No severe live news reported. The global supply chain appears stable."}

    `;

    const traceId = `live-intel-${Date.now()}`;
    const traceResult = await withTrace(traceId, 'LiveIntelAgent', async () => {
      const agent = new LlmAgent({
        name: 'live_intelligence_agent',
        description: 'Analyzes live news feeds and assigns risk scores to supply chain nodes.',
        instruction: `You are an elite Supply Chain Risk Intelligence Agent. Analyze live global news and assign precise risk scores to supply chain nodes.### Instructions:
            1. Read the live news feed and perform sentiment analysis on how it impacts each specific node. Pay close attention to geography, corporate names, and industry types.
            2. Assign a precise \`riskScore\` to EACH node from 0.10 to 0.99:
              - 0.10 - 0.30: Safe, positive sentiment, or no relevant news.
              - 0.31 - 0.50: Normal operations, minor background noise.
              - 0.51 - 0.79: Elevated risk (e.g., impending weather, strikes, geopolitical tension nearby).
              - 0.80 - 0.99: Critical disruption (e.g., facility on fire, port shut down, immediate bankruptcy).
            3. Provide a concise \`reason\` explaining the score for each node.
            4. Set \`disruptionsFound\` to true ONLY if at least one node scores above 0.80.
            5. Summarize the overall situation in \`description\`. Always return valid JSON matching the schema.`,
        model: new Gemini({ model: AI_MODELS.agents, apiKey: getAIKeyForModule('agents') }),
        outputSchema: LiveIntelligenceSchema,
        disallowTransferToParent: true,
        disallowTransferToPeers: true,
      });

      const runner = new InMemoryRunner({ appName: 'live-intelligence', agent });
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

    const jsonMatch = (traceResult.data as string).match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse live-intelligence JSON from ADK');
    const object = JSON.parse(jsonMatch[0]);

    agentAudit('LiveIntelligenceAgent', 'system').success(`Live intelligence scan complete: ${object.disruptionsFound ? 'Disruptions found' : 'No disruptions'}`, { nodeCount: nodes.length, regionsScanned: Object.keys(regionalGroups).length });

    return NextResponse.json(object);
  } catch (error: any) {
    const errMsg: string = error?.message || '';
    const isRateLimit = errMsg.includes('quota') || errMsg.includes('rate') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.toLowerCase().includes('overloaded');
    
    if (isRateLimit) {
      console.warn('⚠️ AI quota/overload exceeded — using fallback live intelligence data');
      
      // Fallback clean error state — neutral scores to prevent fake production disruptions
      if (nodes && nodes.length > 0) {
        return NextResponse.json({
          disruptionsFound: false,
          description: "AI rate limits currently active. Unable to scan live feeds. Assigning neutral baseline scores.",
          nodeRisks: nodes.map((n: any) => ({
            nodeId: n.id,
            riskScore: 0.20, // Neutral/safe score
            reason: `Data unavailable due to API rate limits.`
          }))
        });
      }

      return NextResponse.json({
        disruptionsFound: false,
        nodeRisks: [],
        description: "AI rate limits currently active. Unable to scan live feeds."
      });
    }

    console.error('Error in live intelligence scan:', error);
    return NextResponse.json({ error: errMsg || 'Failed to scan live intelligence' }, { status: 500 });
  }
}
