// Weekly digest: what the agent did, what it cost, what it avoided. "Cost of inaction" = what waiting would have cost
// (delay days × value-at-risk/day + late penalties) minus what the chosen option cost.
import { supabaseServer } from "@/lib/supabase/server"

export interface Digest {
  period_days: number; from: string; to: string
  incidents: number; decisions: number; auto_approved: number; approved: number; rejected: number; expired: number; pending: number
  agent_runs: number; tokens: number; est_model_cost_usd: number
  avoided_usd: number; spent_on_reroutes_usd: number
  top: { title: string; status: string; chosen: string | null; avoided_usd: number; added_cost: number }[]
  scans: number
}

export async function buildDigest(userId: string, days = 7): Promise<Digest> {
  const from = new Date(Date.now() - days * 86400000), to = new Date()
  const [dec, traces, alerts, flows] = await Promise.all([
    supabaseServer.from("decisions").select("id, supply_chain_id, title, status, options, chosen_option_id, auto_approved, created_at, route_plans(candidate_id, path)").eq("user_id", userId).gte("created_at", from.toISOString()),
    supabaseServer.from("agent_traces").select("workflow_stage, input_tokens, output_tokens").eq("user_id", userId).gte("started_at", from.toISOString()),
    supabaseServer.from("notifications").select("notification_id", { count: "exact", head: true }).eq("user_id", userId).eq("notification_type", "supply_chain_alert").gte("created_at", from.toISOString()),
    supabaseServer.from("flows").select("supply_chain_id, origin_node_id, destination_node_id, units_per_week, value_per_unit, penalty_per_day").eq("user_id", userId).eq("active", true),
  ])
  const flowRows = flows.data ?? []
  const rows = dec.data ?? []
  let avoided = 0, spent = 0
  const top: Digest["top"] = []
  for (const d of rows) {
    const opts: any[] = d.options ?? []
    const wait = opts.find((o) => o.kind === "wait"), chosen = opts.find((o) => o.id === d.chosen_option_id)
    if (!chosen || (d.status !== "approved")) continue
    // Cost of waiting = wait days × value/day on the affected lane (from flows when known) + late penalties; fallback: a
    // conservative $/day derived from the reroute economics (one week of reroute ≈ the floor of a week of disruption).
    const rp = (d.route_plans ?? []).find((r: any) => r.candidate_id === d.chosen_option_id)
    const lane = rp?.path?.length ? { o: rp.path[0], t: rp.path[rp.path.length - 1] } : null
    const laneFlows = lane ? flowRows.filter((f) => f.supply_chain_id === d.supply_chain_id && f.origin_node_id === lane.o && f.destination_node_id === lane.t) : []
    const weekly = laneFlows.reduce((s, f) => s + Number(f.units_per_week) * Number(f.value_per_unit), 0)
    const penaltyPerDay = laneFlows.reduce((s, f) => s + Number(f.penalty_per_day ?? 0), 0)
    const perDay = weekly > 0 ? weekly / 7 + penaltyPerDay : Math.max(chosen.added_cost ?? 0, 500) / 7
    const waitCost = wait ? (wait.added_days ?? 0) * perDay + (wait.added_cost ?? 0) : 0
    const a = Math.max(0, waitCost - (chosen.added_cost ?? 0))
    avoided += a; spent += chosen.added_cost ?? 0
    top.push({ title: d.title, status: d.status, chosen: chosen.label, avoided_usd: Math.round(a), added_cost: Math.round(chosen.added_cost ?? 0) })
  }
  const tr = traces.data ?? []
  const tokens = tr.reduce((s, t) => s + (t.input_tokens ?? 0) + (t.output_tokens ?? 0), 0)
  return {
    period_days: days, from: from.toISOString(), to: to.toISOString(),
    incidents: rows.length, decisions: rows.length, auto_approved: rows.filter((d) => d.auto_approved).length, approved: rows.filter((d) => d.status === "approved").length,
    rejected: rows.filter((d) => d.status === "rejected").length, expired: rows.filter((d) => d.status === "expired").length, pending: rows.filter((d) => d.status === "pending").length,
    agent_runs: tr.length, tokens, est_model_cost_usd: Math.round((tokens / 1e6) * 0.5 * 100) / 100, avoided_usd: Math.round(avoided), spent_on_reroutes_usd: Math.round(spent),
    top: top.sort((a, b) => b.avoided_usd - a.avoided_usd).slice(0, 5), scans: tr.filter((t) => t.workflow_stage === "scan").length,
  }
}

export function digestText(d: Digest, appUrl = process.env.APP_URL ?? ""): string {
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`
  const lines = [
    `:newspaper: *SupplyChain AI — last ${d.period_days} days*`,
    `Incidents assessed: *${d.incidents}* · decisions: ${d.approved} approved (${d.auto_approved} by policy), ${d.rejected} rejected, ${d.expired} expired, ${d.pending} pending`,
    `Estimated cost of inaction avoided: *${money(d.avoided_usd)}* · spent on reroutes: ${money(d.spent_on_reroutes_usd)}`,
    `Agent: ${d.agent_runs} runs (${d.scans} background scans), ${d.tokens.toLocaleString()} tokens ≈ ${money(d.est_model_cost_usd)} model cost`,
  ]
  if (d.top.length) lines.push("Top decisions:", ...d.top.map((t) => `• ${t.title} → ${t.chosen} (avoided ≈ ${money(t.avoided_usd)}, cost ${money(t.added_cost)})`))
  if (appUrl) lines.push(`${appUrl.replace(/\/$/, "")}/decisions`)
  return lines.join("\n")
}
