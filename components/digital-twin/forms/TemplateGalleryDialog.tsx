"use client"

import { useState } from "react"
import { Loader2, LayoutTemplate } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TWIN_TEMPLATES, templateToRf } from "@/lib/twin-templates"
import type { ImportPayload } from "./ImportTwinDialog"

export function TemplateGalleryDialog({ isOpen, onClose, onImport }: { isOpen: boolean; onClose: () => void; onImport: (p: ImportPayload) => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pick = async (key: string) => {
    const t = TWIN_TEMPLATES.find((x) => x.key === key)!
    setBusy(key); setError(null)
    try { const rf = templateToRf(t); await onImport({ name: t.name, nodes: rf.nodes, edges: rf.edges }); onClose() } catch (e) { setError((e as Error).message) } finally { setBusy(null) }
  }
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-theme-blue" /> Start from a template</DialogTitle><DialogDescription>Real places and lanes with planning-grade costs. Create one, then edit anything on the canvas.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {TWIN_TEMPLATES.map((t) => (
            <button key={t.key} type="button" disabled={busy !== null} onClick={() => pick(t.key)} className="rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-theme-blue disabled:opacity-60">
              <div className="text-[10px] font-bold uppercase tracking-wide text-theme-blue">{t.industry}</div>
              <div className="mt-1 flex items-center gap-2 font-display text-lg font-semibold text-theme-text-primary">{t.name}{busy === t.key && <Loader2 className="h-4 w-4 animate-spin" />}</div>
              <p className="mt-1 text-xs text-theme-text-secondary">{t.blurb}</p>
              <div className="mt-2 text-[11px] text-theme-text-muted">{t.nodes.length} sites · {t.edges.length} lanes</div>
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-theme-red">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
