// CSV/Excel → Digital Twin import.
// Pure parsing + validation + build logic (no React) so it can be unit-tested and
// reused. Produces React Flow nodes/edges in the exact shape the canvas expects
// (see constants/templates/**/nodes.ts and edges.ts).

import Papa from "papaparse"
import type { Node as RFNode, Edge as RFEdge } from "reactflow"

export type Row = Record<string, string>

// ─── Node type normalization ──────────────────────────────────────────────────
// Maps a free-text "type" column to the React Flow node component key + the
// human-readable data.type used across the app.
const NODE_TYPE_ALIASES: Record<string, { rf: string; label: string }> = {
  supplier: { rf: "supplierNode", label: "Supplier" },
  suppliers: { rf: "supplierNode", label: "Supplier" },
  vendor: { rf: "supplierNode", label: "Supplier" },
  port: { rf: "portNode", label: "Port" },
  seaport: { rf: "portNode", label: "Port" },
  factory: { rf: "factoryNode", label: "Factory" },
  plant: { rf: "factoryNode", label: "Factory" },
  manufacturer: { rf: "manufacturerNode", label: "Manufacturer" },
  manufacturing: { rf: "manufacturerNode", label: "Manufacturer" },
  production: { rf: "manufacturerNode", label: "Manufacturer" },
  warehouse: { rf: "warehouseNode", label: "Warehouse" },
  storage: { rf: "warehouseNode", label: "Warehouse" },
  dc: { rf: "distributionNode", label: "Distribution" },
  distribution: { rf: "distributionNode", label: "Distribution" },
  distributioncenter: { rf: "distributionNode", label: "Distribution" },
  distributioncentre: { rf: "distributionNode", label: "Distribution" },
  distributor: { rf: "distributionNode", label: "Distribution" },
  fulfillment: { rf: "distributionNode", label: "Distribution" },
  "3pl": { rf: "warehouseNode", label: "Warehouse" },
  retailer: { rf: "retailerNode", label: "Retailer" },
  retail: { rf: "retailerNode", label: "Retailer" },
  customer: { rf: "retailerNode", label: "Retailer" },
  store: { rf: "retailerNode", label: "Retailer" },
}

// Left→right pipeline order for auto-layout.
const TYPE_ORDER = [
  "supplierNode",
  "portNode",
  "manufacturerNode",
  "factoryNode",
  "warehouseNode",
  "distributionNode",
  "retailerNode",
]

const MODE_ALIASES: Record<string, string> = {
  sea: "sea", ocean: "sea", ship: "sea", vessel: "sea",
  air: "air", flight: "air", plane: "air",
  rail: "rail", train: "rail",
  road: "road", truck: "road", ground: "road", lorry: "road",
}

export const NODE_TEMPLATE_HEADERS = ["id", "name", "type", "lat", "lng", "country", "address", "capacity", "leadTime", "riskScore"]
export const EDGE_TEMPLATE_HEADERS = ["id", "source", "target", "mode", "cost", "transitTime"]

// ─── File parsing ─────────────────────────────────────────────────────────────

export function parseCsv(file: File): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => resolve(res.data as Row[]),
      error: (err) => reject(err),
    })
  })
}

export async function parseXlsx(file: File): Promise<Row[]> {
  // Lazy-load exceljs (large) only when an xlsx is actually parsed.
  const ExcelJS = (await import("exceljs")).default
  const buf = await file.arrayBuffer()
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buf)
  const ws = wb.worksheets[0]
  if (!ws) return []
  const cellStr = (cell: any): string => {
    if (cell == null) return ""
    if (typeof cell === "object") {
      if ("text" in cell) return String(cell.text) // rich text / hyperlink
      if ("result" in cell) return String(cell.result) // formula
      return ""
    }
    return String(cell)
  }
  const headers: string[] = []
  const rows: Row[] = []
  let headerParsed = false
  // The first row eachRow yields is the header — do NOT rely on physical row
  // number 1, since a leading blank row is skipped (includeEmpty defaults false).
  ws.eachRow((row: any) => {
    const values = row.values as any[] // 1-indexed (index 0 empty)
    if (!headerParsed) {
      for (let i = 1; i < values.length; i++) headers[i] = cellStr(values[i]).trim()
      headerParsed = true
      return
    }
    const obj: Row = {}
    let hasAny = false
    for (let i = 1; i < headers.length; i++) {
      const key = headers[i]
      if (!key) continue
      const val = cellStr(values[i])
      if (val !== "") hasAny = true
      obj[key] = val
    }
    if (hasAny) rows.push(obj)
  })
  return rows
}

