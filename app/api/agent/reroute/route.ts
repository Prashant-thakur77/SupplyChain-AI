import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, guardSavedTwin } from "@/lib/auth-server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { loadTwinForAgent, rfToTwin } from "@/lib/server/twin"

export const maxDuration = 30

/** Raw routing-engine access: { supplyChainId | nodes+edges, failedNodeIds, failedEdgeIds, k } → ReroutePlan */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const denied = await guardSavedTwin(body); if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })
  try {
    const twin = body.nodes ? rfToTwin(body.nodes, body.edges ?? [], body.supplyChainId ?? "canvas") : await loadTwinForAgent(body.supplyChainId)
    const plan = await agentClient.post("/reroute", {
      supply_chain_id: twin.supply_chain_id, failed_node_ids: body.failedNodeIds ?? [], failed_edge_ids: body.failedEdgeIds ?? [], k: body.k ?? 3, twin,
    })
    return NextResponse.json(plan)
  } catch (e) {
    const { body: eb, status } = agentErrorResponse(e)
    return NextResponse.json(eb, { status })
  }
}
