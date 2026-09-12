import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { agentAudit } from "@/lib/audit-logger"
import { loadTwinForAgent } from "@/lib/server/twin"
import { supabaseServer } from "@/lib/supabase/server"

export const maxDuration = 120

/** Forecast scenarios (Strands `forecast_report` agent). Persists to `forecasts`; response contract unchanged. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const supplyChainId: string | undefined = body.supplyChainId
  const forecastHorizon: number = Number(body.forecastHorizon ?? 30)
  if (!supplyChainId) return NextResponse.json({ error: "supplyChainId is required" }, { status: 400 })
  const started = Date.now()
  const audit = agentAudit("ForecastAgent", "system")
  try {
    audit.start(`Forecast for ${supplyChainId}`)
    const twin = await loadTwinForAgent(supplyChainId)
    const nodeLabel = body.nodeId ? twin.nodes.find((n) => n.id === body.nodeId)?.label : undefined
    const out = await agentClient.post("/reports/forecast", { supply_chain_id: supplyChainId, user_id: "system", horizon_days: forecastHorizon, node_label: nodeLabel, twin })
    const now = Date.now()
    const scenarios = out.scenarios.map((s: any, i: number) => ({
      ...s,
      startDate: new Date(now + (i + 1) * 2 * 86400000).toISOString(),
      endDate: new Date(now + (i + 1) * 2 * 86400000 + s.disruptionDuration * 86400000).toISOString(),
      randomSeed: `forecast-ai-${supplyChainId.substring(0, 8)}-${i}`,
    }))
    const { data: saved, error: saveError } = await supabaseServer.from("forecasts").insert({
      supply_chain_id: supplyChainId, node_id: body.nodeId ?? null,
      forecast_data: { summary: out.forecastSummary, overallRiskScore: out.overallRiskScore, generatedAt: new Date().toISOString(), nodeCount: twin.nodes.length, edgeCount: twin.edges.length },
      scenario_json: scenarios, confidence_score: out.confidenceScore, risk_score: out.overallRiskScore, forecast_period: forecastHorizon,
      forecast_start_date: new Date().toISOString(), forecast_end_date: new Date(now + forecastHorizon * 86400000).toISOString(),
    }).select("forecast_id").single()
    audit.success(`Forecast generated: ${scenarios.length} scenarios`)
    return NextResponse.json({
      success: true,
      forecast: { summary: out.forecastSummary, overallRiskScore: out.overallRiskScore, confidenceScore: out.confidenceScore, scenarios },
      metadata: { processingTime: Date.now() - started, generated: new Date().toISOString(), supplyChainId, nodeId: body.nodeId, forecastHorizon, savedToDatabase: !saveError, forecastId: saved?.forecast_id },
    })
  } catch (e) {
    audit.error(String((e as Error).message))
    const { body: eb, status } = agentErrorResponse(e)
    return NextResponse.json({ error: "Error generating forecast", message: eb.detail }, { status })
  }
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const supply_chain_id = sp.get("supply_chain_id") ?? sp.get("supplyChainId")
  const node_id = sp.get("node_id")
  if (!supply_chain_id) return NextResponse.json({ error: "supply_chain_id is required" }, { status: 400 })
  let q = supabaseServer.from("forecasts").select("*").eq("supply_chain_id", supply_chain_id).order("created_at", { ascending: false })
  if (node_id) q = q.eq("node_id", node_id)
  const { data, error } = await q.limit(node_id ? 1 : 20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, forecasts: data ?? [] })
}
