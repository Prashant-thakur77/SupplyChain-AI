import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (!b.text) return NextResponse.json({ error: "text is required" }, { status: 400 })
  try { return NextResponse.json(await agentClient.post("/contracts/parse", { text: b.text, user_id: b.userId ?? "system", supply_chain_id: b.supplyChainId ?? "" })) } catch (e) { const r = agentErrorResponse(e); return NextResponse.json(r.body, { status: r.status }) }
}
