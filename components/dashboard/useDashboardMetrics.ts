"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import { getUserSupplyChainsAction } from "@/lib/actions/edge-functions"

export interface DashboardMetrics {
  // KPI strip
  nodeExposurePct: string      // e.g. "34%"
  recoveryWindow: string       // e.g. "12–18 days"
  activeFaults: number
  estimatedSavings: string     // placeholder derived value

  // Sidebar stats
  exposureIndex: string
  meanRecovery: string

  // Node health by category
  nodeHealth: {
    originNodes: number
    transitHubs: number
    distribution: number
    endPoints: number
  }

  // Meta
  totalSupplyChains: number
  totalNodes: number
  totalEdges: number
  isLoading: boolean
  error: string | null
}

const DEFAULT_METRICS: DashboardMetrics = {
  nodeExposurePct: "—",
  recoveryWindow: "—",
  activeFaults: 0,
  estimatedSavings: "—",
  exposureIndex: "—",
  meanRecovery: "—",
  nodeHealth: { originNodes: 0, transitHubs: 0, distribution: 0, endPoints: 0 },
  totalSupplyChains: 0,
  totalNodes: 0,
  totalEdges: 0,
  isLoading: true,
  error: null,
}

/** Map a node type string to one of the four health buckets */
function classifyNode(type: string | null | undefined): keyof DashboardMetrics["nodeHealth"] {
  const t = (type || "").toLowerCase()
  if (t.includes("supplier") || t.includes("origin") || t.includes("source") || t.includes("raw")) {
    return "originNodes"
  }
  if (t.includes("port") || t.includes("hub") || t.includes("transit") || t.includes("airport")) {
    return "transitHubs"
  }
  if (t.includes("warehouse") || t.includes("distribution") || t.includes("dc") || t.includes("fulfillment")) {
    return "distribution"
  }
  return "endPoints"
}

export function useDashboardMetrics(): DashboardMetrics {
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // 1. Get current user
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
          if (!cancelled) setMetrics(m => ({ ...m, isLoading: false, error: "Not authenticated" }))
          return
        }

        // 2. Fetch all supply chains with nodes + edges
        const { data, error } = await getUserSupplyChainsAction(user.id)
        if (error || !data) {
          if (!cancelled) setMetrics(m => ({ ...m, isLoading: false, error: error || "Failed to load data" }))
          return
        }

        const supplyChains: any[] = data.data || []

        // 3. Aggregate all nodes across supply chains
        const allNodes: any[] = supplyChains.flatMap(sc => sc.nodes || [])
        const allEdges: any[] = supplyChains.flatMap(sc => sc.edges || [])

        const totalNodes = allNodes.length
        const totalEdges = allEdges.length

        // Node risk lives on two scales: risk_level 0–5 (agent risk scorer) and data.riskScore 0–1 (canvas). Normalise to 0–100.
        const riskOf = (n: any): number => {
          const rl = Number(n.risk_level ?? NaN), rs = Number(n.data?.riskScore ?? NaN)
          if (!Number.isNaN(rl) && rl > 0) return rl <= 5 ? rl * 20 : rl
          if (!Number.isNaN(rs)) return rs <= 1 ? rs * 100 : rs
          const lvl = String(n.data?.riskLevel ?? "").toLowerCase()
          return lvl === "critical" ? 90 : lvl === "high" ? 75 : lvl === "medium" ? 50 : 10
        }
        // 4. Exposure: nodes at medium risk or worse (≥ 50/100)
        const exposedNodes = allNodes.filter(n => riskOf(n) >= 50)
        const nodeExposurePct = totalNodes > 0
          ? `${Math.round((exposedNodes.length / totalNodes) * 100)}%`
          : "0%"

        // Sidebar exposure index: weighted average risk
        const avgRisk = totalNodes > 0 ? allNodes.reduce((sum, n) => sum + riskOf(n), 0) / totalNodes : 0
        const exposureIndex = totalNodes > 0 ? avgRisk.toFixed(1) : "—"

        // 5. Active faults: high-risk nodes (≥ 70/100)
        const activeFaults = allNodes.filter(n => riskOf(n) >= 70).length

        // 6. Recovery window: node lead times when present, otherwise the lane transit range (how long a reroute takes to land)
        const leadTimes = allNodes.map(n => Number(n.lead_time ?? n.data?.leadTime ?? 0)).filter(v => v > 0)
        const transit = allEdges.map(e => Number(e.transit_days ?? e.data?.transitTime ?? e.data?.transit_days ?? 0)).filter(v => v > 0)
        const meanRecoveryNum = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : transit.length > 0 ? transit.reduce((a, b) => a + b, 0) / transit.length : 0
        const maxRecovery = leadTimes.length > 0 ? Math.round(meanRecoveryNum * 1.5) : transit.length > 0 ? Math.max(...transit) : 0
        const recoveryWindow = meanRecoveryNum > 0 ? `${Math.round(meanRecoveryNum)}–${Math.max(maxRecovery, Math.round(meanRecoveryNum))} days` : "—"
        const meanRecovery = meanRecoveryNum > 0 ? `${Math.round(meanRecoveryNum)} days` : "—"

        // 7. Estimated savings: simple heuristic — $1.2k per exposed node resolved
        const estimatedSavings = exposedNodes.length > 0
          ? `$${(exposedNodes.length * 1.2).toFixed(0)}k`
          : "$0"

        // 8. Node health buckets
        const nodeHealth = { originNodes: 0, transitHubs: 0, distribution: 0, endPoints: 0 }
        allNodes.forEach(n => {
          const bucket = classifyNode(n.type ?? n.data?.type)
          nodeHealth[bucket]++
        })

        if (!cancelled) {
          setMetrics({
            nodeExposurePct,
            recoveryWindow,
            activeFaults,
            estimatedSavings,
            exposureIndex,
            meanRecovery,
            nodeHealth,
            totalSupplyChains: supplyChains.length,
            totalNodes,
            totalEdges,
            isLoading: false,
            error: null,
          })
        }
      } catch (err: any) {
        if (!cancelled) setMetrics(m => ({ ...m, isLoading: false, error: err.message }))
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return metrics
}
