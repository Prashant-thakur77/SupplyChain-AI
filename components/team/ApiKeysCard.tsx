"use client"

import { useEffect, useState } from "react"
import { Copy, KeyRound, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

/** Org API keys for the A2A endpoint and programmatic access. The key is shown once. */
export function ApiKeysCard({ orgId, canEdit }: { orgId: string; canEdit: boolean }) {
  const [keys, setKeys] = useState<any[]>([]), [name, setName] = useState(""), [busy, setBusy] = useState(false), [fresh, setFresh] = useState<string | null>(null)
  const load = () => fetch(`/api/api-keys?orgId=${orgId}`).then((r) => r.json()).then((j) => setKeys(j.keys ?? []))
  useEffect(() => { load() }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps
  const create = async () => { setBusy(true); try { const r = await fetch("/api/api-keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orgId, name: name || "default" }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setFresh(j.key); setName(""); load() } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) } }
  const [a2a, setA2a] = useState<string>("…")
  useEffect(() => { fetch("/api/agent/status").then((r) => r.json()).then((j) => setA2a(j.a2a_url ?? "")).catch(() => setA2a("")) }, [])
  return (
    <section className="rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-5">
      <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-theme-blue" /><h2 className="font-display text-lg text-theme-text-primary">API keys · A2A</h2></div>
      <p className="mt-1 text-sm text-theme-text-secondary">Other agents (procurement bots, your TMS, a customer's own agent) can ask <em>"is this lane safe?"</em> over the Agent-to-Agent protocol. Agent card: <code className="break-all font-mono text-[11px]">{a2a}</code>. Send the key as <code className="font-mono text-[11px]">x-api-key</code>.</p>
      {fresh && <div className="mt-3 rounded-theme-md border border-theme-green/30 bg-theme-green-soft p-3 text-sm"><div className="font-medium text-theme-green">Copy this key now — it will not be shown again.</div><div className="mt-1 flex items-center gap-2"><code className="flex-1 break-all font-mono text-xs text-theme-text-primary">{fresh}</code><button type="button" onClick={() => { navigator.clipboard?.writeText(fresh); toast.success("Copied") }} className="text-theme-text-muted hover:text-theme-text-primary"><Copy className="h-4 w-4" /></button></div></div>}
      {canEdit && <div className="mt-3 flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name (e.g. procurement-bot)" className="flex-1 rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 text-sm" /><Button size="sm" onClick={create} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create key"}</Button></div>}
      <ul className="mt-3 divide-y divide-theme-border-subtle text-sm">
        {keys.map((k) => <li key={k.id} className="flex items-center gap-3 py-2"><code className="font-mono text-xs text-theme-text-muted">{k.prefix}…</code><span className={`flex-1 ${k.revoked ? "line-through text-theme-text-muted" : "text-theme-text-primary"}`}>{k.name}</span><span className="text-xs text-theme-text-muted">{k.last_used_at ? `used ${new Date(k.last_used_at).toLocaleDateString()}` : "never used"}</span>{canEdit && !k.revoked && <button type="button" onClick={async () => { await fetch(`/api/api-keys?id=${k.id}`, { method: "DELETE" }); load() }} className="text-theme-text-muted hover:text-theme-red"><Trash2 className="h-4 w-4" /></button>}</li>)}
        {keys.length === 0 && <li className="py-3 text-theme-text-muted">No keys yet.</li>}
      </ul>
    </section>
  )
}
