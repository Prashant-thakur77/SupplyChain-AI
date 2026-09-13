import { NextRequest, NextResponse } from "next/server"
import { agentClient } from "@/lib/agent-client"
import { supabaseServer } from "@/lib/supabase/server"
import { requireSelf } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

/** Agent health for the dashboard/header: service ping, last Sentinel scan per twin, pending decisions, alerts today. */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId")
  const started = Date.now()
  let service: { ok: boolean; provider?: string; model?: string; latency_ms?: number; error?: string }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    const res = await fetch(`${agentClient.base}/ping`, { signal: ctrl.signal, cache: "no-store" })
    clearTimeout(t)
    const j = await res.json()
    service = { ok: res.ok && j.status === "healthy", provider: j.provider, model: j.model, latency_ms: Date.now() - started }
  } catch (e) {
    service = { ok: false, error: (e as Error).message, latency_ms: Date.now() - started }
  }
  if (!userId) return NextResponse.json({ service })
  const self = await requireSelf(userId); if ("error" in self) return NextResponse.json({ service })  // service health is public; user stats are not

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  try {
    const [chains, scans, pending, alerts] = await Promise.all([
      supabaseServer.from("supply_chains").select("supply_chain_id, name").eq("user_id", userId),
      supabaseServer.from("agent_traces").select("supply_chain_id, started_at").eq("user_id", userId).eq("workflow_stage", "scan").order("started_at", { ascending: false }).limit(200),
      supabaseServer.from("decisions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pending"),
      supabaseServer.from("notifications").select("notification_id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since),
    ])
    const last: Record<string, string> = {}
    for (const s of scans.data ?? []) if (s.supply_chain_id && !last[s.supply_chain_id]) last[s.supply_chain_id] = s.started_at
    return NextResponse.json({
      service,
      twins: (chains.data ?? []).map((c) => ({ id: c.supply_chain_id, name: c.name, last_scan: last[c.supply_chain_id] ?? null })),
      pending_decisions: pending.count ?? 0,
      alerts_24h: alerts.count ?? 0,
    })
  } catch (e) {
    return NextResponse.json({ service, twins: [], pending_decisions: 0, alerts_24h: 0, db_error: (e as Error).message })
  }
}
