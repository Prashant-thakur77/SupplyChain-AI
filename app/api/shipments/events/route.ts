import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/** Carrier / forwarder milestone intake (webhook). Header `x-tracking-secret` must match TRACKING_WEBHOOK_SECRET when set.
 *  Body: { supplyChainId, reference, event, at?, location?, eta?, progress?, status? } */
export async function POST(req: NextRequest) {
  const secret = process.env.TRACKING_WEBHOOK_SECRET
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ error: "set TRACKING_WEBHOOK_SECRET to accept carrier webhooks" }, { status: 503 })
  if (secret && req.headers.get("x-tracking-secret") !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  if (!b.supplyChainId || !b.reference || !b.event) return NextResponse.json({ error: "supplyChainId, reference and event are required" }, { status: 400 })
  const { data: s } = await supabaseServer.from("shipments").select("id, planned_eta").eq("supply_chain_id", b.supplyChainId).eq("reference", b.reference).maybeSingle()
  if (!s) return NextResponse.json({ error: "unknown shipment reference" }, { status: 404 })
  const ev = String(b.event).toLowerCase()
  const status = b.status ?? (ev.includes("arriv") ? "arrived" : ev.includes("delay") || ev.includes("hold") || ev.includes("roll") ? "delayed" : ev.includes("cancel") ? "cancelled" : "in_transit")
  await supabaseServer.from("shipment_events").insert({ shipment_id: s.id, at: b.at ?? new Date().toISOString(), event: b.event, location: b.location ?? null, eta: b.eta ?? null, progress: b.progress ?? null, raw: b })
  await supabaseServer.from("shipments").update({ status, current_eta: b.eta ?? undefined, progress: b.progress ?? undefined, last_event: `${b.event}${b.location ? ` · ${b.location}` : ""}`, last_event_at: b.at ?? new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", s.id)
  return NextResponse.json({ ok: true, status })
}
