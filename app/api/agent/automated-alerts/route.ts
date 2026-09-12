import '@/lib/zod-patch';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { tavily } from '@tavily/core';
import { LlmAgent, Gemini, InMemoryRunner, stringifyContent } from '@google/adk';
import { z } from 'zod';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';
import { withTrace } from '../../../../lib/adk/core/trace';
import { agentAudit } from '@/lib/audit-logger';

// Define the expected structure from Gemini when evaluating news against a supply chain
const alertSchema = z.object({
  alerts: z.array(z.object({
    node_id: z.string().describe("The ID of the specific supply chain node affected by the news"),
    title: z.string().describe("A concise, alarming title for the notification"),
    message: z.string().describe("A detailed summary of the threat and its specific implication for the node"),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).describe("The absolute risk severity"),
    news_url: z.string().describe("The URL of the source article"),
    source_title: z.string().describe("The title of the source article"),
    published_at: z.string().describe("The publication date of the article")
  }))
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supplyChainId = searchParams.get('supplyChainId');
  const userId = searchParams.get('userId');

  if (!supplyChainId || !userId) {
    return NextResponse.json({ error: "Missing supplyChainId or userId" }, { status: 400 });
  }

  try {
    // 1. Fetch Supply Chain Data
    const { data: nodes, error: nodeError } = await supabaseServer
      .from('nodes')
      .select('*')
      .eq('supply_chain_id', supplyChainId);

    if (nodeError || !nodes || nodes.length === 0) {
       return NextResponse.json({ error: "Supply chain nodes not found" }, { status: 404 });
    }

    // 1.5 Fetch all alerts from the past 7 days to prevent duplicate news
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingAlerts } = await supabaseServer
      .from('notifications')
      .select('created_at, citations, message')
      .eq('user_id', userId)
      .eq('notification_type', 'supply_chain_alert')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false });

    // Deterministic Cooldown Check (5 minutes)
    if (existingAlerts && existingAlerts.length > 0) {
      const lastAlertTime = new Date(existingAlerts[0].created_at).getTime();
      if (Date.now() - lastAlertTime < 5 * 60 * 1000) {
        console.log('[ALERT-AGENT] Deterministic cooldown active. Skipping redundant scan.');
        return NextResponse.json({ success: true, alertsGenerated: 0, message: "Cooldown active." });
      }
    }

    // Extract all URLs that have already been used to generate alerts
    const usedUrls = new Set<string>();
    const existingMessages = new Set<string>();
    for (const alert of (existingAlerts || [])) {
       if (alert.message) existingMessages.add(alert.message);
       if (alert.citations?.sources) {
          for (const src of alert.citations.sources) {
             if (src.url) usedUrls.add(src.url);
          }
       }
    }

    // 2. Extract concise location keywords to build a targeted search query.
    // Tavily has a 400-char max - we take top 5 nodes and use only the first 2 words
    // of each node name as a short, clean location keyword.
    const topNodes = [...nodes].sort((a, b) => (b.risk_level || 0) - (a.risk_level || 0)).slice(0, 5);
    
    const locationKeywords = topNodes
      .filter(n => n.name)
      .map(n => {
        // Extract only the first 2 words from the node name as a short keyword
        const shortName = (n.name as string).split(' ').slice(0, 2).join(' ');
        return shortName;
      })
      .join(' OR ');

    // Hard-cap the full query at 380 characters to stay under Tavily's 400 char limit
    const rawQuery = `supply chain disruption news (${locationKeywords})`;
    const searchQuery = rawQuery.length > 380 ? rawQuery.substring(0, 380) : rawQuery;
    console.log(`[ALERT-AGENT] Searching Tavily for: ${searchQuery}`);

    // 3. Query Tavily 
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const searchResult = await tavilyClient.search(searchQuery, {
      topic: 'news',
      days: 3,
      maxResults: 10, // Scan top 10 recent articles per cycle
    });

    if (!searchResult.results || searchResult.results.length === 0) {
      return NextResponse.json({ success: true, alertsGenerated: 0, message: "No relevant supply chain news found." });
    }

    // Filter out news we've already processed for alerts
    const freshNews = searchResult.results.filter(r => !usedUrls.has(r.url));
    if (freshNews.length === 0) {
      return NextResponse.json({ success: true, alertsGenerated: 0, message: "No new supply chain news found (all recent news already processed)." });
    }

    // 4. Evaluate Threats using ADK LlmAgent
    const traceId = `alert-dispatcher-${Date.now()}`;
    const traceResult = await withTrace(traceId, 'AlertDispatcherAgent', async () => {
      const agent = new LlmAgent({
        name: 'alert_dispatcher',
        description: 'Evaluates supply chain threats from news and generates alerts.',
        instruction: `You are a supply chain alert decision engine.
Cross-reference the provided news with the specific supply chain nodes.
IF, and ONLY IF, a news article poses a direct or highly credible indirect threat to one or more of these specific nodes, generate an alert.
If the news is general and doesn't clearly map to these specific nodes, do NOT generate an alert. INSTEAD, you MUST return an empty array: { "alerts": [] }.
Only return HIGH or CRITICAL severity alerts. If it's a minor delay, ignore it.

When generating the 'message' field for the alert:
- Write exactly 1–2 sentences.
- Sentence 1: state the trigger type (e.g., weather, strike), the affected node or region, and the severity value explicitly.
- Sentence 2 (optional): state the immediate operational implication.
- Do not use vague language ("issues detected", "anomaly found", "disruption identified"). Be specific.
- Audience: supply chain operations manager. Factual, no jargon.

Return a COMPLETE JSON object matching the requested schema exactly.`,
        model: new Gemini({
          model: AI_MODELS.agents,
          apiKey: getAIKeyForModule('agents')
        })
      });

      const runner = new InMemoryRunner({ appName: 'alerts', agent });
      let finalContent = '';
      const prompt = `
Critical Nodes:
${JSON.stringify(topNodes.map(n => ({ id: n.node_id, name: n.name, address: n.address, type: n.type })))}

Latest News:
${JSON.stringify(freshNews.map(r => ({ title: r.title, content: r.content, url: r.url, date: r.publishedDate })))}
      Return a COMPLETE JSON object matching the requested schema exactly. `;

      for await (const event of runner.runEphemeral({
        userId: userId || 'system',
        newMessage: { role: 'user', parts: [{ text: prompt }] },
      })) {
        const text = stringifyContent(event);
        if (text) finalContent += text;
      }

      console.log("[ALERT-AGENT] Raw AI Output:", finalContent);

      // Extract JSON robustly using regex
      const jsonMatch = finalContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cleanContent = jsonMatch[0];
        try {
          return { success: true, data: JSON.parse(cleanContent) };
        } catch (e) {
          console.error("JSON parse failed on jsonMatch:", cleanContent);
        }
      }
      
      // Fallback: Gemini sometimes returns just the raw array
      const arrayMatch = finalContent.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const cleanContent = arrayMatch[0];
        try {
          return { success: true, data: { alerts: JSON.parse(cleanContent) } };
        } catch (e) {
          console.error("JSON parse failed on arrayMatch:", cleanContent);
        }
      }

      // If we got here, it's either an empty response or conversational rejection
      if (!finalContent || finalContent.trim() === '' || (!finalContent.includes('{') && !finalContent.includes('['))) {
        console.warn("[ALERT-AGENT] Empty or non-JSON response from AI, defaulting to 0 alerts.");
        return { success: true, data: { alerts: [] } };
      }

      throw new Error(`Failed to parse AI response as JSON object. Raw content: ${finalContent.substring(0, 100)}...`);
    });

    if (!traceResult.success) throw new Error(traceResult.error);
    const object = traceResult.data as z.infer<typeof alertSchema>;

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).getTime();
    const recentlyAlertedNodeIds = new Set(
      (existingAlerts || [])
        .filter((a: any) => new Date(a.created_at).getTime() >= twoDaysAgo)
        .flatMap((n: any) => n.citations?.affectedNodes || [])
    );

    // 4.5. Deduplicate by node ID and exact message to prevent LLM rewording duplicates
    // We already filtered out old news URLs, so if the LLM generates an alert it's from NEW info.
    // However, different news sites might report the same event, so we also filter by node ID.
    const newAlerts = object.alerts?.filter((a) => {
      // If we already alerted this exact node recently, drop it to avoid spamming the user.
      if (recentlyAlertedNodeIds.has(a.node_id)) return false;
      
      // If the exact message somehow snuck through, drop it.
      if (existingMessages.has(a.message)) return false;
      return true;
    }) || [];

    // 5. Save generated alerts to the database
    if (newAlerts.length > 0) {
      console.log(`[ALERT-AGENT] ADK found ${newAlerts.length} new threats! Saving to DB...`);
      
      const insertPromises = newAlerts.map(async (alert) => {
        // Find the node name for the UI message
        const affectedNode = nodes.find(n => n.node_id === alert.node_id);
        const nodeName = affectedNode?.name || 'Unknown Node';

        // sending alert to supabase 
        return supabaseServer.from('notifications').insert({
           user_id: userId,
           title: `⚠️ ${alert.severity} THREAT: ${nodeName}`,
           message: alert.message,
           notification_type: 'supply_chain_alert',
           severity: alert.severity,
           read_status: false,
           citations: {
              category: 'AI Threat Intelligence',
              affectedNodes: [alert.node_id],
              sources: [
                {
                  title: alert.source_title,
                  url: alert.news_url,
                  publishedAt: alert.published_at,
                  credibility: 0.95
                }
              ]
           }
        });
      });

      await Promise.all(insertPromises);
      await agentAudit('AlertDispatcherAgent', userId).success(`Threat scan complete: ${newAlerts.length} new threats detected`, { alertCount: newAlerts.length, nodeIds: newAlerts.map(a => a.node_id) });
      return NextResponse.json({ success: true, alertsGenerated: newAlerts.length, data: newAlerts });
    }

    await agentAudit('AlertDispatcherAgent', userId).success('Threat scan complete: No new threats detected');
    return NextResponse.json({ success: true, alertsGenerated: 0, message: "News evaluated; no new/direct threats found or all redundant." });

  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : "Internal Error";
    const isRateLimit = errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
    
    if (isRateLimit) {
      console.warn('[ALERT-AGENT] AI quota exceeded — skipping this scan cycle.');
      await agentAudit('AlertDispatcherAgent', userId || 'system').error('Scan skipped due to AI quota limit');
      return NextResponse.json({ success: true, alertsGenerated: 0, message: "Quota limit reached — scan skipped. Will retry next cycle." });
    }

    console.error('Automated Alert Error:', error);
    await agentAudit('AlertDispatcherAgent', userId || 'system').error(errMsg);
    return NextResponse.json({ 
      success: false, 
      error: errMsg
    }, { status: 500 });
  }
}
