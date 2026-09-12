"use client"

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "reactflow"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"

/** Overlay edge drawn for a candidate reroute. data: { routeId, color, rank, label, selected } */
export function RouteEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) {
  const selectedRouteId = useDigitalTwinStore((s) => s.selectedRouteId)
  const setSelectedRouteId = useDigitalTwinStore((s) => s.setSelectedRouteId)
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature: 0.35 })
  const active = selectedRouteId === data?.routeId
  const color: string = data?.color ?? "#22c55e"
  return (
    <>
      <BaseEdge id={id} path={path} style={{ stroke: color, strokeWidth: active ? 4 : 2.5, opacity: active ? 1 : 0.55, strokeDasharray: "8 6", animation: "dashdraw 1.2s linear infinite" }} />
      {data?.showLabel && (
        <EdgeLabelRenderer>
          <button
            type="button"
            onClick={() => setSelectedRouteId(data.routeId)}
            style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "all", borderColor: color, color, opacity: active ? 1 : 0.8 }}
            className="nodrag nopan rounded-full border-2 bg-theme-bg-surface px-2 py-0.5 text-[11px] font-bold shadow-sm"
          >
            {data.label}
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
