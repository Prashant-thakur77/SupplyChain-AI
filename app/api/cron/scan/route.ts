import { NextRequest, NextResponse } from "next/server"
import { agentClient } from "@/lib/agent-client"
import { supabaseServer } from "@/lib/supabase/server"

export const maxDuration = 300
const MIN_INTERVAL_MS = 15 * 60 * 1000
const CONCURRENCY = 2

/** Server-driven background loop (Cloud Scheduler → here → agent-service /scan per twin).
 *  Idempotent: a twin scanned within the last 15 minutes is skipped. Auth: Authorization: Bearer $CRON_SECRET */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization") ?? ""
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data: chains, error } = await supabaseServer.from("supply_chains").select("supply_chain_id, user_id, name").not("user_id", "is", null)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const since = new Date(Date.now() - MIN_INTERVAL_MS).toISOString()
  const { data: recent } = await supabaseServer.from("agent_traces").select("supply_chain_id").eq("workflow_stage", "scan").gte("started_at", since)
  const recentlyScanned = new Set((recent ?? []).map((r) => r.supply_chain_id))

  // Decision SLA: expire pending decisions older than the twin's policy (default 48h).
  const { data: policies } = await supabaseServer.from("autonomy_policies").select("supply_chain_id, expire_hours")
  const expireHours = new Map((policies ?? []).map((p) => [p.supply_chain_id, Number(p.expire_hours) || 48]))
  const { data: pending } = await supabaseServer.from("decisions").select("id, supply_chain_id, created_at").eq("status", "pending")
  const toExpire = (pending ?? []).filter((d) => Date.now() - new Date(d.created_at).getTime() > (expireHours.get(d.supply_chain_id) ?? 48) * 3600 * 1000).map((d) => d.id)
  if (toExpire.length) await supabaseServer.from("decisions").update({ status: "expired", decided_at: new Date().toISOString() }).in("id", toExpire)

  const due = (chains ?? []).filter((c) => !recentlyScanned.has(c.supply_chain_id))
  const results: any[] = []
  for (let i = 0; i < due.length; i += CONCURRENCY) {
    const batch = due.slice(i, i + CONCURRENCY)
    const out = await Promise.all(batch.map(async (c) => {
      try {
        const r = await agentClient.post("/scan", { supply_chain_id: c.supply_chain_id, user_id: c.user_id })
        return { supplyChainId: c.supply_chain_id, name: c.name, scanned: r.scanned, processed: r.processed.length, decisions: r.processed.filter((p: any) => p.decision_id).length }
      } catch (e) {
        return { supplyChainId: c.supply_chain_id, name: c.name, error: (e as Error).message }
      }
    }))
    results.push(...out)
  }
  return NextResponse.json({ ok: true, total: chains?.length ?? 0, skipped: recentlyScanned.size, scanned: results.length, expired: toExpire.length, results, at: new Date().toISOString() })
}
