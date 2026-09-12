import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { rfToTwin } from "@/lib/server/twin"
import type { ReroutePlan, RouteCandidate } from "@/types/agent"

export const maxDuration = 60

/** Deterministic reroute around a failed node. Response keeps the legacy keys (severity/impactDescription/alternateRoutes)
 *  and adds the exact candidates from the routing engine. */
export async function POST(req: NextRequest) {
  const { nodeId, description, nodes, edges, supplyChainId } = await req.json()
  if (!nodeId) return NextResponse.json({ error: "nodeId is required" }, { status: 400 })
  const twin = rfToTwin(nodes ?? [], edges ?? [], supplyChainId ?? "canvas")
  try {
    const plan = await agentClient.post<ReroutePlan>("/reroute", { supply_chain_id: twin.supply_chain_id, failed_node_ids: [nodeId], twin })
    const severity = plan.severity === "CRITICAL" || plan.severity === "HIGH" ? "High" : plan.severity === "MEDIUM" ? "Medium" : "Low"
    const alternateRoutes = plan.candidates
      .filter((c: RouteCandidate) => c.feasible)
      .slice(0, 3)
      .map((c: RouteCandidate) => `${c.labels.join(" → ")} (+$${Math.round(c.added_cost).toLocaleString()}, +${Math.round(c.added_days)}d)`)
    if (plan.infeasible_count > 0) alternateRoutes.push(`${plan.infeasible_count} lane(s) have no full bypass (partial — full bypass unavailable)`)
    return NextResponse.json({
      severity,
      impactDescription: `${plan.feasible_count} lane(s) can be rerouted deterministically; ${plan.infeasible_count} cannot.${description ? ` Disruption: ${description}` : ""}`,
      alternateRoutes,
      candidates: plan.candidates,
      severed_pairs: plan.severed_pairs,
      baseline: plan.baseline,
    })
  } catch (e) {
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json(body, { status })
  }
}
