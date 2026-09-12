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

        // 4. Compute exposure: nodes with risk_level > 50
        const exposedNodes = allNodes.filter(n => {
          const risk = n.risk_level ?? n.data?.riskScore ?? 0
          return Number(risk) > 50
        })
        const nodeExposurePct = totalNodes > 0
          ? `${Math.round((exposedNodes.length / totalNodes) * 100)}%`
          : "0%"

        // Sidebar exposure index: weighted average risk
        const avgRisk = totalNodes > 0
          ? allNodes.reduce((sum, n) => sum + Number(n.risk_level ?? n.data?.riskScore ?? 0), 0) / totalNodes
          : 0
        const exposureIndex = totalNodes > 0 ? avgRisk.toFixed(1) : "—"

        // 5. Active faults: nodes with risk_level > 75
        const activeFaults = allNodes.filter(n => {
          const risk = n.risk_level ?? n.data?.riskScore ?? 0
          return Number(risk) > 75
        }).length

        // 6. Recovery window heuristic (based on avg lead time or days_of_supply)
        const leadTimes = allNodes
          .map(n => Number(n.lead_time ?? n.data?.leadTime ?? 0))
          .filter(v => v > 0)
        const meanRecoveryNum = leadTimes.length > 0
          ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
          : 0
        const recoveryWindow = meanRecoveryNum > 0
          ? `${Math.round(meanRecoveryNum)}–${Math.round(meanRecoveryNum * 1.5)} days`
          : "—"
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
