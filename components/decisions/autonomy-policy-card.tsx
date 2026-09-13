"use client"

import { useEffect, useState } from "react"
import { Bot, Loader2, Save, ShieldCheck, Webhook } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Policy { supply_chain_id: string; auto_approve: boolean; max_added_cost: number; max_added_days: number; min_confidence: number; expire_hours: number; webhook_url: string | null; carbon_weight?: number; carbon_price?: number }
interface TwinPolicy { id: string; name: string; policy: Policy }

/** Per-twin autonomy guardrails: when the agent may approve a reroute on its own, decision expiry, and where to notify. */
export function AutonomyPolicyCard({ userId }: { userId: string }) {
  const [twins, setTwins] = useState<TwinPolicy[] | null>(null)
  const [sel, setSel] = useState<string>("")
  const [form, setForm] = useState<Policy | null>(null)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/policies?userId=${userId}`).then((r) => r.json()).then((j) => { setTwins(j.twins ?? []); if (j.twins?.[0]) { setSel(j.twins[0].id); setForm(j.twins[0].policy) } }).catch(() => setTwins([]))
  }, [userId])

  const pick = (id: string) => { setSel(id); setForm(twins?.find((t) => t.id === id)?.policy ?? null) }
  const save = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch("/api/policies", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, supplyChainId: sel, ...form }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error)
      setTwins((t) => (t ?? []).map((x) => (x.id === sel ? { ...x, policy: j.policy } : x)))
      toast.success(form.auto_approve ? "Policy saved — the agent will act inside these limits" : "Policy saved — every decision will wait for you")
    } catch (e) { toast.error((e as Error).message) } finally { setSaving(false) }
  }
  if (!twins || twins.length === 0) return null
  const f = form!
  return (
    <div data-tour="policy" className="mt-6 rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", f.auto_approve ? "bg-theme-green-soft text-theme-green" : "bg-theme-bg-secondary text-theme-text-secondary")}><ShieldCheck className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-theme-text-primary">Autonomy policy</span>
          <span className="block truncate text-xs text-theme-text-secondary">{f.auto_approve ? `Auto-approves reroutes ≤ $${Number(f.max_added_cost).toLocaleString()} and ≤ ${f.max_added_days}d at ≥ ${Math.round(Number(f.min_confidence) * 100)}% confidence` : "Every decision waits for a human"} · expires after {f.expire_hours}h</span>
        </span>
        <span className="text-xs text-theme-blue">{open ? "Hide" : "Configure"}</span>
      </button>
      {open && (
        <div className="grid gap-3 border-t border-theme-border-subtle p-4 sm:grid-cols-2">
          <label className="text-xs text-theme-text-secondary sm:col-span-2">Supply chain
            <select value={sel} onChange={(e) => pick(e.target.value)} className="mt-1 w-full rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text-primary">{twins.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          </label>
          <label className="flex items-center gap-3 rounded-theme-md border border-theme-border-subtle p-3 text-sm text-theme-text-primary sm:col-span-2">
            <input type="checkbox" checked={f.auto_approve} onChange={(e) => setForm({ ...f, auto_approve: e.target.checked })} className="h-4 w-4 accent-[#2748E8]" />
            <span><span className="font-semibold">Let the agent approve reroutes on its own</span><span className="block text-xs text-theme-text-secondary">Only the recommended reroute, only inside every limit below, never when the Analyst flags "needs review" or a lane has no bypass. You get a notification, not a question.</span></span>
          </label>
          {[["max_added_cost", "Max added cost (USD)", 100], ["max_added_days", "Max added days", 0.5], ["expire_hours", "Pending decisions expire after (hours)", 1]].map(([k, l, step]) => (
            <label key={k as string} className="text-xs text-theme-text-secondary">{l}
              <input type="number" step={step as number} value={(f as any)[k as string]} onChange={(e) => setForm({ ...f, [k as string]: Number(e.target.value) })} className="mt-1 w-full rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text-primary" />
            </label>
          ))}
          <label className="text-xs text-theme-text-secondary">Min confidence ({Math.round(Number(f.min_confidence) * 100)}%)
            <input type="range" min={0.5} max={1} step={0.05} value={f.min_confidence} onChange={(e) => setForm({ ...f, min_confidence: Number(e.target.value) })} className="mt-2 w-full accent-[#2748E8]" />
          </label>
          <label className="text-xs text-theme-text-secondary">Carbon weight ({Math.round(Number(f.carbon_weight ?? 0) * 100)}%)<span className="block text-[10px] text-theme-text-muted">0 = rank on cost only · 100 = every tonne CO₂e priced at the carbon price</span>
            <input type="range" min={0} max={1} step={0.05} value={f.carbon_weight ?? 0} onChange={(e) => setForm({ ...f, carbon_weight: Number(e.target.value) })} className="mt-2 w-full accent-[#2748E8]" />
          </label>
          <label className="text-xs text-theme-text-secondary">Carbon price (USD / tCO₂e)
            <input type="number" step={5} value={f.carbon_price ?? 100} onChange={(e) => setForm({ ...f, carbon_price: Number(e.target.value) })} className="mt-1 w-full rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text-primary" />
          </label>
          <label className="text-xs text-theme-text-secondary sm:col-span-2"><span className="inline-flex items-center gap-1"><Webhook className="h-3 w-3" /> Slack / Teams / webhook URL (optional)</span>
            <input type="url" placeholder="https://hooks.slack.com/services/…" value={f.webhook_url ?? ""} onChange={(e) => setForm({ ...f, webhook_url: e.target.value || null })} className="mt-1 w-full rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text-primary" />
          </label>
          <div className="flex items-center justify-between sm:col-span-2">
            <span className="flex items-center gap-1.5 text-[11px] text-theme-text-muted"><Bot className="h-3 w-3" /> Evaluated by the incident graph's policy step; every auto-approval is audited and remembered.</span>
            <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save policy</Button>
          </div>
        </div>
      )}
    </div>
  )
}
