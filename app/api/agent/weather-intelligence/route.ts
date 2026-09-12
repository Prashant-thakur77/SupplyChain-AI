import '@/lib/zod-patch';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { LlmAgent, Gemini, InMemoryRunner, stringifyContent } from '@google/adk';
import { z } from 'zod';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';
import { withTrace } from '../../../../lib/adk/core/trace';
import { agentAudit } from '@/lib/audit-logger';


// Severe weather codes from OpenWeather API
// 2xx = Thunderstorm, 502–504 = Heavy/Extreme Rain, 6xx = Snow, 711 = Smoke, 721 = Haze, 781 = Tornado
const ADVERSE_CODES = new Set([
  ...Array.from({ length: 33 }, (_, i) => 200 + i), // 200–232 Thunderstorm
  502, 503, 504, 511,                                  // Heavy/Extreme Rain, Freezing Rain
  ...Array.from({ length: 22 }, (_, i) => 601 + i),  // 601–622 Snow
  711, 721, 731, 751, 761, 762, 771, 781              // Smoke, Haze, Tornado, etc.
]);

// AI Schema for weather impact classification
const weatherImpactSchema = z.object({
  assessments: z.array(z.object({
    node_id: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    is_adverse: z.boolean(),
    ai_summary: z.string().describe('1–2 sentence operational impact summary for a supply chain manager')
  }))
});

