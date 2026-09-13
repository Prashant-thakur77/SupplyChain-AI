import { supabaseServer } from "@/lib/supabase/server"
import { fetchRecords } from "./fetch"
import { presetConfig } from "./presets"
import { mapRecord, type ConnectorEntity, type ConnectorKind } from "./types"

export interface SyncResult { count: number; skipped: number; unresolved: string[] }

/** Resolve a site reference (id, label, or case-insensitive name) to a node id on this chain. */
export function makeResolver(nodes: { node_id: string; data: any }[]) {
  const byId = new Map(nodes.map((n) => [n.node_id.toLowerCase(), n.node_id]))
  const byLabel = new Map(nodes.map((n) => [String(n.data?.label ?? "").trim().toLowerCase(), n.node_id]))
  return (ref: unknown) => { const r = String(ref ?? "").trim().toLowerCase(); return byId.get(r) ?? byLabel.get(r) ?? null }
}

export async function runConnector(c: { id: string; supply_chain_id: string; user_id: string | null; kind: ConnectorKind; entity: ConnectorEntity; config: any }, fetchImpl?: typeof fetch): Promise<SyncResult> {
  const cfg = presetConfig(c.kind, c.entity, c.config ?? {})
  const raw = await fetchRecords(c.kind, cfg, fetchImpl)
  const { data: nodes } = await supabaseServer.from("nodes").select("node_id, data").eq("supply_chain_id", c.supply_chain_id)
  const resolve = makeResolver(nodes ?? [])
  const unresolved = new Set<string>()
  const rows: Record<string, unknown>[] = []
  for (const r of raw) {
    const m = mapRecord(r, c.entity, cfg.fields)
    const o = resolve(m.origin), d = resolve(m.destination)
    if (!o) unresolved.add(String(m.origin ?? "?")); if (!d) unresolved.add(String(m.destination ?? "?"))
    if (!o || !d) continue
    if (c.entity === "flows") rows.push({ supply_chain_id: c.supply_chain_id, user_id: c.user_id, origin_node_id: o, destination_node_id: d, product: m.product ?? "Imported", units_per_week: Number(m.units_per_week ?? 0), value_per_unit: Number(m.value_per_unit ?? 0), lead_time_days: Number(m.lead_time_days ?? 0), penalty_per_day: Number(m.penalty_per_day ?? 0), inventory_days: Number(m.inventory_days ?? 0), active: true, updated_at: new Date().toISOString() })
    else if (m.reference) rows.push({ supply_chain_id: c.supply_chain_id, user_id: c.user_id, reference: String(m.reference), origin_node_id: o, destination_node_id: d, mode: String(m.mode ?? "sea").toLowerCase(), carrier: m.carrier ?? null, etd: m.etd || null, planned_eta: m.planned_eta || null, current_eta: m.planned_eta || null, value_usd: Number(m.value_usd ?? 0), status: m.status ?? (m.etd && new Date(String(m.etd)) < new Date() ? "in_transit" : "planned"), updated_at: new Date().toISOString() })
  }
  if (rows.length) {
    const { error } = c.entity === "flows"
      ? await supabaseServer.from("flows").upsert(rows, { onConflict: "supply_chain_id,origin_node_id,destination_node_id,product" })
      : await supabaseServer.from("shipments").upsert(rows, { onConflict: "supply_chain_id,reference" })
    if (error) throw new Error(error.message)
  }
  return { count: rows.length, skipped: raw.length - rows.length, unresolved: [...unresolved].slice(0, 10) }
}

/** Run one connector and record the outcome on its row. */
export async function syncConnector(id: string, fetchImpl?: typeof fetch) {
  const { data: c } = await supabaseServer.from("connectors").select("*").eq("id", id).maybeSingle()
  if (!c) throw new Error("connector not found")
  try {
    const r = await runConnector(c, fetchImpl)
    await supabaseServer.from("connectors").update({ last_sync_at: new Date().toISOString(), last_status: "ok", last_error: r.unresolved.length ? `unresolved sites: ${r.unresolved.join(", ")}` : null, last_count: r.count, updated_at: new Date().toISOString() }).eq("id", id)
    return r
  } catch (e) {
    await supabaseServer.from("connectors").update({ last_sync_at: new Date().toISOString(), last_status: "error", last_error: (e as Error).message, updated_at: new Date().toISOString() }).eq("id", id)
    throw e
  }
}
