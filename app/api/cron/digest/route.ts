import { NextRequest, NextResponse } from "next/server"
import { buildDigest, digestText } from "@/lib/digest"
import { supabaseServer } from "@/lib/supabase/server"

export const maxDuration = 120
/** Weekly (Cloud Scheduler, Monday 07:00): one digest per user with a webhook configured on any of their twins. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && (req.headers.get("authorization") ?? "") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { data: policies } = await supabaseServer.from("autonomy_policies").select("user_id, webhook_url").not("webhook_url", "is", null)
  const byUser = new Map<string, string>()
  for (const p of policies ?? []) if (p.user_id && p.webhook_url && !byUser.has(p.user_id)) byUser.set(p.user_id, p.webhook_url)
  if (process.env.DECISION_WEBHOOK_URL) { const { data: users } = await supabaseServer.from("users").select("id"); for (const u of users ?? []) if (!byUser.has(u.id)) byUser.set(u.id, process.env.DECISION_WEBHOOK_URL) }
  const sent: string[] = []
  for (const [userId, url] of byUser) {
    const d = await buildDigest(userId, 7)
    const ok = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: digestText(d) }) }).then((r) => r.ok).catch(() => false)
    if (ok) sent.push(userId)
  }
  return NextResponse.json({ ok: true, sent: sent.length, at: new Date().toISOString() })
}
