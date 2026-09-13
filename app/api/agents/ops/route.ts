import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** Agent Ops: aggregates over agent_traces for the user (last N days). */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const userId = sp.get("userId"); const days = Math.min(90, Math.max(1, Number(sp.get("days") ?? 7)))
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data, error } = await supabaseServer.from("agent_traces").select("session_id, agent_name, workflow_stage, started_at, duration_ms, success, input_tokens, output_tokens, supply_chain_id")
    .eq("user_id", userId).gte("started_at", since).order("started_at", { ascending: false }).limit(5000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = data ?? []
  const byAgent: Record<string, { runs: number; ms: number; fail: number; tokens: number; p95: number[] }> = {}
  const byStage: Record<string, { runs: number; ms: number }> = {}
  const byDay: Record<string, number> = {}
  let tokens = 0, fails = 0
  for (const r of rows) {
    const a = (byAgent[r.agent_name] ??= { runs: 0, ms: 0, fail: 0, tokens: 0, p95: [] })
    a.runs++; a.ms += r.duration_ms ?? 0; a.p95.push(r.duration_ms ?? 0); if (r.success === false) { a.fail++; fails++ }
    const t = (r.input_tokens ?? 0) + (r.output_tokens ?? 0); a.tokens += t; tokens += t
    const s = (byStage[r.workflow_stage ?? "other"] ??= { runs: 0, ms: 0 }); s.runs++; s.ms += r.duration_ms ?? 0
    const d = r.started_at.slice(0, 10); byDay[d] = (byDay[d] ?? 0) + 1
  }
  const sessions = new Set(rows.map((r) => r.session_id)).size
  // Estimate accuracy: decisions with recorded outcomes (all time, this user's chains)
  const { data: chains } = await supabaseServer.from("supply_chains").select("supply_chain_id").eq("user_id", userId)
  const chainIds = (chains ?? []).map((c) => c.supply_chain_id)
  const { data: outs } = chainIds.length ? await supabaseServer.from("decision_outcomes").select("estimated_added_cost, estimated_added_days, actual_added_cost, actual_added_days, outcome, created_at").in("supply_chain_id", chainIds).order("created_at", { ascending: false }).limit(500) : { data: [] as any[] }
  const costPairs = (outs ?? []).filter((o) => o.estimated_added_cost != null && o.actual_added_cost != null && Number(o.estimated_added_cost) > 0)
  const dayPairs = (outs ?? []).filter((o) => o.estimated_added_days != null && o.actual_added_days != null)
  const mape = costPairs.length ? costPairs.reduce((a, o) => a + Math.abs(Number(o.actual_added_cost) - Number(o.estimated_added_cost)) / Number(o.estimated_added_cost), 0) / costPairs.length : null
  const costBias = costPairs.length ? costPairs.reduce((a, o) => a + (Number(o.actual_added_cost) - Number(o.estimated_added_cost)) / Number(o.estimated_added_cost), 0) / costPairs.length : null
  const daysMae = dayPairs.length ? dayPairs.reduce((a, o) => a + Math.abs(Number(o.actual_added_days) - Number(o.estimated_added_days)), 0) / dayPairs.length : null
  const daysBias = dayPairs.length ? dayPairs.reduce((a, o) => a + (Number(o.actual_added_days) - Number(o.estimated_added_days)), 0) / dayPairs.length : null
  const resolved = (outs ?? []).filter((o) => o.outcome === "resolved").length
  const accuracy = { outcomes: (outs ?? []).length, resolved_pct: outs?.length ? Math.round((100 * resolved) / outs.length) : null, cost_mape_pct: mape != null ? Math.round(mape * 100) : null, cost_bias_pct: costBias != null ? Math.round(costBias * 100) : null, days_mae: daysMae != null ? Math.round(daysMae * 10) / 10 : null, days_bias: daysBias != null ? Math.round(daysBias * 10) / 10 : null }
  const p95 = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] }
  return NextResponse.json({
    days, runs: rows.length, sessions, fails, tokens,
    est_cost_usd: Math.round((tokens / 1e6) * 0.5 * 100) / 100, // blended planning estimate (~$0.50/M tokens on flash-class models)
    agents: Object.entries(byAgent).map(([name, a]) => ({ name, runs: a.runs, avg_ms: Math.round(a.ms / a.runs), p95_ms: p95(a.p95), fail: a.fail, tokens: a.tokens })).sort((a, b) => b.runs - a.runs),
    stages: Object.entries(byStage).map(([stage, s]) => ({ stage, runs: s.runs, avg_ms: Math.round(s.ms / s.runs) })).sort((a, b) => b.runs - a.runs),
    by_day: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, n]) => ({ day, runs: n })),
    recent: rows.slice(0, 40),
    accuracy,
  })
}
