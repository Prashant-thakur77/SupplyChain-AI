import '@/lib/zod-patch';
/**
 * Enhanced Supply Chain Intelligent Agent V2.0 (ADK Version)
 * Specialized agent for gathering real-time supply chain intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamText, generateText } from 'ai';
import { LlmAgent, FunctionTool, Gemini, InMemoryRunner, stringifyContent } from "@google/adk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { tavily } from '@tavily/core';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';
import { withTrace } from '../../../../lib/adk/core/trace';
import { z } from 'zod';

/**
 * Tavily Search Tool for ADK
 */
const tavilySearchTool = new FunctionTool({
  name: "tavily_search",
  description: "Search for real-time supply chain intelligence, weather, and disruptions.",
  parameters: z.object({ query: z.string() }),
  execute: async (args) => {
    if (!process.env.TAVILY_API_KEY) return { error: "Tavily API key missing" };
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const result = await tavilyClient.search(args.query, { 
      searchDepth: "advanced",
      maxResults: 5 
    });
    return result;
  }
});

/**
 * Production Intelligent Agent
 */
class ProductionIntelligentAgent {
  async gatherIntelligence(nodeId: string, focusArea: string = 'all') {
    const traceId = `intel-${Date.now()}`;
    console.log(`[INTEL-AGENT] 🕵️ Gathering intelligence for node: ${nodeId}`);

    const result = await withTrace(traceId, 'IntelligenceAgent', async () => {
      const prompt = `
        Gather intelligence for supply chain node: ${nodeId}
        Focus Area: ${focusArea}
        
        Search for current disruptions, weather impacts, and market trends.
        Provide a detailed summary and risk score (0-100).
      `;

      const agent = new LlmAgent({
        name: "intelligent_agent",
        description: "Gathers real-time intelligence",
        instruction: "You are an expert analyst. Use search tools to find the latest data and provide a quantitative risk assessment.",
        model: new Gemini({ model: AI_MODELS.agents, apiKey: getAIKeyForModule("agents") }),
        tools: [tavilySearchTool]
      });

      const runner = new InMemoryRunner({ appName: 'intel', agent });
      
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

      return {
        success: true,
        data: {
          intelligence: finalContent,
          timestamp: new Date().toISOString()
        }
      };
    });

    if (!result.success) throw new Error(result.error);
    return result.data!;
  }
}

// Single POST Export
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supply_chain_id, nodeId, focusArea, messages } = body;
    
    // We expect either nodeId or supply_chain_id in the body (the frontend sends supply_chain_id)
    const targetId = nodeId || supply_chain_id;
    if (!targetId) return NextResponse.json({ error: "Missing Target ID" }, { status: 400 });

    const google = createGoogleGenerativeAI({
      apiKey: getAIKeyForModule("agents"),
    });

    const systemPrompt = `
      Gather intelligence for supply chain node or ID: ${targetId}
      Focus Area: ${focusArea || 'all'}
      
      Search for current disruptions, weather impacts, and market trends.
      Provide a detailed summary and risk score (0-100).
    `;

    // Extract the latest query from messages if they exist, otherwise use the system prompt
    const promptMessage = messages && messages.length > 0 
      ? messages[messages.length - 1].content 
      : systemPrompt;

    if (body.stream) {
      // NOTE: We fall back to standard Vercel AI SDK for streaming to the UI to avoid 
      // breaking the useChat protocol, while ADK is used for full pipeline runs.
      const result = await streamText({
        model: google(AI_MODELS.agents),
        system: systemPrompt,
        messages: messages || [{ role: 'user', content: promptMessage }],
      });
      return result.toDataStreamResponse();
    } else {
      const agent = new ProductionIntelligentAgent();
      const result = await agent.gatherIntelligence(targetId, focusArea);
      return NextResponse.json({ success: true, data: result.intelligence });
    }
  } catch (error) {
    console.error('[INTEL-AGENT] ❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 });
  }
}