export function parseFile(file: File): Promise<Row[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseXlsx(file)
  return parseCsv(file)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(row: Row, ...aliases: string[]): string {
  const keys = Object.keys(row)
  for (const alias of aliases) {
    const k = keys.find((k) => k.trim().toLowerCase() === alias.toLowerCase())
    if (k != null && String(row[k]).trim() !== "") return String(row[k]).trim()
  }
  return ""
}

function slug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "node"
}

function toNum(s: string): number | undefined {
  if (s == null || s === "") return undefined
  const n = Number(String(s).replace(/[^0-9.\-]/g, ""))
  return Number.isFinite(n) ? n : undefined
}

// ─── Build ──────────────────────────────────────────────────────────────────

export interface BuildResult {
  nodes: RFNode[]
  edges: RFEdge[]
  errors: string[]
  warnings: string[]
  stats: { nodeCount: number; edgeCount: number }
}

export function buildTwin(nodeRows: Row[], edgeRows: Row[]): BuildResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1) Parse nodes
  interface PN { id: string; name: string; rf: string; label: string; lat?: number; lng?: number; country: string; address: string; capacity?: number; leadTime?: number; risk: number }
  const parsed: PN[] = []
  const idSet = new Set<string>()
  const nameToId = new Map<string, string>()

  nodeRows.forEach((row, i) => {
    const name = pick(row, "name", "label", "node", "title")
    const rawType = pick(row, "type", "nodetype", "category")
    if (!name && !rawType) return // skip fully blank row
    const line = i + 2 // +1 header, +1 to 1-index
    if (!name) { errors.push(`Node row ${line}: missing "name".`); return }
    const typeKey = rawType.toLowerCase().replace(/\s+/g, "")
    const mapped = NODE_TYPE_ALIASES[typeKey]
    if (!mapped) {
      errors.push(`Node "${name}" (row ${line}): unknown type "${rawType}". Allowed: Supplier, Port, Factory, Manufacturer, Warehouse, Distribution, Retailer.`)
      return
    }
    let id = pick(row, "id", "node_id", "nodeid") || slug(name)
    if (idSet.has(id)) { warnings.push(`Duplicate node id "${id}" (row ${line}) — suffixed to keep it unique.`); id = `${id}-${line}` }
    idSet.add(id)
    nameToId.set(name.toLowerCase(), id)

    const lat = toNum(pick(row, "lat", "latitude"))
    const lng = toNum(pick(row, "lng", "lon", "long", "longitude"))
    if ((lat == null) !== (lng == null)) warnings.push(`Node "${name}": only one of lat/lng provided — map view may be off.`)
    let risk = toNum(pick(row, "riskscore", "risk", "risk_score")) ?? 0
    if (risk > 1 && risk <= 100) risk = risk / 100 // accept 0–100 too
    if (risk < 0 || risk > 1) { warnings.push(`Node "${name}": riskScore ${risk} out of range — clamped to 0–1.`); risk = Math.max(0, Math.min(1, risk)) }

    parsed.push({
      id, name, rf: mapped.rf, label: mapped.label,
      lat, lng,
      country: pick(row, "country", "iso", "countrycode"),
      address: pick(row, "address", "location", "city"),
      capacity: toNum(pick(row, "capacity")),
      leadTime: toNum(pick(row, "leadtime", "lead_time", "lead")),
      risk,
    })
  })

  if (parsed.length === 0) errors.push("No valid nodes found. Check the Nodes file has a header row with at least name and type columns.")

  // 2) Auto-layout by type column
  const colIndex: Record<string, number> = {}
  TYPE_ORDER.forEach((t, i) => (colIndex[t] = i))
  const rowInCol: Record<number, number> = {}
  const nodes: RFNode[] = parsed.map((p) => {
    const col = colIndex[p.rf] ?? TYPE_ORDER.length
    const r = (rowInCol[col] = (rowInCol[col] ?? 0) + 1) - 1
    return {
      id: p.id,
      type: p.rf,
      position: { x: 80 + col * 300, y: 80 + r * 170 },
      data: {
        label: p.name,
        type: p.label,
        nodeType: p.label,
        description: "",
        capacity: p.capacity ?? 0,
        leadTime: p.leadTime,
        riskScore: p.risk,
        riskLevel: p.risk >= 0.7 ? "High" : p.risk >= 0.4 ? "Medium" : "Low",
        location: p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng, country: p.country } : undefined,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        country: p.country,
      },
    } as RFNode
  })

  // 3) Parse edges
  const edges: RFEdge[] = []
  const resolve = (ref: string): string | null => {
    const r = ref.trim()
    if (idSet.has(r)) return r
    const byName = nameToId.get(r.toLowerCase())
    return byName ?? null
  }
  edgeRows.forEach((row, i) => {
    const src = pick(row, "source", "from", "from_node", "origin")
    const tgt = pick(row, "target", "to", "to_node", "destination", "dest")
    if (!src && !tgt) return
    const line = i + 2
    if (!src || !tgt) { errors.push(`Edge row ${line}: missing source or target.`); return }
    const s = resolve(src), t = resolve(tgt)
    if (!s) { errors.push(`Edge row ${line}: source "${src}" does not match any node id or name.`); return }
    if (!t) { errors.push(`Edge row ${line}: target "${tgt}" does not match any node id or name.`); return }
    const modeRaw = pick(row, "mode", "transport", "method").toLowerCase()
    const mode = MODE_ALIASES[modeRaw] ?? "road"
    const id = pick(row, "id", "edge_id") || `e-${s}-${t}-${i}`
    edges.push({
      id, source: s, target: t, type: "transportEdge",
      data: {
        mode,
        cost: toNum(pick(row, "cost", "price")) ?? 0,
        transitTime: toNum(pick(row, "transittime", "transit_time", "time", "days")) ?? 0,
        riskMultiplier: 1,
      },
    } as RFEdge)
  })

  if (parsed.length > 0 && edges.length === 0) warnings.push("No edges imported — nodes will appear unconnected. Add an Edges file to link them.")

  return { nodes, edges, errors, warnings, stats: { nodeCount: nodes.length, edgeCount: edges.length } }
}

// Sample CSV content for the downloadable templates.
export function sampleNodesCsv(): string {
  return [
    NODE_TEMPLATE_HEADERS.join(","),
    "steel-supplier,Steel Supplier,Supplier,31.23,121.47,CHN,Shanghai,20000,30,0.5",
    "shenzhen-port,Port of Shenzhen,Port,22.54,114.06,CHN,Shenzhen,,,0.3",
    "assembly-plant,Assembly Plant,Factory,19.08,72.88,IND,Mumbai,15000,10,0.4",
    "west-dc,US West DC,Distribution,34.05,-118.24,USA,Los Angeles,30000,5,0.2",
    "national-retail,National Retail,Retailer,40.71,-74.01,USA,New York,,,0.78",
  ].join("\n")
}

export function sampleEdgesCsv(): string {
  return [
    EDGE_TEMPLATE_HEADERS.join(","),
    "e1,steel-supplier,shenzhen-port,road,400,2",
    "e2,shenzhen-port,assembly-plant,sea,2000,18",
    "e3,assembly-plant,west-dc,sea,3200,22",
    "e4,west-dc,national-retail,road,600,3",
  ].join("\n")
}
