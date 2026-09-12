"use client";

import { useState, useEffect } from "react";
import { SupplyNode, SupplyArc, NodeType, NodeStatus } from "@/types/supplyChainGlobe";

// ─── Mock fallback data — used when DB tables aren't ready yet ────────────────

const MOCK_NODES: SupplyNode[] = [
  { id: "1", name: "Shenzhen Factory", lat: 22.5431, lng: 114.0579, type: "manufacturer", status: "active", country: "China", city: "Shenzhen" },
  { id: "2", name: "Singapore Port", lat: 1.2644, lng: 103.8222, type: "port", status: "active", country: "Singapore", city: "Singapore" },
  { id: "3", name: "Rotterdam Port", lat: 51.9225, lng: 4.4792, type: "port", status: "active", country: "Netherlands", city: "Rotterdam" },
  { id: "4", name: "Hamburg Warehouse", lat: 53.5753, lng: 10.0153, type: "warehouse", status: "delayed", country: "Germany", city: "Hamburg" },
  { id: "5", name: "Chicago Warehouse", lat: 41.8781, lng: -87.6298, type: "warehouse", status: "active", country: "USA", city: "Chicago" },
  { id: "6", name: "NYC Retailer", lat: 40.7128, lng: -74.006, type: "retailer", status: "active", country: "USA", city: "New York" },
  { id: "7", name: "LA Port", lat: 33.7295, lng: -118.2621, type: "port", status: "active", country: "USA", city: "Los Angeles" },
  { id: "8", name: "Tokyo Manufacturer", lat: 35.6762, lng: 139.6503, type: "manufacturer", status: "active", country: "Japan", city: "Tokyo" },
  { id: "9", name: "Mumbai Supplier", lat: 19.076, lng: 72.8777, type: "supplier", status: "critical", country: "India", city: "Mumbai" },
  { id: "10", name: "São Paulo Retailer", lat: -23.5505, lng: -46.6333, type: "retailer", status: "active", country: "Brazil", city: "São Paulo" },
  { id: "11", name: "Dubai Port", lat: 25.2048, lng: 55.2708, type: "port", status: "delayed", country: "UAE", city: "Dubai" },
  { id: "12", name: "Sydney Warehouse", lat: -33.8688, lng: 151.2093, type: "warehouse", status: "active", country: "Australia", city: "Sydney" },
];

const MOCK_ARCS: SupplyArc[] = [
  { id: "a1", fromNodeId: "1", toNodeId: "2", startLat: 22.5431, startLng: 114.0579, endLat: 1.2644, endLng: 103.8222, status: "active" },
  { id: "a2", fromNodeId: "2", toNodeId: "3", startLat: 1.2644, startLng: 103.8222, endLat: 51.9225, endLng: 4.4792, status: "active" },
  { id: "a3", fromNodeId: "3", toNodeId: "4", startLat: 51.9225, startLng: 4.4792, endLat: 53.5753, endLng: 10.0153, status: "delayed" },
  { id: "a4", fromNodeId: "4", toNodeId: "6", startLat: 53.5753, startLng: 10.0153, endLat: 40.7128, endLng: -74.006, status: "active" },
  { id: "a5", fromNodeId: "7", toNodeId: "5", startLat: 33.7295, startLng: -118.2621, endLat: 41.8781, endLng: -87.6298, status: "active" },
  { id: "a6", fromNodeId: "8", toNodeId: "2", startLat: 35.6762, startLng: 139.6503, endLat: 1.2644, endLng: 103.8222, status: "active" },
  { id: "a7", fromNodeId: "9", toNodeId: "11", startLat: 19.076, startLng: 72.8777, endLat: 25.2048, endLng: 55.2708, status: "critical" },
  { id: "a8", fromNodeId: "11", toNodeId: "3", startLat: 25.2048, startLng: 55.2708, endLat: 51.9225, endLng: 4.4792, status: "delayed" },
  { id: "a9", fromNodeId: "1", toNodeId: "7", startLat: 22.5431, startLng: 114.0579, endLat: 33.7295, endLng: -118.2621, status: "active" },
  { id: "a10", fromNodeId: "5", toNodeId: "6", startLat: 41.8781, startLng: -87.6298, endLat: 40.7128, endLng: -74.006, status: "active" },
];

// ─── Map digital-twin node types → globe node types ──────────────────────────

const TWIN_TYPE_MAP: Record<string, NodeType> = {
  suppliernode: "supplier",
  supplier: "supplier",
  factorynode: "manufacturer",
  factory: "manufacturer",
  manufacturer: "manufacturer",
  warehousenode: "warehouse",
  warehouse: "warehouse",
  distributionnode: "warehouse",
  distribution: "warehouse",
  portnode: "port",
  port: "port",
  retailernode: "retailer",
  retailer: "retailer",
  "supply-chain-node": "warehouse",
  supplychainnode: "warehouse",
};

function mapNodeType(raw: string | null | undefined): NodeType {
  if (!raw) return "warehouse";
  return TWIN_TYPE_MAP[raw.toLowerCase().replace(/[\s\-_]/g, "")] ?? "warehouse";
}

function mapRiskToStatus(riskLevel: number | string | null | undefined): NodeStatus {
  const n = typeof riskLevel === "string" ? parseFloat(riskLevel) : riskLevel;
  if (n == null || isNaN(n)) return "active";
  if (n >= 8) return "critical";
  if (n >= 5) return "delayed";
  return "active";
}

