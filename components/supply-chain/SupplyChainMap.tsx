"use client";

import { useState, useMemo } from "react";
// @ts-ignore — react-simple-maps types are bundled in the package
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps";
import { useSupplyChainGlobe } from "@/hooks/useSupplyChainGlobe";
import { SupplyNode, SupplyArc, NodeType, NodeStatus } from "@/types/supplyChainGlobe";

// ─── Colour palette ──────────────────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  supplier:     "#4B6EFF",
  manufacturer: "#8B5CF6",
  warehouse:    "#F59E0B",
  retailer:     "#10B981",
  port:         "#06B6D4",
};

const STATUS_COLORS: Record<NodeStatus, string> = {
  active:   "#10B981",
  delayed:  "#F59E0B",
  critical: "#EF4444",
  inactive: "#6B7280",
};

// Public topojson from Natural Earth — no API key required
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupplyChainMapProps {
  twinId?: string | null;
}

interface Tooltip {
  node: SupplyNode;
  x: number;
  y: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SupplyChainMap({ twinId }: SupplyChainMapProps) {
  const { nodes, arcs, loading, usingMockData } = useSupplyChainGlobe(twinId);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  // Build a lookup from node id → node for arc rendering
  const nodeById = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  if (loading) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-3"
        style={{ background: "#060a18" }}
      >
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm tracking-wide" style={{ color: "#6B7280" }}>
          Loading supply chain map…
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full"
      style={{ 
        background: "#060a18 url('//unpkg.com/three-globe/example/img/night-sky.png') center/cover no-repeat", 
        minHeight: 0 
      }}
      onMouseLeave={() => setTooltip(null)}
    >
      {/* ── World map ─────────────────────────────────────────────────────── */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 140 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ zoom: z, coordinates }: { zoom: number; coordinates: [number, number] }) => {
            setZoom(z);
            setCenter(coordinates as [number, number]);
          }}
          minZoom={0.8}
          maxZoom={10}
        >
          {/* ── Country fills ──────────────────────────────────────────── */}
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: "#0d1424",
                      stroke: "#1e2d4a",
                      strokeWidth: 0.4,
                      outline: "none",
                    },
                    hover: {
                      fill: "#111e33",
                      stroke: "#2a3f60",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* ── Connection arcs ─────────────────────────────────────────── */}
          {arcs.map((arc) => {
            const from = nodeById[arc.fromNodeId];
            const to   = nodeById[arc.toNodeId];
            if (!from || !to) return null;
            const color = STATUS_COLORS[arc.status] ?? STATUS_COLORS.active;
            return (
              <Line
                key={arc.id}
                from={[from.lng, from.lat]}
                to={[to.lng, to.lat]}
                stroke={color}
                strokeWidth={1.2 / zoom}
                strokeOpacity={0.55}
                strokeLinecap="round"
              />
            );
          })}

          {/* ── Supply-chain nodes ──────────────────────────────────────── */}
          {nodes.map((node) => {
            const fill  = NODE_COLORS[node.type];
            const ring  = STATUS_COLORS[node.status];
            const r     = node.status === "critical" ? 5 / zoom : 3.5 / zoom;
            return (
              <Marker
                key={node.id}
                coordinates={[node.lng, node.lat]}
                onMouseEnter={(e: React.MouseEvent) => {
                  const rect = (e.currentTarget as Element)
                    .closest("svg")!
                    .getBoundingClientRect();
                  setTooltip({
                    node,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Outer status ring */}
                <circle
                  r={r * 2.2}
                  fill={ring}
                  fillOpacity={0.18}
                  stroke={ring}
                  strokeWidth={0.8 / zoom}
                  strokeOpacity={0.5}
                />
                {/* Core dot */}
                <circle
                  r={r}
                  fill={fill}
                  stroke="#060a18"
                  strokeWidth={1.2 / zoom}
                  style={{
                    cursor: "pointer",
                    filter:
                      node.status === "critical"
                        ? `drop-shadow(0 0 ${5 / zoom}px #EF4444)`
                        : `drop-shadow(0 0 ${3 / zoom}px ${fill})`,
                  }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* ── Tooltip ───────────────────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 text-xs rounded-xl shadow-2xl"
          style={{
            left: tooltip.x + 14,
            top:  tooltip.y - 10,
            background:      "rgba(6,10,24,0.92)",
            backdropFilter:  "blur(20px)",
            border:          "1px solid rgba(255,255,255,0.1)",
            padding:         "12px 16px",
            color:           "#fff",
            minWidth:        160,
            maxWidth:        240,
          }}
        >
          <p className="font-semibold text-sm mb-1">{tooltip.node.name}</p>
          {(tooltip.node.city || tooltip.node.country) && (
            <p style={{ color: "#9ca3af", fontSize: 11 }}>
              📍 {tooltip.node.city}
              {tooltip.node.city && tooltip.node.country ? ", " : ""}
              {tooltip.node.country}
            </p>
          )}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
              style={{
                background: NODE_COLORS[tooltip.node.type] + "22",
                color:      NODE_COLORS[tooltip.node.type],
              }}
            >
              {tooltip.node.type}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
              style={{
                background: STATUS_COLORS[tooltip.node.status] + "22",
                color:      STATUS_COLORS[tooltip.node.status],
              }}
            >
              {tooltip.node.status}
            </span>
          </div>
          <p style={{ color: "#6B7280", fontSize: 10, marginTop: 6 }}>
            {tooltip.node.lat.toFixed(4)}°,{" "}
            {tooltip.node.lng.toFixed(4)}°
          </p>
        </div>
      )}

      {/* ── Zoom controls ─────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-5 right-5 z-10 flex flex-col gap-1"
      >
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.5, 10))}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white text-base font-bold transition-colors"
          style={{ background: "rgba(75,110,255,0.2)", border: "1px solid rgba(75,110,255,0.4)" }}
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z / 1.5, 0.8))}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white text-base font-bold transition-colors"
          style={{ background: "rgba(75,110,255,0.2)", border: "1px solid rgba(75,110,255,0.4)" }}
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setCenter([0, 20]); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white text-xs font-bold transition-colors"
          style={{ background: "rgba(75,110,255,0.2)", border: "1px solid rgba(75,110,255,0.4)" }}
          title="Reset view"
        >
          ⊙
        </button>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div
        className="absolute top-4 right-4 z-10 text-xs"
        style={{
          background:     "rgba(6,10,24,0.85)",
          backdropFilter: "blur(16px)",
          borderRadius:   14,
          border:         "1px solid rgba(255,255,255,0.06)",
          padding:        "14px 16px",
          color:          "#fff",
          minWidth:       150,
        }}
      >
        <p className="font-semibold mb-2 uppercase tracking-wider" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
          Node Types
        </p>
        {(Object.entries(NODE_COLORS) as [NodeType, string][]).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}66` }} />
            <span className="capitalize" style={{ color: "#d1d5db" }}>{type}</span>
          </div>
        ))}
        <p className="font-semibold mt-4 mb-2 uppercase tracking-wider" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
          Status
        </p>
        {(Object.entries(STATUS_COLORS) as [NodeStatus, string][]).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}66` }} />
            <span className="capitalize" style={{ color: "#d1d5db" }}>{status}</span>
          </div>
        ))}

        <p className="mt-4 text-center" style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
          {nodes.length} node{nodes.length !== 1 ? "s" : ""} · {arcs.length} route{arcs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Controls hint ─────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-5 left-5 z-10 text-xs px-3 py-2 rounded-full"
        style={{ background: "rgba(6,10,24,0.6)", border: "1px solid rgba(255,255,255,0.06)", color: "#6B7280" }}
      >
        🖱 Drag to pan · Scroll to zoom
      </div>

    </div>
  );
}
