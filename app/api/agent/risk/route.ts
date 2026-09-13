import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { requireChainAccess } from "@/lib/auth-server"
import { loadTwinForAgent } from "@/lib/server/twin"
export const maxDuration = 30
/** Explainable site risk scores. Body: { supplyChainId, userId, persist? } → { scores: [{ node_id, label, score(0-5), level, components, reasons }] } */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const g = await requireChainAccess(b.supplyChainId, !!b.persist); if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  try {
    const twin = await loadTwinForAgent(b.supplyChainId)
    return NextResponse.json(await agentClient.post("/risk/recompute", { supply_chain_id: twin.supply_chain_id, user_id: g.user.id, twin, persist: !!b.persist }))
  } catch (e) { const { body, status } = agentErrorResponse(e); return NextResponse.json(body, { status }) }
}
