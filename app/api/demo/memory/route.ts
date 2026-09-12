import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { demoTwin } from "@/lib/demo-twin"

/** Demo learning loop: remember an approved/rejected demo decision so the next demo run shows "Last time this happened". */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (!b.title || !b.status) return NextResponse.json({ error: "title and status are required" }, { status: 400 })
  try {
    const out = await agentClient.post("/memory", { supply_chain_id: demoTwin.supply_chain_id, user_id: "demo", title: String(b.title).slice(0, 200), status: b.status, option_label: b.option_label ?? null, added_cost: b.added_cost ?? null, added_days: b.added_days ?? null })
    return NextResponse.json(out)
  } catch (e) {
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json(body, { status })
  }
}
