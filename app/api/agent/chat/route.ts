import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { loadTwinForAgent, rfToTwin } from "@/lib/server/twin"

export const maxDuration = 90

/** Streams the Strands copilot (SSE: token / tool / final). Body: { supplyChainId, userId, message, nodes?, edges? } */
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.message) return NextResponse.json({ error: "message is required" }, { status: 400 })
  try {
    const id = body.supplyChainId ?? "canvas"
    const twin = body.nodes ? rfToTwin(body.nodes, body.edges ?? [], id) : body.supplyChainId ? await loadTwinForAgent(id) : undefined
    return await agentClient.proxyStream("/chat", { supply_chain_id: id, user_id: body.userId ?? "anonymous", message: body.message, history: Array.isArray(body.history) ? body.history.slice(-20) : [], twin })
  } catch (e) {
    const { body: eb, status } = agentErrorResponse(e)
    return NextResponse.json(eb, { status })
  }
}
