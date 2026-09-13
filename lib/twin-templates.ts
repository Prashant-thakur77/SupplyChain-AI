// One-click industry twins. Real places and coordinates; lane costs are planning estimates (see rate card in twin-enrich).
import type { Edge, Node } from "reactflow"

type T = "supplier" | "factory" | "port" | "warehouse" | "distribution" | "retailer"
const RF: Record<T, string> = { supplier: "supplierNode", factory: "factoryNode", port: "portNode", warehouse: "warehouseNode", distribution: "distributionNode", retailer: "retailerNode" }
const LABEL: Record<T, string> = { supplier: "Supplier", factory: "Factory", port: "Port", warehouse: "Warehouse", distribution: "Distribution", retailer: "Retailer" }
const COL: Record<T, number> = { supplier: 0, factory: 1, port: 2, warehouse: 3, distribution: 4, retailer: 5 }

interface TN { id: string; label: string; type: T; country: string; lat: number; lng: number; capacity?: number; risk?: number }
interface TE { s: string; t: string; mode: "sea" | "air" | "rail" | "road"; cost: number; days: number; risk?: number }

export interface TwinTemplate { key: string; name: string; industry: string; blurb: string; nodes: TN[]; edges: TE[] }

export const TWIN_TEMPLATES: TwinTemplate[] = [
  {
    key: "electronics", name: "EU Electronics Importer", industry: "Consumer electronics", blurb: "Shenzhen → Singapore/Colombo → Suez → Rotterdam/Hamburg → Berlin. The demo twin.",
    nodes: [
      { id: "shenzhen", label: "Shenzhen Plant", type: "factory", country: "CN", lat: 22.54, lng: 114.06, capacity: 100, risk: 2 }, { id: "singapore", label: "Port of Singapore", type: "port", country: "SG", lat: 1.29, lng: 103.85, capacity: 80, risk: 2 },
      { id: "colombo", label: "Port of Colombo", type: "port", country: "LK", lat: 6.93, lng: 79.85, capacity: 60, risk: 3 }, { id: "suez", label: "Suez Canal", type: "port", country: "EG", lat: 30.0, lng: 32.5, capacity: 70, risk: 3 },
      { id: "capetown", label: "Cape Town", type: "port", country: "ZA", lat: -33.9, lng: 18.4, capacity: 50, risk: 2 }, { id: "rotterdam", label: "Port of Rotterdam", type: "port", country: "NL", lat: 51.9, lng: 4.5, capacity: 90, risk: 1 },
      { id: "hamburg", label: "Port of Hamburg", type: "port", country: "DE", lat: 53.5, lng: 10.0, capacity: 80, risk: 1 }, { id: "berlin", label: "Berlin DC", type: "warehouse", country: "DE", lat: 52.5, lng: 13.4, capacity: 100, risk: 1 },
    ],
    edges: [{ s: "shenzhen", t: "singapore", mode: "sea", cost: 1000, days: 5 }, { s: "singapore", t: "suez", mode: "sea", cost: 2500, days: 12, risk: 1.2 }, { s: "suez", t: "rotterdam", mode: "sea", cost: 1500, days: 8 }, { s: "shenzhen", t: "colombo", mode: "sea", cost: 1900, days: 9 }, { s: "colombo", t: "suez", mode: "sea", cost: 2600, days: 13, risk: 1.2 }, { s: "suez", t: "hamburg", mode: "sea", cost: 1600, days: 9 }, { s: "colombo", t: "capetown", mode: "sea", cost: 3000, days: 16, risk: 1.1 }, { s: "capetown", t: "rotterdam", mode: "sea", cost: 3500, days: 18, risk: 1.1 }, { s: "rotterdam", t: "berlin", mode: "road", cost: 300, days: 1 }, { s: "hamburg", t: "berlin", mode: "road", cost: 200, days: 1 }, { s: "singapore", t: "colombo", mode: "sea", cost: 900, days: 4 }],
  },
  {
    key: "automotive", name: "Automotive Tier-2 Castings", industry: "Automotive", blurb: "Pune & Coimbatore castings → Chennai/Mumbai ports → Hamburg → rail to Wolfsburg; Lyon aftermarket warehouse.",
    nodes: [
      { id: "pune", label: "Pune Foundry", type: "supplier", country: "IN", lat: 18.52, lng: 73.86, capacity: 70, risk: 3 }, { id: "coimbatore", label: "Coimbatore Castings", type: "supplier", country: "IN", lat: 11.02, lng: 76.96, capacity: 60, risk: 3 },
      { id: "chennai", label: "Chennai Port", type: "port", country: "IN", lat: 13.08, lng: 80.27, capacity: 80, risk: 2 }, { id: "mumbai", label: "Nhava Sheva (Mumbai)", type: "port", country: "IN", lat: 18.95, lng: 72.95, capacity: 90, risk: 2 },
      { id: "hamburg", label: "Port of Hamburg", type: "port", country: "DE", lat: 53.5, lng: 10.0, capacity: 90, risk: 1 }, { id: "antwerp", label: "Port of Antwerp", type: "port", country: "BE", lat: 51.22, lng: 4.4, capacity: 85, risk: 1 },
      { id: "wolfsburg", label: "Wolfsburg Plant", type: "factory", country: "DE", lat: 52.42, lng: 10.79, capacity: 100, risk: 1 }, { id: "lyon", label: "Lyon Aftermarket WH", type: "warehouse", country: "FR", lat: 45.76, lng: 4.84, capacity: 60, risk: 1 },
    ],
    edges: [{ s: "pune", t: "mumbai", mode: "road", cost: 350, days: 1 }, { s: "coimbatore", t: "chennai", mode: "road", cost: 600, days: 1.5 }, { s: "chennai", t: "hamburg", mode: "sea", cost: 3200, days: 24, risk: 1.2 }, { s: "mumbai", t: "hamburg", mode: "sea", cost: 2900, days: 21, risk: 1.2 }, { s: "mumbai", t: "antwerp", mode: "sea", cost: 3000, days: 22, risk: 1.2 }, { s: "hamburg", t: "wolfsburg", mode: "rail", cost: 400, days: 1 }, { s: "antwerp", t: "wolfsburg", mode: "rail", cost: 700, days: 2 }, { s: "wolfsburg", t: "lyon", mode: "road", cost: 900, days: 2 }],
  },
  {
    key: "pharma", name: "Pharma Cold Chain", industry: "Pharmaceuticals", blurb: "Hyderabad API → Basel fill-finish → air to Chicago & Singapore hubs → hospital distributors.",
    nodes: [
      { id: "hyderabad", label: "Hyderabad API Plant", type: "supplier", country: "IN", lat: 17.39, lng: 78.49, capacity: 80, risk: 3 }, { id: "basel", label: "Basel Fill-Finish", type: "factory", country: "CH", lat: 47.56, lng: 7.59, capacity: 100, risk: 1 },
      { id: "zurich", label: "Zurich Airport", type: "port", country: "CH", lat: 47.46, lng: 8.55, capacity: 90, risk: 1 }, { id: "frankfurt", label: "Frankfurt Airport", type: "port", country: "DE", lat: 50.03, lng: 8.57, capacity: 95, risk: 1 },
      { id: "chicago", label: "Chicago Hub", type: "distribution", country: "US", lat: 41.98, lng: -87.9, capacity: 80, risk: 2 }, { id: "singapore", label: "Singapore Hub", type: "distribution", country: "SG", lat: 1.36, lng: 103.99, capacity: 70, risk: 2 },
      { id: "minneapolis", label: "Midwest Hospital Distributor", type: "retailer", country: "US", lat: 44.98, lng: -93.27, capacity: 50, risk: 1 }, { id: "jakarta", label: "SE Asia Distributor", type: "retailer", country: "ID", lat: -6.2, lng: 106.85, capacity: 50, risk: 3 },
    ],
    edges: [{ s: "hyderabad", t: "basel", mode: "air", cost: 9000, days: 2, risk: 1.1 }, { s: "basel", t: "zurich", mode: "road", cost: 200, days: 0.5 }, { s: "basel", t: "frankfurt", mode: "road", cost: 400, days: 0.5 }, { s: "zurich", t: "chicago", mode: "air", cost: 14000, days: 2 }, { s: "frankfurt", t: "chicago", mode: "air", cost: 13000, days: 2 }, { s: "frankfurt", t: "singapore", mode: "air", cost: 12000, days: 2 }, { s: "zurich", t: "singapore", mode: "air", cost: 12500, days: 2 }, { s: "chicago", t: "minneapolis", mode: "road", cost: 900, days: 1 }, { s: "singapore", t: "jakarta", mode: "air", cost: 2500, days: 1 }],
  },
  {
    key: "food", name: "Food & Beverage Regional", industry: "Food & beverage", blurb: "Valencia citrus & Wielkopolska dairy → Rotterdam cold store → Manchester & Dublin retail DCs.",
    nodes: [
      { id: "valencia", label: "Valencia Citrus Co-op", type: "supplier", country: "ES", lat: 39.47, lng: -0.38, capacity: 70, risk: 2 }, { id: "poznan", label: "Poznań Dairy", type: "supplier", country: "PL", lat: 52.41, lng: 16.93, capacity: 60, risk: 2 },
      { id: "rotterdam", label: "Rotterdam Cold Store", type: "warehouse", country: "NL", lat: 51.9, lng: 4.5, capacity: 100, risk: 1 }, { id: "calais", label: "Calais–Dover Crossing", type: "port", country: "FR", lat: 50.95, lng: 1.85, capacity: 80, risk: 3 },
      { id: "hull", label: "Port of Hull", type: "port", country: "GB", lat: 53.74, lng: -0.33, capacity: 60, risk: 2 }, { id: "manchester", label: "Manchester Retail DC", type: "distribution", country: "GB", lat: 53.48, lng: -2.24, capacity: 90, risk: 1 },
      { id: "dublin", label: "Dublin Retail DC", type: "distribution", country: "IE", lat: 53.35, lng: -6.26, capacity: 60, risk: 1 }, { id: "holyhead", label: "Holyhead Ferry", type: "port", country: "GB", lat: 53.31, lng: -4.63, capacity: 50, risk: 2 },
    ],
    edges: [{ s: "valencia", t: "rotterdam", mode: "road", cost: 2400, days: 2.5 }, { s: "poznan", t: "rotterdam", mode: "road", cost: 1500, days: 1.5 }, { s: "rotterdam", t: "calais", mode: "road", cost: 500, days: 0.5 }, { s: "calais", t: "manchester", mode: "road", cost: 900, days: 1 }, { s: "rotterdam", t: "hull", mode: "sea", cost: 700, days: 1 }, { s: "hull", t: "manchester", mode: "road", cost: 300, days: 0.5 }, { s: "manchester", t: "holyhead", mode: "road", cost: 350, days: 0.5 }, { s: "holyhead", t: "dublin", mode: "sea", cost: 500, days: 0.5 }],
  },
]

export function templateToRf(t: TwinTemplate): { nodes: Node[]; edges: Edge[] } {
  const rowInCol: Record<number, number> = {}
  const nodes: Node[] = t.nodes.map((n) => {
    const col = COL[n.type]; const r = (rowInCol[col] = (rowInCol[col] ?? 0) + 1) - 1
    const risk = n.risk ?? 2
    return { id: n.id, type: RF[n.type], position: { x: 80 + col * 300, y: 80 + r * 170 }, data: { label: n.label, type: LABEL[n.type], nodeType: LABEL[n.type], description: "", capacity: n.capacity ?? 50, riskScore: risk / 5, riskLevel: risk >= 4 ? "High" : risk >= 3 ? "Medium" : "Low", lat: n.lat, lng: n.lng, country: n.country, location: { lat: n.lat, lng: n.lng, country: n.country } } } as Node
  })
  const edges: Edge[] = t.edges.map((e, i) => ({ id: `e-${e.s}-${e.t}-${i}`, source: e.s, target: e.t, type: "transportEdge", data: { mode: e.mode, cost: e.cost, transitTime: e.days, riskMultiplier: e.risk ?? 1 } }))
  return { nodes, edges }
}
