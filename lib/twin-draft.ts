// Convert a TwinDraft (agent-service) into React Flow nodes/edges laid out by type columns (same convention as CSV import).
import type { Edge, Node } from "reactflow"

export interface DraftNode { id: string; label: string; type: string; city?: string | null; country?: string | null; lat?: number | null; lng?: number | null; capacity?: number | null; risk_level: number; note?: string | null }
export interface DraftEdge { source: string; target: string; mode: string; cost?: number | null; transit_days?: number | null }
export interface TwinDraft { name: string; summary: string; nodes: DraftNode[]; edges: DraftEdge[]; assumptions: string[]; questions: string[] }

const RF_TYPE: Record<string, string> = { supplier: "supplierNode", factory: "factoryNode", port: "portNode", warehouse: "warehouseNode", distribution: "distributionNode", retailer: "retailerNode", customer: "customerNode" }
const TYPE_ORDER = ["supplier", "factory", "port", "warehouse", "distribution", "retailer", "customer"]
const LABEL: Record<string, string> = { supplier: "Supplier", factory: "Factory", port: "Port", warehouse: "Warehouse", distribution: "Distribution", retailer: "Retailer", customer: "Customer" }

export function draftToRf(d: TwinDraft): { nodes: Node[]; edges: Edge[] } {
  const rowInCol: Record<number, number> = {}
  const nodes: Node[] = d.nodes.map((n) => {
    const col = Math.max(0, TYPE_ORDER.indexOf(n.type))
    const r = (rowInCol[col] = (rowInCol[col] ?? 0) + 1) - 1
    const risk = Math.max(0, Math.min(5, Number(n.risk_level ?? 2)))
    return {
      id: n.id, type: RF_TYPE[n.type] ?? "warehouseNode", position: { x: 80 + col * 300, y: 80 + r * 170 },
      data: {
        label: n.label, type: LABEL[n.type] ?? "Warehouse", nodeType: LABEL[n.type] ?? "Warehouse", description: n.note ?? "", capacity: n.capacity ?? 50,
        riskScore: risk / 5, riskLevel: risk >= 4 ? "High" : risk >= 3 ? "Medium" : "Low", lat: n.lat ?? null, lng: n.lng ?? null, country: n.country ?? null,
        address: n.city ? [n.city, n.country].filter(Boolean).join(", ") : undefined,
        location: n.lat != null && n.lng != null ? { lat: n.lat, lng: n.lng, country: n.country ?? undefined } : undefined,
      },
    } as Node
  })
  const edges: Edge[] = d.edges.map((e, i) => ({
    id: `e-${e.source}-${e.target}-${i}`, source: e.source, target: e.target, type: "transportEdge",
    data: { mode: e.mode, cost: e.cost ?? 0, transitTime: e.transit_days ?? 0, riskMultiplier: 1 },
  }))
  return { nodes, edges }
}
