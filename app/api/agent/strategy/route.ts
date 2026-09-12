import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { agentAudit } from "@/lib/audit-logger"
import { loadTwinForAgent } from "@/lib/server/twin"
import { supabaseServer } from "@/lib/supabase/server"

export const maxDuration = 120

/** Mitigation strategy portfolio for a simulation. Response: { success, data: StrategyReport } (unchanged contract). */
async function strategise(simulationId: string, forceRefresh: boolean) {
  const { data: sim, error } = await supabaseServer.from("simulations").select("*").eq("simulation_id", simulationId).single()
  if (error || !sim) throw new Error(`Simulation ${simulationId} not found`)
  const summary = (sim.result_summary as any) ?? {}
  if (summary.strategyReport && !forceRefresh) return summary.strategyReport
  if (!sim.supply_chain_id) throw new Error("Simulation has no supply_chain_id")
  const twin = await loadTwinForAgent(sim.supply_chain_id)
  const report = await agentClient.post("/reports/strategy", {
    supply_chain_id: sim.supply_chain_id, user_id: "system",
    simulation: { simulation_id: sim.simulation_id, name: sim.name, scenario_type: sim.scenario_type, parameters: sim.parameters },
    impact: summary.agentReport ?? null, twin,
  })
  await supabaseServer.from("simulations").update({ result_summary: { ...summary, strategyReport: report } }).eq("simulation_id", simulationId)
  return report
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const simulationId = body.simulationId
  if (!simulationId) return NextResponse.json({ success: false, error: "Missing simulationId" }, { status: 400 })
  const audit = agentAudit("StrategyAgent", "system")
  try {
    audit.start(`Strategy analysis for simulation ${simulationId}`)
    const data = await strategise(simulationId, !!body.forceRefresh)
    audit.success(`Strategy analysis completed for ${simulationId}`)
    return NextResponse.json({ success: true, data })
  } catch (e) {
    audit.error(String((e as Error).message))
    const { body: eb, status } = agentErrorResponse(e)
    return NextResponse.json({ success: false, ...eb }, { status })
  }
}

export async function GET(request: NextRequest) {
  const simulationId = new URL(request.url).searchParams.get("simulationId")
  if (!simulationId) return NextResponse.json({ error: "Missing simulationId" }, { status: 400 })
  try {
    return NextResponse.json({ success: true, data: await strategise(simulationId, false) })
  } catch (e) {
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json({ success: false, ...body }, { status })
  }
}
