"use client"

import { useEffect, useState } from "react"
import { BookOpen, Check, Download, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { cn } from "@/lib/utils"

type Step = { title: string; owner: string; due_in_days: number; detail: string }
type Playbook = { id: string; key: string; name: string; category: string; triggers: string[]; steps: Step[]; guidance: string | null; source: "builtin" | "custom"; enabled: boolean }
const CATS = ["LOGISTICS", "SUPPLIER", "WEATHER", "GEOPOLITICAL", "MARKET", "OTHER"]
const BLANK: Omit<Playbook, "id" | "source" | "enabled"> = { key: "", name: "", category: "LOGISTICS", triggers: [], steps: [{ title: "", owner: "", due_in_days: 0, detail: "" }], guidance: "" }

/** Response playbooks: installed built-ins + the org's own. The Strategist follows a matching playbook and its steps seed the checklist. */
export function PlaybooksPage() {
  const [org, setOrg] = useState<{ id: string; role: string } | null>(null), [rows, setRows] = useState<Playbook[]>([]), [catalog, setCatalog] = useState<any[]>([]), [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState<Playbook | null>(null), [draft, setDraft] = useState<any>(null)
  const canEdit = org && ["owner", "approver", "planner"].includes(org.role)
  const load = (o = org) => o && fetch(`/api/playbooks?orgId=${o.id}`).then((r) => r.json()).then((j) => { setRows(j.playbooks ?? []); setCatalog(j.catalog ?? []) })
  useEffect(() => { fetch("/api/me").then((r) => r.json()).then((j) => { if (j.orgs?.[0]) { setOrg(j.orgs[0]); load(j.orgs[0]) } }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const install = async (key: string) => { setBusy(key); try { const r = await fetch("/api/playbooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orgId: org!.id, install: key }) }); if (!r.ok) throw new Error((await r.json()).error); toast.success("Playbook installed"); load() } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) } }
  const toggle = async (p: Playbook) => { await fetch("/api/playbooks", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p.id, enabled: !p.enabled }) }); load() }
  const remove = async (p: Playbook) => { await fetch(`/api/playbooks?id=${p.id}`, { method: "DELETE" }); if (editing?.id === p.id) setEditing(null); load() }
  const save = async () => {
    setBusy("save")
    try {
      const body = editing ? { id: editing.id, name: draft.name, category: draft.category, triggers: draft.triggers, steps: draft.steps, guidance: draft.guidance } : { orgId: org!.id, playbook: draft }
      const r = await fetch("/api/playbooks", { method: editing ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) throw new Error((await r.json()).error)
      toast.success("Playbook saved"); setEditing(null); setDraft(null); load()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  const installed = new Set(rows.map((r) => r.key))
  const inp = "rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 text-sm text-theme-text-primary"
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Standard responses" title="Playbooks" subtitle="What your organisation does when a port closes, a supplier burns down or a canal blocks. The Strategist follows the matching playbook and its steps become the execution checklist on every decision." icon={<BookOpen className="h-5 w-5" />}
        actions={canEdit ? <Button size="sm" onClick={() => { setEditing(null); setDraft({ ...BLANK, steps: [...BLANK.steps] }) }} className="gap-1.5"><Plus className="h-4 w-4" /> New playbook</Button> : undefined} />
      {!org ? <p className="mt-6 text-sm text-theme-text-muted">Sign in to manage playbooks.</p> : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {rows.map((p) => (
              <div key={p.id} className={cn("rounded-theme-lg border bg-theme-bg-surface p-4", p.enabled ? "border-theme-border-subtle" : "border-dashed border-theme-border-subtle opacity-60")}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-theme-blue-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-theme-blue">{p.category}</span>
                  <h3 className="font-display text-lg text-theme-text-primary">{p.name}</h3>
                  <span className="text-[10px] uppercase text-theme-text-muted">{p.source}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {canEdit && <button type="button" onClick={() => { setEditing(p); setDraft({ name: p.name, category: p.category, triggers: p.triggers, steps: p.steps, guidance: p.guidance ?? "" }) }} className="text-xs text-theme-blue hover:underline">Edit</button>}
                    {canEdit && <button type="button" onClick={() => toggle(p)} className="text-xs text-theme-text-secondary hover:underline">{p.enabled ? "Disable" : "Enable"}</button>}
                    {canEdit && <button type="button" onClick={() => remove(p)} className="text-theme-text-muted hover:text-theme-red"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
                {p.guidance && <p className="mt-2 text-sm italic text-theme-text-secondary">“{p.guidance}”</p>}
                <ol className="mt-2 space-y-1 text-sm">{p.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="w-5 shrink-0 text-right font-mono text-xs text-theme-text-muted">{i + 1}.</span><span className="text-theme-text-primary">{s.title}</span><span className="text-xs text-theme-text-muted">· {s.owner} · day {s.due_in_days}</span></li>)}</ol>
                {p.triggers.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{p.triggers.map((t) => <span key={t} className="rounded-full border border-theme-border-subtle px-2 py-0.5 text-[10px] text-theme-text-muted">{t}</span>)}</div>}
              </div>
            ))}
            {rows.length === 0 && <div className="rounded-theme-lg border border-dashed border-theme-border-subtle p-6 text-center text-sm text-theme-text-muted">No playbooks installed — the agent uses the built-in catalogue until you install and tailor them.</div>}
          </div>
          <aside className="space-y-3">
            <div className="rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Catalogue</div>
              <ul className="mt-2 space-y-2">{catalog.map((c) => <li key={c.key} className="flex items-center gap-2 text-sm"><span className="flex-1 text-theme-text-primary">{c.name}</span>{installed.has(c.key) ? <Check className="h-4 w-4 text-theme-green" /> : canEdit ? <button type="button" onClick={() => install(c.key)} disabled={busy === c.key} className="text-theme-blue hover:text-theme-blue/80">{busy === c.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</button> : null}</li>)}</ul>
            </div>
            {draft && (
              <div className="rounded-theme-lg border border-theme-blue/30 bg-theme-bg-surface p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-theme-blue">{editing ? "Edit playbook" : "New playbook"}</div>
                <div className="mt-2 grid gap-2">
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" className={inp} />
                  <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inp}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
                  <input value={draft.triggers.join(", ")} onChange={(e) => setDraft({ ...draft, triggers: e.target.value.split(",").map((x: string) => x.trim()).filter(Boolean) })} placeholder="Trigger keywords, comma separated" className={inp} />
                  <textarea value={draft.guidance ?? ""} onChange={(e) => setDraft({ ...draft, guidance: e.target.value })} rows={2} placeholder="Guidance the Strategist must honour" className={inp} />
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Steps</div>
                  {draft.steps.map((s: Step, i: number) => <div key={i} className="grid grid-cols-[1fr_80px_48px] gap-1"><input value={s.title} onChange={(e) => { const st = [...draft.steps]; st[i] = { ...s, title: e.target.value }; setDraft({ ...draft, steps: st }) }} placeholder="Step" className={inp} /><input value={s.owner} onChange={(e) => { const st = [...draft.steps]; st[i] = { ...s, owner: e.target.value }; setDraft({ ...draft, steps: st }) }} placeholder="Owner" className={inp} /><input type="number" value={s.due_in_days} onChange={(e) => { const st = [...draft.steps]; st[i] = { ...s, due_in_days: Number(e.target.value) }; setDraft({ ...draft, steps: st }) }} className={inp} /></div>)}
                  <button type="button" onClick={() => setDraft({ ...draft, steps: [...draft.steps, { title: "", owner: "", due_in_days: 0, detail: "" }] })} className="text-left text-xs text-theme-blue hover:underline">+ step</button>
                  <div className="flex gap-2"><Button size="sm" onClick={save} disabled={busy === "save" || !draft.name} className="gap-1.5">{busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button><Button size="sm" variant="ghost" onClick={() => { setDraft(null); setEditing(null) }}>Cancel</Button></div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
