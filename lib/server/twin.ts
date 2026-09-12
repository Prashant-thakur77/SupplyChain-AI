// Server-side twin loading/mapping into the agent-service `Twin` shape (mirror of agent-service/db.rows_to_twin).
import { supabaseServer } from "@/lib/supabase/server"
import type { Twin } from "@/types/agent"

const num = (x: unknown, d = 0): number => {
  const n = Number(x)
  return Number.isFinite(n) ? n : d
}

export function rowsToTwin(id: string, name: string, nodes: any[], edges: any[]): Twin {
  return {
    supply_chain_id: id,
    name,
    nodes: nodes.map((n) => ({
      id: n.node_id, label: n.data?.label ?? n.name ?? n.node_id, type: n.type ?? n.data?.type ?? "warehouse",
      lat: n.location_lat ?? n.data?.lat ?? null, lng: n.location_lng ?? n.data?.lng ?? null, country: n.data?.country ?? null,
      capacity: num(n.capacity), risk_level: num(n.risk_level), data: n.data ?? {},
    })),
    edges: edges
      .filter((e) => (e.from_node_id ?? e.data?.source) && (e.to_node_id ?? e.data?.target))
      .map((e) => ({
        id: e.edge_id, source: e.from_node_id ?? e.data?.source, target: e.to_node_id ?? e.data?.target, mode: e.data?.mode ?? "road",
        cost: num(e.data?.cost), transit_days: num(e.data?.transitTime ?? e.data?.transit_days), risk_multiplier: num(e.data?.riskMultiplier, 1) || 1,
      })),
  }
}

/** React Flow canvas state (unsaved twins, demo) → agent Twin. */
export function rfToTwin(nodes: any[], edges: any[], id: string, name = "canvas"): Twin {
  return {
    supply_chain_id: id,
    name,
    nodes: nodes.map((n) => ({
      id: n.id, label: n.data?.label ?? n.data?.name ?? n.id, type: n.type ?? n.data?.type ?? "warehouse",
      lat: n.data?.lat ?? n.data?.location_lat ?? n.data?.location?.lat ?? null, lng: n.data?.lng ?? n.data?.location_lng ?? n.data?.location?.lng ?? null,
      country: n.data?.country ?? null, capacity: num(n.data?.capacity), risk_level: num(n.data?.riskLevel ?? n.data?.risk_level), data: n.data ?? {},
    })),
    edges: edges.map((e) => ({
      id: e.id, source: e.source, target: e.target, mode: e.data?.mode ?? "road", cost: num(e.data?.cost),
      transit_days: num(e.data?.transitTime ?? e.data?.transit_days), risk_multiplier: num(e.data?.riskMultiplier, 1) || 1,
    })),
  }
}

export async function loadTwinForAgent(id: string): Promise<Twin> {
  const [sc, n, e] = await Promise.all([
    supabaseServer.from("supply_chains").select("name").eq("supply_chain_id", id).maybeSingle(),
    supabaseServer.from("nodes").select("*").eq("supply_chain_id", id),
    supabaseServer.from("edges").select("*").eq("supply_chain_id", id),
  ])
  return rowsToTwin(id, sc.data?.name ?? "", n.data ?? [], e.data ?? [])
}
