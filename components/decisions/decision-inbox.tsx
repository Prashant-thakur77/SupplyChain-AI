"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Inbox, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { listDecisions } from "@/lib/decisions"
import { supabaseClient } from "@/lib/supabase/client"
import { getUserData } from "@/utils/functions/userUtils"
import type { DecisionRow } from "@/types/agent"
import { cn } from "@/lib/utils"
import { DecisionCard } from "./decision-card"

type Tab = "pending" | "decided"

export function DecisionInbox() {
  const [user, setUser] = useState<any>(null)
  const [rows, setRows] = useState<DecisionRow[] | null>(null)
  const [tab, setTab] = useState<Tab>("pending")
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [chains, setChains] = useState<number>(0)
  const [refreshing, setRefreshing] = useState(false)
  const [serviceDown, setServiceDown] = useState(false)
  useEffect(() => { fetch("/api/agent/status", { cache: "no-store" }).then((r) => r.json()).then((j) => setServiceDown(!j.service?.ok)).catch(() => setServiceDown(true)) }, [])

  const load = useCallback(async (uid: string) => {
    const [decisions, scan, sc] = await Promise.all([
      listDecisions(uid),
      (supabaseClient as any).from("agent_traces").select("started_at").eq("user_id", uid).eq("workflow_stage", "scan").order("started_at", { ascending: false }).limit(1),
      (supabaseClient as any).from("supply_chains").select("supply_chain_id", { count: "exact", head: true }).eq("user_id", uid),
    ])
    setRows(decisions)
    setLastScan(scan.data?.[0]?.started_at ?? null)
    setChains(sc.count ?? 0)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const u = await getUserData()
      if (cancelled) return
      setUser(u)
      if (u?.id) await load(u.id).catch(() => setRows([]))
      else setRows([])
    })()
    return () => { cancelled = true }
  }, [load])

  useEffect(() => {
    if (!user?.id) return
    const t = setInterval(() => load(user.id).catch(() => undefined), 30_000)
    return () => clearInterval(t)
  }, [user?.id, load])

  const pending = useMemo(() => (rows ?? []).filter((r) => r.status === "pending" || r.status === "snoozed"), [rows])
  const decided = useMemo(() => (rows ?? []).filter((r) => r.status !== "pending" && r.status !== "snoozed"), [rows])
  const visible = tab === "pending" ? pending : decided

  function onChange(updated: DecisionRow) {
    setRows((prev) => (prev ?? []).map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Human in the loop"
        title="Decision Inbox"
        subtitle="The agent watches your supply chains around the clock and only asks you when there is a real decision to make. Each card is a ranked set of options with exact cost, time and risk."
        icon={<Inbox className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" disabled={refreshing || !user?.id} onClick={async () => { setRefreshing(true); await load(user.id).catch(() => undefined); setRefreshing(false) }}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /> Refresh
          </Button>
        }
      />

      {serviceDown && (
        <div className="mt-4 rounded-theme-md border border-theme-amber/30 bg-theme-amber-soft px-3 py-2 text-sm text-theme-amber">
          The agent service is unreachable right now. Existing decisions still show; new scans and incident runs are paused until it is back.
        </div>
      )}

      <div className="mt-6 flex items-center gap-1 rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-1 text-sm">
        {(["pending", "decided"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("flex-1 rounded-theme-sm px-3 py-1.5 font-medium capitalize transition-colors", tab === t ? "bg-theme-bg-surface text-theme-text-primary shadow-sm" : "text-theme-text-secondary hover:text-theme-text-primary")}>
            {t} <span className="ml-1 rounded-full bg-theme-bg-primary px-1.5 text-xs text-theme-text-muted">{t === "pending" ? pending.length : decided.length}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {rows === null && [0, 1].map((i) => <Skeleton key={i} className="h-56 w-full rounded-theme-lg" />)}
        {rows !== null && visible.length === 0 && (
          <div className="rounded-theme-lg border border-dashed border-theme-border-default bg-theme-bg-surface px-6 py-14 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-theme-green" />
            <h3 className="mt-3 font-display text-lg font-semibold text-theme-text-primary">{tab === "pending" ? "Nothing needs you right now" : "No decisions yet"}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-theme-text-secondary">
              {tab === "pending"
                ? `The agent is watching ${chains} supply chain${chains === 1 ? "" : "s"}. ${lastScan ? `Last scan ${new Date(lastScan).toLocaleString()}.` : "No scans recorded yet — run one from the dashboard."}`
                : "Approved, rejected and snoozed decisions will appear here."}
            </p>
          </div>
        )}
        {visible.map((d) => <DecisionCard key={d.id} decision={d} onChange={onChange} />)}
      </div>
    </div>
  )
}
