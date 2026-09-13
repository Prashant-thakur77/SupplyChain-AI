// Great-circle interpolation for lane arcs (so sea lanes curve like real routes instead of straight chords).
export type LatLng = [number, number]

const toR = (d: number) => (d * Math.PI) / 180
const toD = (r: number) => (r * 180) / Math.PI

export function greatCircle(a: LatLng, b: LatLng, steps = 48): LatLng[] {
  const [lat1, lng1] = [toR(a[0]), toR(a[1])], [lat2, lng2] = [toR(b[0]), toR(b[1])]
  const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2))
  if (d < 1e-9) return [a, b]
  const pts: LatLng[] = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    pts.push([toD(Math.atan2(z, Math.sqrt(x * x + y * y))), toD(Math.atan2(y, x))])
  }
  // Unwrap antimeridian crossings so Leaflet doesn't draw a line around the world.
  for (let i = 1; i < pts.length; i++) { const dl = pts[i][1] - pts[i - 1][1]; if (dl > 180) pts[i][1] -= 360; else if (dl < -180) pts[i][1] += 360 }
  return pts
}

export const MODE_COLOR: Record<string, string> = { sea: "#0EA5E9", air: "#8B5CF6", rail: "#F59E0B", road: "#10B981" }
export const TYPE_COLOR: Record<string, string> = { supplier: "#7C3AED", factory: "#B45309", port: "#0E7490", warehouse: "#2748E8", distribution: "#1A7F4B", retailer: "#DB2777", customer: "#DB2777" }

export function nodeKind(n: { type?: string; data?: any }): string {
  const t = String(n.data?.type ?? n.type ?? "").toLowerCase().replace("node", "")
  if (t.includes("supplier")) return "supplier"; if (t.includes("factor") || t.includes("manufact") || t.includes("production")) return "factory"
  if (t.includes("port")) return "port"; if (t.includes("distrib")) return "distribution"; if (t.includes("retail") || t.includes("customer")) return "retailer"
  return "warehouse"
}
