// Server-side twin loading (service role). Pure mapping lives in lib/twin-mapping.ts.
import { supabaseServer } from "@/lib/supabase/server"
import { rowsToTwin } from "@/lib/twin-mapping"
import type { Twin } from "@/types/agent"

export { rowsToTwin, rfToTwin } from "@/lib/twin-mapping"
export type { Twin }

export async function loadTwinForAgent(id: string): Promise<Twin> {
  const [sc, n, e] = await Promise.all([
    supabaseServer.from("supply_chains").select("name").eq("supply_chain_id", id).maybeSingle(),
    supabaseServer.from("nodes").select("*").eq("supply_chain_id", id),
    supabaseServer.from("edges").select("*").eq("supply_chain_id", id),
  ])
  return rowsToTwin(id, sc.data?.name ?? "", n.data ?? [], e.data ?? [])
}
