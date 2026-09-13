"use client"

import { useState } from "react"
import { AlertTriangle, Bot, Check, HelpCircle, Loader2, Sparkles, Wand2 } from "lucide-react"
import type { Edge, Node } from "reactflow"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ImportPayload } from "./ImportTwinDialog"

const EXAMPLES = [
  "We make consumer electronics in Shenzhen and ship by sea via Singapore and Suez to Rotterdam, then by road to our Berlin DC which serves retailers in Germany and Poland. A backup PCB supplier sits in Penang.",
  "Automotive tier-2: castings from Pune and Coimbatore go by road to Chennai port, sea to Hamburg, rail to our Wolfsburg plant. Finished parts truck to a Lyon warehouse.",
  "Pharma cold chain: API from Hyderabad, fill-finish in Basel, air freight to Chicago and Singapore hubs, road to hospital distributors in the US Midwest and SE Asia.",
]

interface Draft { name: string; summary: string; assumptions: string[]; questions: string[]; nodes: Node[]; edges: Edge[]; notes: string[]; geocoded: number; estimatedLanes: number }

/** "Describe in words" → Strands twin_builder drafts the network → preview → create. */
export function DescribeTwinDialog({ isOpen, onClose, onImport }: { isOpen: boolean; onClose: () => void; onImport: (p: ImportPayload) => Promise<void> }) {
  const [text, setText] = useState("")
  const [busy, setBusy] = useState<"draft" | "create" | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setBusy("draft"); setError(null); setDraft(null)
    try {
      const res = await fetch("/api/twin/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ description: text }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.detail ?? j.error ?? `Draft failed (${res.status})`)
      setDraft(j)
    } catch (e) { setError((e as Error).message) } finally { setBusy(null) }
  }
  const create = async () => {
    if (!draft) return
    setBusy("create"); setError(null)
    try { await onImport({ name: draft.name, nodes: draft.nodes, edges: draft.edges }); setDraft(null); setText(""); onClose() } catch (e) { setError((e as Error).message) } finally { setBusy(null) }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-theme-blue" /> Describe your supply chain</DialogTitle>
          <DialogDescription>Write it the way you'd explain it to a new hire. The Twin Builder agent drafts the sites and lanes, geocodes them and estimates lane costs from distance — you confirm and edit on the canvas.</DialogDescription>
        </DialogHeader>
        {!draft ? (
          <div className="space-y-3">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="e.g. We source PCBs from Penang and assemble in Shenzhen, ship by sea to Rotterdam…"
              className="w-full rounded-theme-md border border-theme-border-default bg-theme-bg-secondary p-3 text-sm text-theme-text-primary outline-none focus:ring-2 focus:ring-theme-blue" />
            <div className="flex flex-wrap gap-1.5">{EXAMPLES.map((ex, i) => <button key={i} type="button" onClick={() => setText(ex)} className="rounded-full border border-theme-border-subtle px-2.5 py-1 text-[11px] text-theme-text-secondary hover:border-theme-blue hover:text-theme-blue">Example {i + 1}: {ex.split(":")[0].split(" ").slice(0, 3).join(" ")}…</button>)}</div>
            {error && <p className="text-sm text-theme-red">{error}</p>}
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={run} disabled={busy !== null || text.trim().length < 20} className="gap-1.5">{busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Draft the twin</Button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-3">
              <div className="font-display text-lg font-semibold text-theme-text-primary">{draft.name}</div>
              <p className="mt-1 text-sm text-theme-text-secondary">{draft.summary}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-theme-text-muted"><span className="rounded-full border border-theme-border-subtle px-2 py-0.5">{draft.nodes.length} sites</span><span className="rounded-full border border-theme-border-subtle px-2 py-0.5">{draft.edges.length} lanes</span><span className="rounded-full border border-theme-border-subtle px-2 py-0.5">{draft.geocoded} geocoded</span><span className="rounded-full border border-theme-border-subtle px-2 py-0.5">{draft.estimatedLanes} lanes estimated</span></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-theme-md border border-theme-border-subtle p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Sites</div>
                <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto text-sm">{draft.nodes.map((n) => <li key={n.id} className="flex items-center justify-between gap-2"><span className="truncate text-theme-text-primary">{n.data.label}</span><span className="shrink-0 text-[11px] text-theme-text-muted">{n.data.type} · {n.data.country ?? "?"}{n.data.lat != null ? "" : " · no coords"}</span></li>)}</ul>
              </div>
              <div className="rounded-theme-md border border-theme-border-subtle p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Lanes</div>
                <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto text-sm">{draft.edges.map((e) => { const s = draft.nodes.find((n) => n.id === e.source)?.data.label, t = draft.nodes.find((n) => n.id === e.target)?.data.label; return <li key={e.id} className="flex items-center justify-between gap-2"><span className="truncate text-theme-text-primary">{s} → {t}</span><span className="shrink-0 text-[11px] text-theme-text-muted">{e.data.mode} · ${Math.round(e.data.cost)} · {e.data.transitTime}d{e.data.estimated ? " (est.)" : ""}</span></li> })}</ul>
              </div>
            </div>
            {draft.assumptions.length > 0 && <div className="rounded-theme-md border border-theme-amber/30 bg-theme-amber-soft p-3 text-sm"><div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-theme-amber"><AlertTriangle className="h-3.5 w-3.5" /> Assumptions to confirm</div><ul className="mt-1 list-disc pl-5 text-theme-text-secondary">{draft.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
            {draft.questions.length > 0 && <div className="rounded-theme-md border border-theme-blue/20 bg-theme-blue-soft/40 p-3 text-sm"><div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-theme-blue"><HelpCircle className="h-3.5 w-3.5" /> The agent would like to know</div><ul className="mt-1 list-disc pl-5 text-theme-text-secondary">{draft.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></div>}
            {draft.notes.length > 0 && <details className="text-xs text-theme-text-muted"><summary className="cursor-pointer">{draft.notes.length} enrichment notes</summary><ul className="mt-1 list-disc pl-5">{draft.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></details>}
            {error && <p className="text-sm text-theme-red">{error}</p>}
            <div className="flex justify-between gap-2"><Button variant="ghost" onClick={() => setDraft(null)}>Edit description</Button><Button onClick={create} disabled={busy !== null} className="gap-1.5">{busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Create twin</Button></div>
            <p className="flex items-center gap-1.5 text-[11px] text-theme-text-muted"><Bot className="h-3 w-3" /> Drafted by the Strands twin_builder agent · edit anything on the canvas afterwards.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
