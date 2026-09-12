import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { agentAudit } from "@/lib/audit-logger"
import { loadTwinForAgent } from "@/lib/server/twin"
import { supabaseServer } from "@/lib/supabase/server"

export const maxDuration = 120

/** Simulation impact report (Strands `simulation` agent over deterministic blast-radius / reroute / Monte Carlo facts).
 *  Cached in simulations.result_summary. Response: { success, data } — same contract as before. */
async function assess(simulationId: string, forceRefresh: boolean) {
  const { data: sim, error } = await supabaseServer.from("simulations").select("*").eq("simulation_id", simulationId).single()
  if (error || !sim) throw new Error(`Simulation ${simulationId} not found`)
  const cached = (sim.result_summary as any)?.agentReport
  if (cached && !forceRefresh) return { data: cached, cached: true }
  if (!sim.supply_chain_id) throw new Error("Simulation has no supply_chain_id")

  const twin = await loadTwinForAgent(sim.supply_chain_id)
  const started = Date.now()
  const report = await agentClient.post("/reports/simulation", {
    supply_chain_id: sim.supply_chain_id, user_id: "system",
    simulation: { simulation_id: sim.simulation_id, name: sim.name, scenario_type: sim.scenario_type, parameters: sim.parameters }, twin,
  })
  const data = { ...report, processingTime: Date.now() - started, simulationId }
  await supabaseServer.from("simulations")
    .update({ status: "completed", simulated_at: new Date().toISOString(), result_summary: { ...(sim.result_summary as any ?? {}), agentReport: data } })
    .eq("simulation_id", simulationId)
  return { data, cached: false }
}

export async function GET(request: NextRequest) {
  const simulationId = new URL(request.url).searchParams.get("simulationId")
  if (!simulationId) return NextResponse.json({ success: false, error: "Simulation ID is required" }, { status: 400 })
  try {
    const { data, cached } = await assess(simulationId, false)
    return NextResponse.json({ success: true, data, cached })
  } catch (e) {
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json({ success: false, ...body }, { status })
  }
}

export async function POST(request: NextRequest) {
  const { simulationId, forceRefresh = false } = await request.json()
  if (!simulationId) return NextResponse.json({ success: false, error: "Simulation ID is required" }, { status: 400 })
  const audit = agentAudit("SimulationAgent", "system")
  try {
    audit.start(`Impact assessment for simulation ${simulationId}`)
    const { data, cached } = await assess(simulationId, forceRefresh)
    audit.success(`Impact assessment ${cached ? "served from cache" : "completed"} for ${simulationId}`)
    return NextResponse.json({ success: true, data, enhanced: true, cached, timestamp: new Date().toISOString() })
  } catch (e) {
    audit.error(String((e as Error).message))
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json({ success: false, ...body }, { status })
  }
}
