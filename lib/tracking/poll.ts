import { supabaseServer } from "@/lib/supabase/server"
import { getProvider } from "./providers"

/** Ask the tracking provider for every open shipment on a chain and persist status / ETA / progress. Returns counts. */
export async function pollShipments(supplyChainId: string): Promise<{ polled: number; updated: number; newlyDelayed: number }> {
  const { data } = await supabaseServer.from("shipments").select("id, reference, etd, planned_eta, status").eq("supply_chain_id", supplyChainId).in("status", ["planned", "in_transit", "delayed"])
  const rows = data ?? []
  if (!rows.length) return { polled: 0, updated: 0, newlyDelayed: 0 }
  const updates = await getProvider().poll(rows)
  let updated = 0, newlyDelayed = 0
  for (const u of updates) {
    const row = rows.find((s) => s.reference === u.reference); if (!row) continue
    const { error } = await supabaseServer.from("shipments").update({ status: u.status, progress: u.progress, current_eta: u.current_eta, last_event: u.last_event, last_event_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id)
    if (!error) updated++
    if (u.status === "delayed" && row.status !== "delayed") { newlyDelayed++; await supabaseServer.from("shipment_events").insert({ shipment_id: row.id, event: "delayed", eta: u.current_eta, progress: u.progress, raw: { provider: getProvider().name } }) }
  }
  return { polled: rows.length, updated, newlyDelayed }
}
