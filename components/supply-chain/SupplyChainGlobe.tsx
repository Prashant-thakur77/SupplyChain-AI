"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSupplyChainGlobe } from "@/hooks/useSupplyChainGlobe";
import { SupplyNode, NodeType, NodeStatus } from "@/types/supplyChainGlobe";

// Dynamic import — no SSR (WebGL requires browser)
const Globe = dynamic(() => import("react-globe.gl").then((m) => m.default), {
  ssr: false,
});

// ─── Palette ─────────────────────────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  supplier: "#4B6EFF",
  manufacturer: "#8B5CF6",
  warehouse: "#F59E0B",
  retailer: "#10B981",
  port: "#06B6D4",
};

const STATUS_COLORS: Record<NodeStatus, string> = {
  active: "#10B981",
  delayed: "#F59E0B",
  critical: "#EF4444",
  inactive: "#6B7280",
};

// Glow ring colors (outer halo per status)
const GLOW_COLORS: Record<NodeStatus, string> = {
  active: "rgba(16,185,129,0.25)",
  delayed: "rgba(245,158,11,0.3)",
  critical: "rgba(239,68,68,0.35)",
  inactive: "rgba(107,114,128,0.15)",
};

// ─── Component ───────────────────────────────────────────────────────────────

interface SupplyChainGlobeProps {
  twinId?: string | null;
}