async function fetchWeatherAt(lat: number, lng: number): Promise<any | null> {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function midpoint(lat1: number, lng1: number, lat2: number, lng2: number) {
  return { lat: (lat1 + lat2) / 2, lng: (lng1 + lng2) / 2 };
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    // 1. Fetch all supply chains for this user
    const { data: supplyChains } = await supabaseServer
      .from('supply_chains').select('*').eq('user_id', userId);
    if (!supplyChains || supplyChains.length === 0)
      return NextResponse.json({ success: true, message: 'No supply chains found' });

    const weatherPayloads: any[] = []; // items to pass to AI agent
    const dbRecords: any[] = [];       // items to upsert into weather_intelligence

    // 1.5. Fetch recent weather alerts (last 24 hours) for deduplication
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentWeatherAlerts } = await supabaseServer
      .from('notifications')
      .select('citations, message, severity')
      .eq('user_id', userId)
      .eq('notification_type', 'supply_chain_alert')
      .gte('created_at', twentyFourHoursAgo);

    const recentlyAlertedNodes = new Map<string, any>();
    if (recentWeatherAlerts) {
       for (const alert of recentWeatherAlerts) {
          if (alert.citations?.category === 'WEATHER' && alert.citations.affectedNodes) {
             for (const nId of alert.citations.affectedNodes) {
                if (!recentlyAlertedNodes.has(nId)) {
                   recentlyAlertedNodes.set(nId, { severity: alert.severity, summary: alert.message });
                }
             }
          }
       }
    }

    for (const sc of supplyChains) {
      const [{ data: nodes }, { data: edges }] = await Promise.all([
        supabaseServer.from('nodes').select('*').eq('supply_chain_id', sc.supply_chain_id),
        supabaseServer.from('edges').select('*').eq('supply_chain_id', sc.supply_chain_id),
      ]);

      const nodeMap = new Map((nodes || []).map((n: any) => [n.node_id, n]));

      // ── A. Node-level weather ──────────────────────────────────────────────
      for (const node of (nodes || [])) {
        const lat = node.data?.location?.lat;
        const lng = node.data?.location?.lng;
        if (!lat || !lng) continue;

        const w = await fetchWeatherAt(lat, lng);
        if (!w) continue;

        const code = w.weather?.[0]?.id;
        const isAdverse = code ? ADVERSE_CODES.has(code) : false;

        const record = {
          user_id: userId,
          supply_chain_id: sc.supply_chain_id,
          node_id: node.node_id,
          node_name: node.name,
          node_type: 'node',
          lat, lng,
          weather_code: code ?? null,
          weather_main: w.weather?.[0]?.main ?? null,
          weather_desc: w.weather?.[0]?.description ?? null,
          temp_celsius: w.main?.temp ?? null,
          wind_speed_ms: w.wind?.speed ?? null,
          location_name: w.name ?? node.name,
          is_adverse: isAdverse,
          severity: isAdverse ? 'HIGH' : 'LOW',
          category: 'WEATHER',
          ai_summary: null,
          fetched_at: new Date().toISOString(),
        };
        dbRecords.push(record);
        if (isAdverse) {
           const previous = recentlyAlertedNodes.get(node.node_id);
           if (previous) {
             // Deduplicate: Reuse previous assessment, skip AI query
             record.severity = previous.severity;
             record.ai_summary = previous.summary;
           } else {
             weatherPayloads.push(record);
           }
        }
      }

      // ── B. Transit route midpoint weather ─────────────────────────────────
      for (const edge of (edges || [])) {
        const fromNode = nodeMap.get(edge.from_node_id);
        const toNode   = nodeMap.get(edge.to_node_id);

        const fromLat = fromNode?.data?.location?.lat;
        const fromLng = fromNode?.data?.location?.lng;
        const toLat   = toNode?.data?.location?.lat;
        const toLng   = toNode?.data?.location?.lng;

        if (!fromLat || !fromLng || !toLat || !toLng) continue;

        const mid = midpoint(fromLat, fromLng, toLat, toLng);
        const w = await fetchWeatherAt(mid.lat, mid.lng);
        if (!w) continue;

        const code = w.weather?.[0]?.id;
        const isAdverse = code ? ADVERSE_CODES.has(code) : false;
        const routeName = `${fromNode?.name ?? 'Origin'} → ${toNode?.name ?? 'Destination'}`;

        const record = {
          user_id: userId,
          supply_chain_id: sc.supply_chain_id,
          node_id: `edge:${edge.from_node_id}-${edge.to_node_id}`,
          node_name: routeName,
          node_type: 'transit_route',
          lat: mid.lat,
          lng: mid.lng,
          weather_code: code ?? null,
          weather_main: w.weather?.[0]?.main ?? null,
          weather_desc: w.weather?.[0]?.description ?? null,
          temp_celsius: w.main?.temp ?? null,
          wind_speed_ms: w.wind?.speed ?? null,
          location_name: w.name ?? routeName,
          is_adverse: isAdverse,
          severity: isAdverse ? 'HIGH' : 'LOW',
          category: 'WEATHER',
          ai_summary: null,
          fetched_at: new Date().toISOString(),
        };
        dbRecords.push(record);
        if (isAdverse) {
           const edgeId = `edge:${edge.from_node_id}-${edge.to_node_id}`;
           const previous = recentlyAlertedNodes.get(edgeId);
           if (previous) {
             // Deduplicate: Reuse previous assessment, skip AI query
             record.severity = previous.severity;
             record.ai_summary = previous.summary;
           } else {
             weatherPayloads.push(record);
           }
        }
      }
    }

    // 2. AI Agent — classify severity and generate summaries for adverse conditions
    if (weatherPayloads.length > 0) {
      const traceId = `weather-intel-${Date.now()}`;
      const traceResult = await withTrace(traceId, 'WeatherIntelligenceAgent', async () => {
        const agent = new LlmAgent({
          name: 'weather_intelligence_agent',
          description: 'Classifies adverse weather conditions for supply chain nodes and transit routes.',
          instruction: `You are a supply chain weather risk analyst. 
You are given a list of supply chain nodes and transit routes experiencing adverse weather.
For each record, determine:
1. The TRUE severity: LOW (minor inconvenience), MEDIUM (possible delays), HIGH (likely disruption), CRITICAL (route closure/shutdown likely).
2. A concise 1-2 sentence operational impact summary for a supply chain manager.
Return valid JSON matching the schema. Be conservative: only use CRITICAL for tornados, blizzards, or extreme storms that would shut down operations.`,
          model: new Gemini({ model: AI_MODELS.agents, apiKey: getAIKeyForModule('agents') }),
        });

        const runner = new InMemoryRunner({ appName: 'weather-intelligence', agent });
        let finalContent = '';
        const prompt = `Classify the following adverse weather events:\n${JSON.stringify(
          weatherPayloads.map(p => ({
            node_id: p.node_id,
            node_name: p.node_name,
            node_type: p.node_type,
            weather: `${p.weather_main} — ${p.weather_desc}`,
            temp_celsius: p.temp_celsius,
            wind_speed_ms: p.wind_speed_ms,
          }))
        )}\n\nReturn a JSON object with an "assessments" array.`;

        for await (const event of runner.runEphemeral({
          userId,
          newMessage: { role: 'user', parts: [{ text: prompt }] },
        })) {
          const text = stringifyContent(event);
          if (text) finalContent += text;
        }

        const jsonMatch = finalContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { success: true, data: { assessments: [] } };
        try {
          return { success: true, data: JSON.parse(jsonMatch[0]) };
        } catch {
          return { success: true, data: { assessments: [] } };
        }
      });

      // Merge AI assessments back into dbRecords
      if (traceResult.success) {
        const assessments: any[] = (traceResult.data as any)?.assessments || [];
        const assessMap = new Map(assessments.map((a: any) => [a.node_id, a]));
        for (const rec of dbRecords) {
          const ai = assessMap.get(rec.node_id);
          if (ai) {
            rec.severity  = ai.severity;
            rec.is_adverse = ai.is_adverse;
            rec.ai_summary = ai.ai_summary;
          }
        }
      }
    }

    // 3. Delete old records (older than 4 hours) then bulk insert fresh data
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    await supabaseServer
      .from('weather_intelligence')
      .delete()
      .eq('user_id', userId)
      .lt('fetched_at', fourHoursAgo);

    if (dbRecords.length > 0) {
      const { error: insertError } = await supabaseServer
        .from('weather_intelligence')
        .insert(dbRecords);
      if (insertError) console.error('[WEATHER-AGENT] Insert error:', insertError);
    }

    // 4. Save critical/high adverse events as notifications so they appear in News Room alerts
    const adverseToAlert = dbRecords.filter(r => 
      r.is_adverse && 
      (r.severity === 'HIGH' || r.severity === 'CRITICAL') && 
      !recentlyAlertedNodes.has(r.node_id)
    );
    if (adverseToAlert.length > 0) {
      const alertInserts = adverseToAlert.map(r => ({
        user_id: userId,
        title: `⛈️ ${r.severity} Weather Alert: ${r.node_name}`,
        message: r.ai_summary || `Adverse weather (${r.weather_main}: ${r.weather_desc}) detected at ${r.node_name}. Temp: ${r.temp_celsius}°C, Wind: ${r.wind_speed_ms} m/s.`,
        notification_type: 'supply_chain_alert',
        severity: r.severity,
        read_status: false,
        citations: {
          category: 'WEATHER',
          affectedNodes: [r.node_id],
          sources: [{ title: 'OpenWeather Live Satellite', url: 'https://openweathermap.org', publishedAt: new Date().toISOString(), credibility: 1 }]
        }
      }));

      await supabaseServer.from('notifications').insert(alertInserts);
    }

    await agentAudit('WeatherIntelligenceAgent', userId).success(
      `Weather scan complete: ${dbRecords.length} points checked, ${adverseToAlert.length} adverse conditions found`,
      { total: dbRecords.length, adverse: adverseToAlert.length }
    );

    return NextResponse.json({
      success: true,
      totalPointsChecked: dbRecords.length,
      adverseConditions: adverseToAlert.length,
      data: dbRecords.filter(r => r.is_adverse),
    });

  } catch (error: any) {
    console.error('[WEATHER-AGENT] Error:', error);
    await agentAudit('WeatherIntelligenceAgent', userId).error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
