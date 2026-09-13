// The public demo twin: a European electronics importer sourcing from Shenzhen.
// Exported both in the agent shape (`demoTwin`) and the React Flow shape (`demoArch`).
import type { Edge, Node } from "reactflow"
import type { IncidentEvent, Twin } from "@/types/agent"

export const DEMO_SUPPLY_CHAIN_ID = "demo-electronics-eu"

const N = (id: string, label: string, type: string, country: string, lat: number, lng: number, capacity: number, risk: number, x: number, y: number, rfType: string) =>
  ({ id, label, type, country, lat, lng, capacity, risk_level: risk, x, y, rfType })

const NODES = [
  N("shenzhen", "Shenzhen Plant", "factory", "CN", 22.54, 114.06, 100, 2, 40, 260, "factoryNode"),
  N("singapore", "Port of Singapore", "port", "SG", 1.29, 103.85, 80, 2, 340, 120, "portNode"),
  N("colombo", "Port of Colombo", "port", "LK", 6.93, 79.85, 60, 3, 340, 400, "portNode"),
  N("suez", "Suez Canal", "port", "EG", 30.0, 32.5, 70, 3, 640, 260, "portNode"),
  N("capetown", "Cape Town", "port", "ZA", -33.9, 18.4, 50, 2, 640, 540, "portNode"),
  N("rotterdam", "Port of Rotterdam", "port", "NL", 51.9, 4.5, 90, 1, 940, 160, "portNode"),
  N("hamburg", "Port of Hamburg", "port", "DE", 53.5, 10.0, 80, 1, 940, 400, "portNode"),
  N("berlin", "Berlin DC", "warehouse", "DE", 52.5, 13.4, 100, 1, 1240, 280, "warehouseNode"),
]

const E = (id: string, source: string, target: string, mode: string, cost: number, days: number, risk = 1.0) => ({ id, source, target, mode, cost, transit_days: days, risk_multiplier: risk })

const EDGES = [
  E("e1", "shenzhen", "singapore", "sea", 1000, 5),
  E("e2", "singapore", "suez", "sea", 2500, 12, 1.2),
  E("e3", "suez", "rotterdam", "sea", 1500, 8),
  E("e4", "shenzhen", "colombo", "sea", 1900, 9),
  E("e5", "colombo", "suez", "sea", 2600, 13, 1.2),
  E("e6", "suez", "hamburg", "sea", 1600, 9),
  E("e7", "colombo", "capetown", "sea", 3000, 16, 1.1),
  E("e8", "capetown", "rotterdam", "sea", 3500, 18, 1.1),
  E("e9", "rotterdam", "berlin", "road", 300, 1),
  E("e10", "hamburg", "berlin", "road", 200, 1),
  E("e11", "singapore", "colombo", "sea", 900, 4),
]

export const demoTwin: Twin = {
  supply_chain_id: DEMO_SUPPLY_CHAIN_ID,
  name: "EU Electronics Importer (demo)",
  nodes: NODES.map(({ x, y, rfType, ...n }) => ({ ...n, data: {} })),
  edges: EDGES,
  // One commercial flow so impact, value at risk and the inventory model have something real to work with.
  flows: [{ id: "demo-flow", origin: "shenzhen", destination: "berlin", product: "Consumer electronics", units_per_week: 1200, value_per_unit: 85, penalty_per_day: 1500, inventory_days: 12 }],
}

export const demoArch: { nodes: Node[]; edges: Edge[] } = {
  nodes: NODES.map((n) => ({
    id: n.id, type: n.rfType, position: { x: n.x, y: n.y },
    data: { label: n.label, type: n.type, country: n.country, lat: n.lat, lng: n.lng, capacity: n.capacity, riskLevel: n.risk_level >= 4 ? "High" : n.risk_level >= 3 ? "Medium" : "Low", riskScore: n.risk_level / 5 },
  })),
  edges: EDGES.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.mode, data: { mode: e.mode, cost: e.cost, transitTime: e.transit_days, riskMultiplier: e.risk_multiplier } })),
}

export const DEMO_SCENARIOS: Array<{ key: string; label: string; blurb: string; event: IncidentEvent }> = [
  {
    key: "singapore", label: "Port of Singapore closed", blurb: "Terminal fire halts PSA operations for ~3 weeks.",
    event: { id: "demo-sg", kind: "news", title: "Port of Singapore closed for 3 weeks after terminal fire", description: "PSA Singapore halted all container operations after a fire at Pasir Panjang; reopening expected in about three weeks.",
      location: "Singapore", failed_node_ids: ["singapore"], failed_edge_ids: [], sources: [{ title: "Reuters", url: "https://www.reuters.com/", credibility: 0.95 }] },
  },
  {
    key: "suez", label: "Suez Canal blocked", blurb: "Grounded vessel blocks the canal; 10–14 days to clear.",
    event: { id: "demo-suez", kind: "news", title: "Suez Canal blocked by grounded container ship", description: "A 400m container vessel ran aground and is wedged across the canal; salvage estimates 10–14 days.",
      location: "Suez, Egypt", failed_node_ids: ["suez"], failed_edge_ids: [], sources: [{ title: "Lloyd's List", url: "https://lloydslist.com/", credibility: 0.9 }] },
  },
  {
    key: "shenzhen", label: "Typhoon at Shenzhen", blurb: "Category-4 typhoon floods the plant for a week.",
    event: { id: "demo-sz", kind: "weather", title: "Typhoon floods Shenzhen plant; production halted", description: "Category-4 typhoon made landfall; the plant is flooded and production is expected to resume in ~7 days.",
      location: "Shenzhen, China", failed_node_ids: ["shenzhen"], failed_edge_ids: [], sources: [{ title: "OpenWeather", url: "https://openweathermap.org/", credibility: 0.9 }] },
  },
]
