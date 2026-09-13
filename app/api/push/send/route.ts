import { NextRequest, NextResponse } from "next/server"
import { pushToUser } from "@/lib/push/server"

/** Internal: the agent-service (or cron) posts { userId, title, body, url?, tag? } with x-agent-secret. */
export async function POST(req: NextRequest) {
  const secret = process.env.AGENT_SERVICE_SECRET
  if (secret && req.headers.get("x-agent-secret") !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  if (!b.userId || !b.title) return NextResponse.json({ error: "userId and title required" }, { status: 400 })
  const sent = await pushToUser(b.userId, { title: b.title, body: b.body ?? "", url: b.url, tag: b.tag, actions: b.actions })
  return NextResponse.json({ sent })
}
