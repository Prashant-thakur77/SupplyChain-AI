import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"

export const maxDuration = 60

/** Twin-builder suggestions via the Strands `suggestions` agent. Accepts the legacy { messages: [{role, content}] } body. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const messages: Array<{ role: string; content: string }> = body?.messages ?? []
  const last = [...messages].reverse().find((m) => m.role === "user")
  if (!last?.content) return NextResponse.json({ error: "Invalid request", message: "messages[] with a user message is required" }, { status: 400 })
  try {
    const out = await agentClient.post("/suggestions", { supply_chain_id: body.supplyChainId ?? "canvas", user_id: body.userId ?? "anonymous", prompt: last.content })
    return NextResponse.json({ suggestions: out.suggestions })
  } catch (e) {
    const { body: eb, status } = agentErrorResponse(e)
    return NextResponse.json({ suggestions: [], ...eb }, { status })
  }
}
