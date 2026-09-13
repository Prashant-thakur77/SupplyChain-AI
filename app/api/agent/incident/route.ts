import { NextRequest, NextResponse } from "next/server"
import { guardSavedTwin } from "@/lib/auth-server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { loadTwinForAgent, rfToTwin } from "@/lib/server/twin"

export const maxDuration = 180

/** Streams the incident graph (SSE). Body: { supplyChainId, userId, event, nodes?, edges?, persist? } */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const denied = await guardSavedTwin(body); if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })
  if (!body.event || !body.supplyChainId) return NextResponse.json({ error: "supplyChainId and event are required" }, { status: 400 })
  try {
    const twin = body.nodes ? rfToTwin(body.nodes, body.edges ?? [], body.supplyChainId) : await loadTwinForAgent(body.supplyChainId)
    return await agentClient.proxyStream("/incident", {
      supply_chain_id: body.supplyChainId, user_id: body.userId ?? "anonymous", event: body.event, twin, persist: body.persist ?? true,
    })
  } catch (e) {
    const { body: eb, status } = agentErrorResponse(e)
    return NextResponse.json(eb, { status })
  }
}