// ─── Extract nodes from localStorage canvas data ─────────────────────────────

function extractFromLocalStorage(twinId: string): { nodes: SupplyNode[]; arcs: SupplyArc[] } | null {
  try {
    const raw = localStorage.getItem(`supplyChain-${twinId}`);
    if (!raw) return null;

    const twinData = JSON.parse(raw);
    const canvasNodes: any[] = twinData.nodes ?? [];
    const canvasEdges: any[] = twinData.edges ?? [];

    // Only keep canvas nodes that have lat/lng coordinates
    const nodeMap = new Map<string, SupplyNode>();

    for (const cn of canvasNodes) {
      const d = cn.data ?? {};
      // Accept coordinates from multiple possible field names
      // Templates store coords as data.location.lat/lng; direct fields also supported
      const loc = d.location ?? {};
      const lat = d.lat ?? loc.lat ?? d.location_lat ?? d.latitude ?? null;
      const lng = d.lng ?? loc.lng ?? d.location_lng ?? d.longitude ?? null;

      if (lat == null || lng == null) continue;

      const nodeType = mapNodeType(d.nodeType ?? d.type ?? cn.type);
      // Templates use riskScore (0-1 float), DB uses risk_level (1-10)
      const rawRisk = d.riskLevel ?? d.risk_level ?? (d.riskScore != null ? d.riskScore * 10 : null);
      const status = mapRiskToStatus(rawRisk);

      const node: SupplyNode = {
        id: cn.id,
        name: d.label ?? d.name ?? "Unnamed Node",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        type: nodeType,
        status,
        country: d.country ?? loc.country ?? "",
        city: d.city ?? d.address ?? loc.address ?? d.location_city ?? "",
      };
      nodeMap.set(cn.id, node);
    }

    const nodes = Array.from(nodeMap.values());

    // Build arcs from canvas edges where both endpoints have coordinates
    const arcs: SupplyArc[] = [];
    for (const edge of canvasEdges) {
      const from = nodeMap.get(edge.source);
      const to = nodeMap.get(edge.target);
      if (!from || !to) continue;

      arcs.push({
        id: edge.id,
        fromNodeId: from.id,
        toNodeId: to.id,
        startLat: from.lat,
        startLng: from.lng,
        endLat: to.lat,
        endLng: to.lng,
        label: edge.label ?? edge.data?.label,
        status:
          from.status === "critical" || to.status === "critical"
            ? "critical"
            : from.status === "delayed" || to.status === "delayed"
            ? "delayed"
            : "active",
      });
    }

    if (nodes.length === 0) return null; // no geo data, fall through
    return { nodes, arcs };
  } catch {
    return null;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseSupplyChainGlobeResult {
  nodes: SupplyNode[];
  arcs: SupplyArc[];
  loading: boolean;
  error: string | null;
  usingMockData: boolean;
}

export function useSupplyChainGlobe(twinId?: string | null): UseSupplyChainGlobeResult {
  const [nodes, setNodes] = useState<SupplyNode[]>([]);
  const [arcs, setArcs] = useState<SupplyArc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      // ── Strategy 1: Read canvas nodes from localStorage ────────────────
      if (twinId) {
        const localResult = extractFromLocalStorage(twinId);
        if (localResult && localResult.nodes.length > 0) {
          if (!cancelled) {
            setNodes(localResult.nodes);
            setArcs(localResult.arcs);
            setUsingMockData(false);
            setLoading(false);
          }
          return;
        }
      }

      // ── Strategy 2: Pull directly from the digital twin DB tables ──────
      if (twinId) {
        try {
          const res = await fetch(`/api/supply-chain/twin-globe?twinId=${twinId}`);
          if (res.ok) {
            const payload = await res.json();
            if (!cancelled && payload.nodes?.length > 0) {
              setNodes(payload.nodes);
              setArcs(payload.arcs ?? []);
              setUsingMockData(false);
              setLoading(false);
              return;
            }
          }
        } catch {
          // fall through to legacy API
        }
      }

      // ── Strategy 3: Legacy supply_globe_nodes / supply_globe_arcs API ──
      try {
        const params = twinId ? `?twinId=${twinId}` : "";
        const [nodesRes, arcsRes] = await Promise.all([
          fetch(`/api/supply-chain/nodes${params}`),
          fetch(`/api/supply-chain/arcs${params}`),
        ]);

        if (!nodesRes.ok || !arcsRes.ok) throw new Error("API error");

        const [fetchedNodes, fetchedArcs]: [SupplyNode[], SupplyArc[]] =
          await Promise.all([nodesRes.json(), arcsRes.json()]);

        if (cancelled) return;

        if (fetchedNodes.length > 0) {
          setNodes(fetchedNodes);
          setArcs(fetchedArcs);
          setUsingMockData(false);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to mock
      }

      // ── Strategy 4: Mock data ──────────────────────────────────────────
      if (!cancelled) {
        setNodes(MOCK_NODES);
        setArcs(MOCK_ARCS);
        setUsingMockData(true);
        setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [twinId]);

  return { nodes, arcs, loading, error, usingMockData };
}

export { mapNodeType };
