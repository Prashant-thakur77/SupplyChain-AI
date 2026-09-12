"use client"

import { useEffect, useState } from "react"
import { ReactFlowProvider, getNodesBounds, useReactFlow } from "reactflow"
import { ArrowRight, Bot, GitBranch, Inbox, Loader2, Play, Radar, Newspaper, CloudLightning } from "lucide-react"
import type { IncidentEvent } from "@/types/agent"
import DigitalTwinCanvas from "@/components/digital-twin/canvas/digital-twin-canvas"
import { useIncident } from "@/components/digital-twin/incident/useIncident"
import { CopilotProvider } from "@/components/copilot/copilot-provider"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"
import { DEMO_SCENARIOS, DEMO_SUPPLY_CHAIN_ID, demoArch } from "@/lib/demo-twin"
import { cn } from "@/lib/utils"
import { StrandsChat } from "@/components/copilot/StrandsChat"

function DemoInner() {
  const setControlTowerMode = useDigitalTwinStore((s) => s.setControlTowerMode)
  const incident = useIncident({ endpoint: "/api/demo/incident", supplyChainId: DEMO_SUPPLY_CHAIN_ID, userId: "demo", persist: false })
  const [active, setActive] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [found, setFound] = useState<(IncidentEvent & { failed_labels?: string[] })[] | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const rf = useReactFlow()

  const scanNow = async () => {
    setScanning(true); setScanError(null); setFound(null)
    try {
      const res = await fetch("/api/demo/scan", { method: "POST" })
      const j = await res.json()
      if (!res.ok) throw new Error(j.detail ?? j.error ?? `Scan failed (${res.status})`)
      setFound(j.events ?? [])
    } catch (e) { setScanError((e as Error).message) } finally { setScanning(false) }
  }

  const runFound = async (ev: IncidentEvent) => {
    setActive(`found-${ev.id}`)
    refit()
    await incident.start(ev)
    setTimeout(refit, 300)
  }
  useEffect(() => { setControlTowerMode(true); return () => setControlTowerMode(false) }, [setControlTowerMode])

  /** Keep the graph in the strip between the Control Tower (left) and the incident panel (right). */
  const refit = () => {
    const nodes = useDigitalTwinStore.getState().nodes
    if (!nodes.length) return
    const b = getNodesBounds(nodes as any)
    // Pad left for the control tower and right for the incident panel so the twin lands in the free band.
    rf.fitBounds({ x: b.x - 40, y: b.y - 40, width: (b.width + 40) / 0.63, height: b.height + 80 }, { duration: 500 })
  }
  useEffect(() => { const t = setTimeout(refit, 400); return () => clearTimeout(t) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (key: string) => {
    const sc = DEMO_SCENARIOS.find((s) => s.key === key)!
    setActive(key)
    refit()
    await incident.start(sc.event)
    setTimeout(refit, 300)
  }

  return (
    <div className="flex h-[calc(100vh-52px)] flex-col lg:flex-row">
      <aside className="w-full shrink-0 space-y-4 overflow-y-auto border-b border-theme-border-subtle bg-theme-bg-surface p-4 lg:w-[340px] lg:border-b-0 lg:border-r">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-blue">Live demo · no login</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-theme-text-primary">Break the supply chain. Watch the agent decide.</h1>
          <p className="mt-2 text-sm leading-relaxed text-theme-text-secondary">
            An EU electronics importer ships from Shenzhen to Berlin. Pick a disruption: the Strands incident graph grades it, the routing engine computes exact reroutes, and you get one decision to approve.
          </p>
        </div>
        <ol className="space-y-2">
          {DEMO_SCENARIOS.map((s, i) => {
            const running = incident.status === "running" && active === s.key
            return (
              <li key={s.key}>
                <button type="button" disabled={incident.status === "running"} onClick={() => run(s.key)}
                  className={cn("flex w-full items-start gap-3 rounded-theme-md border p-3 text-left transition-colors", active === s.key ? "border-theme-red/40 bg-theme-red-soft/50" : "border-theme-border-subtle bg-theme-bg-secondary hover:border-theme-border-default", incident.status === "running" && "opacity-70")}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-theme-red text-[11px] font-bold text-white">{running ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}</span>
                  <span><span className="block text-sm font-semibold text-theme-text-primary">{s.label}</span><span className="block text-xs text-theme-text-secondary">{s.blurb}</span></span>
                  <Play className="ml-auto mt-1 h-4 w-4 shrink-0 text-theme-text-muted" />
                </button>
              </li>
            )
          })}
        </ol>
        <div className="space-y-2 rounded-theme-md border border-theme-border-subtle p-3 text-xs text-theme-text-secondary">
          <div className="flex items-center gap-2"><Radar className="h-3.5 w-3.5 text-theme-blue" /> In production, <strong className="text-theme-text-primary">Sentinel</strong> finds these events itself every 15 minutes.</div>
          <div className="flex items-center gap-2"><GitBranch className="h-3.5 w-3.5 text-theme-blue" /> Routes are computed by Dijkstra — the model only ranks and explains.</div>
          <div className="flex items-center gap-2"><Inbox className="h-3.5 w-3.5 text-theme-blue" /> Approving writes to the Decision Inbox and the audit log.</div>
          <div className="flex items-center gap-2"><Bot className="h-3.5 w-3.5 text-theme-blue" /> Every step is a Strands Agent with a typed output.</div>
        </div>
        <div className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-text-muted">Or let Sentinel look</p>
              <p className="text-xs text-theme-text-secondary">Real news + weather for these 8 nodes, right now.</p>
            </div>
            <button type="button" onClick={scanNow} disabled={scanning || incident.status === "running"} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-theme-blue/30 bg-theme-blue-soft px-3 py-1.5 text-xs font-semibold text-theme-blue hover:bg-theme-blue/15 disabled:opacity-60">
              {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}{scanning ? "Scanning…" : "Scan live news"}
            </button>
          </div>
          {scanError && <p className="mt-2 text-xs text-theme-red">{scanError}</p>}
          {found && found.length === 0 && <p className="mt-2 text-xs text-theme-text-muted">Nothing touching this twin in the last 7 days — which is exactly when the agent stays quiet.</p>}
          {found && found.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {found.slice(0, 4).map((ev) => (
                <li key={ev.id} className="flex items-start gap-2 rounded-theme-sm border border-theme-border-subtle bg-theme-bg-surface p-2">
                  {ev.kind === "weather" ? <CloudLightning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-theme-amber" /> : <Newspaper className="mt-0.5 h-3.5 w-3.5 shrink-0 text-theme-blue" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-theme-text-primary" title={ev.title}>{ev.title}</div>
                    <div className="text-[11px] text-theme-text-muted">{(ev.failed_labels ?? ev.failed_node_ids).join(", ")}{ev.sources?.length ? ` · ${ev.sources.length} source${ev.sources.length === 1 ? "" : "s"}` : ""}</div>
                  </div>
                  <button type="button" onClick={() => runFound(ev)} disabled={incident.status === "running"} className="shrink-0 rounded-full bg-theme-red px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60">Run</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-text-muted">Ask the copilot</p>
          <StrandsChat endpoint="/api/demo/chat" compact suggestions={["What if Suez is blocked?", "Which node is our single point of failure?", "Cheapest route Shenzhen → Berlin?"]} placeholder="Ask about this twin…" />
        </div>
        {incident.status === "idle" && !incident.incident && (
          <p className="text-xs text-theme-text-muted">Tip: after a run, click a coloured route on the canvas to select it, then approve. Right-click any node to invent your own disruption. <ArrowRight className="inline h-3 w-3" /></p>
        )}
      </aside>
      <div className="relative min-h-[480px] flex-1">
        <DigitalTwinCanvas initialNodes={demoArch.nodes} initialEdges={demoArch.edges} viewOnly userId="demo" incidentEndpoint="/api/demo/incident" hideControlTower />
      </div>
    </div>
  )
}

export function DemoTwin() {
  return (
    <CopilotProvider>
      <ReactFlowProvider>
        <DemoInner />
      </ReactFlowProvider>
    </CopilotProvider>
  )
}
