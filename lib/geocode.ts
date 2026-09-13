// Server-side geocoding via OpenWeather's free geocoding API (same key as the weather tool). Cached in memory.
const cache = new Map<string, { lat: number; lng: number; country?: string } | null>()

export async function geocode(query: string): Promise<{ lat: number; lng: number; country?: string } | null> {
  const q = query.trim()
  if (!q) return null
  if (cache.has(q)) return cache.get(q)!
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) return null
  try {
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${key}`, { cache: "no-store" })
    const j = await res.json()
    const hit = Array.isArray(j) && j[0] ? { lat: j[0].lat, lng: j[0].lon, country: j[0].country } : null
    cache.set(q, hit)
    return hit
  } catch { return null }
}

/** "Port of Rotterdam" → "Rotterdam"; "Shenzhen Plant" → "Shenzhen". Geocoders want places, not facilities. */
export function placeQuery(label: string): string {
  return label
    .replace(/\b(port of|port|terminal|plant|factory|warehouse|dc|distribution cent(er|re)|hub|depot|mill|site|facility|supplier|tier ?\d)\b/gi, " ")
    .replace(/[()\-–—]/g, " ").replace(/\s+/g, " ").trim()
}

/** Geocode nodes that lack coordinates, using name + address/country as the query. Returns the count resolved. */
export async function geocodeNodes<N extends { id: string; name?: string; label?: string; address?: string; country?: string; lat?: number | null; lng?: number | null }>(nodes: N[]): Promise<{ nodes: N[]; resolved: number; unresolved: string[] }> {
  let resolved = 0
  const unresolved: string[] = []
  const out: N[] = []
  for (const n of nodes) {
    if (n.lat != null && n.lng != null) { out.push(n); continue }
    const label = n.name ?? n.label ?? n.id
    const place = placeQuery(label) || label
    const queries = [n.address, [place, n.country].filter(Boolean).join(", "), place, label].filter((q): q is string => !!q && q.trim().length > 1)
    let hit: Awaited<ReturnType<typeof geocode>> = null
    for (const q of queries) { hit = await geocode(q); if (hit) break }
    if (hit) { resolved++; out.push({ ...n, lat: hit.lat, lng: hit.lng, country: n.country ?? hit.country }) }
    else { unresolved.push(label); out.push(n) }
  }
  return { nodes: out, resolved, unresolved }
}
