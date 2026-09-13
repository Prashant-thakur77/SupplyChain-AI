// Twin enrichment (mirror of agent-service/enrich.py — keep the rate card in sync).
// Haversine distance, a per-mode rate card, and estimation of missing lane cost/transit days.

export const RATE_CARD: Record<string, { usdPerKm: number; kmPerDay: number; fixedDays: number; minUsd: number }> = {
  sea: { usdPerKm: 0.35, kmPerDay: 650, fixedDays: 2, minUsd: 400 },
  rail: { usdPerKm: 0.9, kmPerDay: 500, fixedDays: 1, minUsd: 250 },
  road: { usdPerKm: 1.8, kmPerDay: 600, fixedDays: 0.5, minUsd: 120 },
  air: { usdPerKm: 6.0, kmPerDay: 6000, fixedDays: 1, minUsd: 1500 },
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371, toR = (d: number) => (d * Math.PI) / 180
  const dp = toR(lat2 - lat1), dl = toR(lng2 - lng1)
  const a = Math.sin(dp / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dl / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(a))
}

export type RateCard = Record<string, { usdPerKm: number; kmPerDay: number; fixedDays: number; minUsd: number }>

export function estimateLane(mode: string, distanceKm: number, rateCard?: RateCard): { cost: number; transitDays: number } {
  const card = rateCard?.[mode] ?? RATE_CARD[mode] ?? RATE_CARD.road
  const detour = mode === "sea" ? 1.35 : mode === "rail" || mode === "road" ? 1.2 : 1.05
  const km = distanceKm * detour
  return { cost: Math.max(card.minUsd, Math.round((km * card.usdPerKm) / 10) * 10), transitDays: Math.round((card.fixedDays + km / card.kmPerDay) * 10) / 10 }
}

export interface EnrichableNode { id: string; lat?: number | null; lng?: number | null }
export interface EnrichableEdge { id: string; source: string; target: string; mode?: string; cost?: number | null; transitTime?: number | null }

/** Fill missing cost/transitTime on edges whose endpoints have coordinates. Marks `estimated: true`. */
export function enrichEdges<E extends EnrichableEdge>(nodes: EnrichableNode[], edges: E[], rateCard?: RateCard): { edges: (E & { estimated?: boolean })[]; notes: string[] } {
  const coords = new Map(nodes.filter((n) => n.lat != null && n.lng != null).map((n) => [n.id, [n.lat!, n.lng!] as const]))
  const notes: string[] = []
  const out = edges.map((e) => {
    const needsCost = !(Number(e.cost) > 0), needsDays = !(Number(e.transitTime) > 0)
    if (!needsCost && !needsDays) return e
    const a = coords.get(e.source), b = coords.get(e.target)
    if (!a || !b) { notes.push(`Lane ${e.id}: no coordinates on both ends — cost/days left blank.`); return e }
    const est = estimateLane(e.mode ?? "road", haversineKm(a[0], a[1], b[0], b[1]), rateCard)
    notes.push(`Lane ${e.id} (${e.mode ?? "road"}): estimated ${needsCost ? `$${est.cost}` : ""}${needsCost && needsDays ? " and " : ""}${needsDays ? `${est.transitDays} days` : ""}.`)
    return { ...e, cost: needsCost ? est.cost : e.cost, transitTime: needsDays ? est.transitDays : e.transitTime, estimated: true }
  })
  return { edges: out, notes }
}