export default function SupplyChainGlobe({ twinId }: SupplyChainGlobeProps) {
  const { nodes, arcs, loading, usingMockData } = useSupplyChainGlobe(twinId);
  const [selectedNode, setSelectedNode] = useState<SupplyNode | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);

  // ── Configure globe controls once mounted ────────────────────────────
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    // Access the Three.js OrbitControls instance
    const controls = globe.controls();
    if (controls) {
      // Enable full 360° rotation in all directions
      controls.enableRotate = true;
      controls.autoRotate = false;          // User has full manual control
      controls.autoRotateSpeed = 0;
      controls.enableZoom = true;
      controls.enablePan = false;           // Pan disabled — rotate only
      controls.minDistance = 150;            // Don't zoom too close
      controls.maxDistance = 600;            // Don't zoom too far
      controls.rotateSpeed = 0.8;           // Smooth rotation speed
      controls.zoomSpeed = 0.6;             // Smooth zoom speed
      controls.enableDamping = true;        // Inertia feel
      controls.dampingFactor = 0.12;
      // Remove polar angle limits — allow full vertical rotation
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI;
    }

    // Set initial point of view
    globe.pointOfView({ lat: 20, lng: 30, altitude: 2.5 }, 0);
  }, [loading]); // re-run when loading finishes

  // ── Node click ───────────────────────────────────────────────────────
  const handleNodeClick = useCallback((point: object) => {
    const node = point as SupplyNode;
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));

    // Smoothly fly to the clicked node
    const globe = globeRef.current;
    if (globe) {
      globe.pointOfView({ lat: node.lat, lng: node.lng, altitude: 1.8 }, 800);
    }
  }, []);

  // ── Rings data (pulsating glows around nodes) ────────────────────────
  const ringsData = useMemo(
    () =>
      nodes.map((n) => ({
        lat: n.lat,
        lng: n.lng,
        maxR: n.status === "critical" ? 3 : 1.5,
        propagationSpeed: n.status === "critical" ? 4 : 2,
        repeatPeriod: n.status === "critical" ? 600 : 1200,
        color: GLOW_COLORS[n.status],
      })),
    [nodes]
  );

  // ─── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-3"
        style={{ background: "#060a18" }}
      >
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm tracking-wide" style={{ color: "#6B7280" }}>
          Loading supply chain globe…
        </span>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className="relative w-full h-full flex-1 bg-[#060a18]">
      <Globe
        ref={globeRef}
        // Let react-globe.gl auto-resize to fill the flex container
        // ── Earth textures ──
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        // ── Atmosphere ──
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.18}
        // ── Points (nodes) ──
        pointsData={nodes}
        pointLat="lat"
        pointLng="lng"
        pointColor={(point) => NODE_COLORS[(point as SupplyNode).type]}
        pointRadius={(point) => {
          const n = point as SupplyNode;
          return n.status === "critical" ? 0.7 : 0.45;
        }}
        pointAltitude={0.015}
        pointLabel={(point) => {
          const n = point as SupplyNode;
          return `<div style="
            background:rgba(0,0,0,0.85);
            backdrop-filter:blur(12px);
            padding:8px 14px;
            border-radius:10px;
            border:1px solid rgba(255,255,255,0.12);
            color:#fff;
            font-size:12px;
            font-family:system-ui,-apple-system,sans-serif;
            line-height:1.5;
            min-width:140px;
          ">
            <div style="font-weight:600;margin-bottom:2px;">${n.name}</div>
            <div style="color:#9ca3af;font-size:11px;">${n.city}${n.city && n.country ? ", " : ""}${n.country}</div>
            <div style="display:flex;gap:6px;margin-top:6px;">
              <span style="
                background:${NODE_COLORS[n.type]}22;
                color:${NODE_COLORS[n.type]};
                padding:2px 8px;
                border-radius:6px;
                font-size:10px;
                font-weight:500;
                text-transform:capitalize;
              ">${n.type}</span>
              <span style="
                background:${STATUS_COLORS[n.status]}22;
                color:${STATUS_COLORS[n.status]};
                padding:2px 8px;
                border-radius:6px;
                font-size:10px;
                font-weight:500;
                text-transform:capitalize;
              ">${n.status}</span>
            </div>
          </div>`;
        }}
        onPointClick={handleNodeClick}
        // ── Arcs (edges / connections) ──
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={(arc: any) => {
          const s = arc.status as NodeStatus;
          const c = STATUS_COLORS[s] ?? STATUS_COLORS.active;
          return [`${c}CC`, `${c}66`]; // gradient: opaque start → semi-transparent end
        }}
        arcAltitude={(arc: any) => {
          // Height proportional to distance (longer arcs = higher)
          const dLat = Math.abs(arc.startLat - arc.endLat);
          const dLng = Math.abs(arc.startLng - arc.endLng);
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          return Math.min(0.08 + dist * 0.003, 0.5);
        }}
        arcStroke={0.8}
        // ── Rings (pulsating halos) ──
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor={() => (t: number) => `rgba(59,130,246,${1 - t})`}
      />

      {/* ── Selected node panel ─────────────────────────────────────────── */}
      {selectedNode && (
        <div
          className="absolute bottom-5 left-5 z-10"
          style={{
            background: "rgba(6,10,24,0.85)",
            backdropFilter: "blur(20px)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "20px",
            color: "#fff",
            width: "280px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-tight">{selectedNode.name}</p>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full transition-colors"
              style={{ background: "rgba(255,255,255,0.08)", color: "#9ca3af" }}
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: NODE_COLORS[selectedNode.type] + "22",
                color: NODE_COLORS[selectedNode.type],
              }}
            >
              {selectedNode.type}
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: STATUS_COLORS[selectedNode.status] + "22",
                color: STATUS_COLORS[selectedNode.status],
              }}
            >
              {selectedNode.status}
            </span>
          </div>

          {(selectedNode.city || selectedNode.country) && (
            <p className="text-xs mt-3" style={{ color: "#9ca3af" }}>
              📍 {selectedNode.city}
              {selectedNode.city && selectedNode.country ? ", " : ""}
              {selectedNode.country}
            </p>
          )}

          {/* Connection count */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Connections:{" "}
              <span style={{ color: "#d1d5db" }}>
                {arcs.filter(
                  (a) => a.fromNodeId === selectedNode.id || a.toNodeId === selectedNode.id
                ).length}
              </span>
            </p>
          </div>
        </div>
      )}



      {/* ── Controls hint ─────────────────────────────────────────────── */}
      <div
        className="absolute bottom-5 right-5 z-10 text-xs px-3 py-2 rounded-full"
        style={{
          background: "rgba(6,10,24,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "#6B7280",
        }}
      >
        🖱 Drag to rotate · Scroll to zoom
      </div>

    </div>
  );
}
