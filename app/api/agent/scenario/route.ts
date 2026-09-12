import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { agentAudit } from "@/lib/audit-logger"
import { loadTwinForAgent } from "@/lib/server/twin"
import { supabaseServer } from "@/lib/supabase/server"

export const maxDuration = 90

/** What-if scenarios (Strands `scenario` agent). Stored as `simulations` rows with status 'generated' (unchanged). */
async function generate(supplyChainId: string, count: number) {
  const twin = await loadTwinForAgent(supplyChainId)
  const out = await agentClient.post("/scenario", { supply_chain_id: supplyChainId, user_id: "system", disruption_type: "all", twin })
  const labels = new Map(twin.nodes.map((n) => [n.id, n.label]))
  const scenarios = (out.scenarios as any[]).slice(0, count).map((s) => ({
    scenarioName: s.title,
    scenarioType: s.disruption_type.toUpperCase(),
    disruptionSeverity: Math.round(60 + s.probability * 35),
    disruptionDuration: s.duration_days,
    affectedNode: s.failed_node_ids[0] ?? null,
    affectedNodeLabel: labels.get(s.failed_node_ids[0]) ?? s.failed_node_ids[0] ?? null,
    affected_nodes: s.failed_node_ids,
    description: s.description,
    probability: s.probability,
  }))
  if (scenarios.length) {
    await supabaseServer.from("simulations").insert(scenarios.map((s) => ({ supply_chain_id: supplyChainId, name: s.scenarioName, scenario_type: s.scenarioType, parameters: s, status: "generated" })))
  }
  return { success: true, scenarios, generatedAt: new Date().toISOString() }
}

export async function POST(request: NextRequest) {
  const { supplyChainId, scenarioCount = 3 } = await request.json().catch(() => ({}))
  if (!supplyChainId) return NextResponse.json({ error: "Missing supplyChainId" }, { status: 400 })
  const audit = agentAudit("ScenarioAgent", "system")
  try {
    audit.start(`Generating ${scenarioCount} scenarios for ${supplyChainId}`)
    const result = await generate(supplyChainId, scenarioCount)
    audit.success(`Generated ${result.scenarios.length} scenarios`)
    return NextResponse.json(result)
  } catch (e) {
    audit.error(String((e as Error).message))
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json({ success: false, ...body }, { status })
  }
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const supplyChainId = sp.get("supplyChainId") ?? sp.get("supply_chain_id")
  if (!supplyChainId) return NextResponse.json({ error: "Missing supplyChainId" }, { status: 400 })
  if (sp.get("from_cache") === "true") {
    const { data } = await supabaseServer.from("simulations").select("parameters, created_at").eq("supply_chain_id", supplyChainId).eq("status", "generated").order("created_at", { ascending: false }).limit(6)
    return NextResponse.json({ success: true, scenarios: (data ?? []).map((r) => r.parameters), cached: true })
  }
  try {
    return NextResponse.json(await generate(supplyChainId, 3))
  } catch (e) {
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json({ success: false, ...body }, { status })
  }
}
