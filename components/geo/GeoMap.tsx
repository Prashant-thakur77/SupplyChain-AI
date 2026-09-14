"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import type { Edge, Node } from "reactflow"
import { Layers, Maximize2 } from "lucide-react"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"
import { cn } from "@/lib/utils"
import { greatCircle, MODE_COLOR, TYPE_COLOR, nodeKind, type LatLng } from "./geo-utils"

/**
 * Real-map view of the twin on OpenStreetMap tiles (Leaflet). Nodes are markers by type, lanes are great-circle arcs
 * coloured by mode, and the incident overlay from the store (failed / downstream / candidate routes) is drawn on top.
 */
interface Props { nodes?: Node[]; edges?: Edge[]; className?: string; showControls?: boolean; /** px kept free on the right (e.g. for an incident panel) */ padRight?: number }

// Basemaps: detailed street map (OSM), satellite imagery with place labels (Esri), and terrain (OpenTopoMap). All free with attribution.
const BASEMAPS: Record<string, { url: string; attribution: string; maxZoom: number; overlay?: string }> = {
  streets: { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri — Maxar, Earthstar Geographics, GIS User Community", maxZoom: 18,
    overlay: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" },
  terrain: { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attribution: 'Map data &copy; OpenStreetMap contributors, SRTM · style &copy; <a href="https://opentopomap.org">OpenTopoMap</a>', maxZoom: 17 },
}

const coordOf = (n: Node): LatLng | null => {
  const lat = n.data?.lat ?? n.data?.location?.lat ?? n.data?.location_lat, lng = n.data?.lng ?? n.data?.location?.lng ?? n.data?.location_lng
  return typeof lat === "number" && typeof lng === "number" ? [lat, lng] : null
}

export function GeoMap({ nodes: propNodes, edges: propEdges, className, showControls = true, padRight = 0 }: Props) {
  const storeNodes = useDigitalTwinStore((s) => s.nodes), storeEdges = useDigitalTwinStore((s) => s.edges)
  const nodeStates = useDigitalTwinStore((s) => s.nodeStates), overlayEdges = useDigitalTwinStore((s) => s.overlayEdges)
  const selectedRouteId = useDigitalTwinStore((s) => s.selectedRouteId), setSelectedElement = useDigitalTwinStore((s) => s.setSelectedElement)
  const nodes = propNodes?.length ? propNodes : storeNodes, edges = propEdges?.length ? propEdges : storeEdges
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null), layersRef = useRef<any>(null)
  const [L, setL] = useState<any>(null)
  const [modes, setModes] = useState<Record<string, boolean>>({ sea: true, air: true, rail: true, road: true })
  const [showLabels, setShowLabels] = useState(true)
  const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>("streets")
  const baseRef = useRef<any[]>([])

  useEffect(() => { import("leaflet").then((m) => setL(m.default ?? m)) }, [])

  // Create the map once.
  useEffect(() => {
    if (!L || !ref.current || mapRef.current) return
    const map = L.map(ref.current, { worldCopyJump: true, zoomControl: false, attributionControl: true, minZoom: 2 })
    L.control.zoom({ position: "bottomleft" }).addTo(map)
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(map)
    map.setView([30, 40], 3)
    mapRef.current = map; layersRef.current = L.layerGroup().addTo(map)
    return () => { map.remove(); mapRef.current = null }
  }, [L])

  const positioned = useMemo(() => nodes.filter((n) => n.type !== "group").map((n) => ({ n, c: coordOf(n) })).filter((x): x is { n: Node; c: LatLng } => !!x.c), [nodes])
  const missing = nodes.filter((n) => n.type !== "group").length - positioned.length

  // Redraw on any data/overlay change.
  useEffect(() => {
    const map = mapRef.current, L_ = L
    if (!map || !L_) return
    const g = layersRef.current; g.clearLayers()
    const byId = new Map(positioned.map((x) => [x.n.id, x]))
    const disrupted = new Set(Object.entries(nodeStates).filter(([, s]) => s === "failed").map(([id]) => id))

    // lanes
    for (const e of edges) {
      const a = byId.get(e.source), b = byId.get(e.target); if (!a || !b) continue
      const mode = String(e.data?.mode ?? e.type ?? "road").toLowerCase()
      if (modes[mode] === false) continue
      const dead = disrupted.has(e.source) || disrupted.has(e.target)
      const pts = greatCircle(a.c, b.c, mode === "road" || mode === "rail" ? 8 : 48)
      L_.polyline(pts, { color: "#ffffff", weight: 6, opacity: 0.55 }).addTo(g)  // halo keeps lanes legible on imagery
      L_.polyline(pts, { color: dead ? "#DC2626" : MODE_COLOR[mode] ?? "#64748B", weight: dead ? 2.5 : 3.2, opacity: dead ? 0.6 : 0.9, dashArray: dead ? "4 6" : undefined })
        .bindTooltip(`${a.n.data?.label ?? e.source} → ${b.n.data?.label ?? e.target}<br/>${mode} · $${Math.round(Number(e.data?.cost ?? 0)).toLocaleString()} · ${e.data?.transitTime ?? "?"}d${e.data?.estimated ? " (est.)" : ""}`, { sticky: true }).addTo(g)
    }
    // candidate routes (incident overlay)
    for (const e of overlayEdges) {
      const a = byId.get(e.source), b = byId.get(e.target); if (!a || !b) continue
      const active = !selectedRouteId || e.data?.routeId === selectedRouteId
      L_.polyline(greatCircle(a.c, b.c, 48), { color: e.data?.color ?? "#22c55e", weight: active ? 5 : 3, opacity: active ? 0.95 : 0.45, dashArray: "8 8", className: "geo-route" }).addTo(g)
    }
    // nodes
    for (const { n, c } of positioned) {
      const kind = nodeKind(n), st = nodeStates[n.id]
      const color = st === "failed" ? "#DC2626" : st === "onRoute" ? "#059669" : st === "downstream" ? "#D97706" : TYPE_COLOR[kind] ?? "#334155"
      if (st === "failed") L_.circleMarker(c, { radius: 18, color, weight: 1, fillColor: color, fillOpacity: 0.15, className: "geo-pulse" }).addTo(g)
      const risk = Number(n.data?.riskScore ?? 0)
      const m = L_.circleMarker(c, { radius: 7 + Math.min(4, Number(n.data?.capacity ?? 0) / 40), color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 })
      m.bindPopup(`<div style="font:13px Inter,system-ui;min-width:180px"><div style="font-weight:700">${n.data?.label ?? n.id}</div>
        <div style="color:#475569;text-transform:uppercase;font-size:10px;letter-spacing:.08em">${kind}${n.data?.country ? " · " + n.data.country : ""}</div>
        <div style="margin-top:6px;font-size:12px">Capacity ${n.data?.capacity ?? "—"} · Risk ${n.data?.riskLevel ?? (risk ? Math.round(risk * 100) + "%" : "—")}${st ? `<br/><b style="color:${color}">${st === "failed" ? "FAILED" : st === "onRoute" ? "On reroute" : "Downstream impact"}</b>` : ""}</div>
        ${n.data?.riskBreakdown?.reasons?.length ? `<div style="margin-top:6px;font-size:11px;color:#475569">Why: ${n.data.riskBreakdown.reasons.slice(0, 3).join(" · ")}</div>` : ""}</div>`)
      m.on("click", () => setSelectedElement(n))
      if (showLabels) m.bindTooltip(String(n.data?.label ?? n.id), { permanent: true, direction: "top", offset: [0, -8], className: "geo-label" })
      m.addTo(g)
    }
  }, [L, positioned, edges, overlayEdges, nodeStates, selectedRouteId, modes, showLabels, setSelectedElement])

  const fit = () => { const map = mapRef.current; if (!map || !L || !positioned.length) return; map.fitBounds(L.latLngBounds(positioned.map((x) => x.c)).pad(0.15), { animate: true, paddingTopLeft: [24, 70], paddingBottomRight: [24 + padRight, 60] }) }
  // Swap basemap tiles without touching the network layers.
  useEffect(() => {
    const map = mapRef.current; if (!L || !map) return
    baseRef.current.forEach((t) => map.removeLayer(t)); baseRef.current = []
    const b = BASEMAPS[basemap]
    const base = L.tileLayer(b.url, { attribution: b.attribution, maxZoom: b.maxZoom, className: `geo-tiles geo-${basemap}` }).addTo(map); base.bringToBack()
    baseRef.current.push(base)
    if (b.overlay) { const o = L.tileLayer(b.overlay, { maxZoom: b.maxZoom, pane: "tilePane" }).addTo(map); baseRef.current.push(o) }
  }, [L, basemap, mapRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fit() }, [L, positioned.length]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (Object.keys(nodeStates).length) fit() }, [nodeStates]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-xl", className)}>
      <div ref={ref} className="h-full w-full bg-[#EEF1F5]" />
      <style>{`
        .leaflet-container{font-family:Inter,system-ui,sans-serif}
        .geo-streets{filter:saturate(.85) contrast(1.02)}
        .geo-satellite{filter:saturate(1.05) brightness(.95)}
        .leaflet-control-scale-line{background:rgba(255,255,255,.85);border-color:#CBD5E1;color:#475569;font-size:10px}
        .geo-label{background:rgba(255,255,255,.9);border:1px solid #E2E8F0;border-radius:999px;padding:1px 6px;font-size:10px;font-weight:600;color:#0F172A;box-shadow:0 1px 2px rgba(0,0,0,.08)}
        .geo-label::before{display:none}
        .geo-pulse{animation:geoPulse 1.4s ease-out infinite;transform-origin:center;transform-box:fill-box}
        @keyframes geoPulse{0%{opacity:.6;transform:scale(.6)}100%{opacity:0;transform:scale(1.8)}}
        .geo-route{animation:geoDash 1.2s linear infinite}
        @keyframes geoDash{to{stroke-dashoffset:-32}}
      `}</style>
      {showControls && (
        <>
          <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
            <div className="rounded-xl border border-theme-border-subtle bg-white/95 p-2 text-[11px] shadow-sm backdrop-blur">
              <div className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wide text-theme-text-muted"><Layers className="h-3 w-3" /> Lanes</div>
              {Object.keys(MODE_COLOR).map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-2 py-0.5 text-theme-text-primary"><input type="checkbox" checked={modes[m] !== false} onChange={(e) => setModes({ ...modes, [m]: e.target.checked })} className="accent-[#4F46E5]" /><span className="inline-block h-1.5 w-4 rounded" style={{ background: MODE_COLOR[m] }} />{m}</label>
              ))}
              <label className="mt-1 flex cursor-pointer items-center gap-2 border-t border-theme-border-subtle pt-1 text-theme-text-primary"><input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="accent-[#4F46E5]" /> labels</label>
            </div>
            <div className="flex overflow-hidden rounded-xl border border-theme-border-subtle bg-white/95 text-[11px] font-semibold shadow-sm backdrop-blur">
              {(["streets", "satellite", "terrain"] as const).map((b) => <button key={b} type="button" onClick={() => setBasemap(b)} className={cn("px-2.5 py-1.5 capitalize", basemap === b ? "bg-theme-blue text-white" : "text-theme-text-secondary hover:text-theme-text-primary")}>{b}</button>)}
            </div>
            <button type="button" onClick={fit} className="flex items-center justify-center gap-1 rounded-xl border border-theme-border-subtle bg-white/95 px-2 py-1.5 text-[11px] font-semibold text-theme-text-secondary shadow-sm hover:text-theme-text-primary"><Maximize2 className="h-3 w-3" /> Fit</button>
          </div>
          <div className="absolute bottom-3 right-3 z-[500] rounded-xl border border-theme-border-subtle bg-white/95 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
            <div className="flex flex-wrap gap-x-3 gap-y-1">{Object.entries(TYPE_COLOR).filter(([k]) => k !== "customer").map(([k, c]) => <span key={k} className="inline-flex items-center gap-1 capitalize text-theme-text-secondary"><span className="h-2.5 w-2.5 rounded-full border-2 border-white shadow" style={{ background: c }} />{k}</span>)}</div>
            {Object.keys(nodeStates).length > 0 && <div className="mt-1 flex gap-3 border-t border-theme-border-subtle pt-1 text-theme-text-secondary"><span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" />failed</span><span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#D97706]" />downstream</span><span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#059669]" />on reroute</span></div>}
            {missing > 0 && <div className="mt-1 text-theme-amber">{missing} site{missing === 1 ? "" : "s"} without coordinates — not shown.</div>}
          </div>
        </>
      )}
    </div>
  )
}

export default GeoMap
