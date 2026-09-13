import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { syncConnector } from "@/lib/connectors/sync"

/** Cron: run every enabled connector whose schedule has elapsed. Protected by CRON_SECRET like the other cron routes. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { data } = await supabaseServer.from("connectors").select("id, schedule_minutes, last_sync_at").eq("enabled", true)
  const due = (data ?? []).filter((c) => !c.last_sync_at || Date.now() - new Date(c.last_sync_at).getTime() >= c.schedule_minutes * 60000)
  const results: Record<string, unknown> = {}
  for (const c of due) results[c.id] = await syncConnector(c.id).catch((e) => ({ error: (e as Error).message }))
  return NextResponse.json({ due: due.length, results })
}
