"use client"

import { useEffect, useState } from "react"
import { Building2, Crown, Loader2, Mail, Shield, Trash2, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { cn } from "@/lib/utils"
import { RateCardCard } from "./RateCardCard"

interface Org { id: string; name: string; role: string }
interface Member { user_id: string; role: string; email: string | null; since: string }
const ROLES = [["owner", "Owner", "everything, incl. team & policies"], ["approver", "Approver", "approve / reject decisions"], ["planner", "Planner", "build twins, run what-ifs"], ["viewer", "Viewer", "read-only"]] as const

export function TeamPage() {
  const [me, setMe] = useState<{ user: { id: string; email?: string } | null; orgs: Org[] } | null>(null)
  const [org, setOrg] = useState<Org | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState(""), [role, setRole] = useState<string>("approver"), [busy, setBusy] = useState(false), [name, setName] = useState("")
  const load = async (o: Org) => { const j = await fetch(`/api/orgs/${o.id}/members`).then((r) => r.json()); setMembers(j.members ?? []) }
  useEffect(() => { fetch("/api/me").then((r) => r.json()).then((j) => { setMe(j); if (j.orgs?.[0]) { setOrg(j.orgs[0]); setName(j.orgs[0].name); load(j.orgs[0]) } }) }, [])
  const invite = async () => { if (!org) return; setBusy(true); try { const r = await fetch(`/api/orgs/${org.id}/members`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); toast.success(`Invited ${email} as ${role}`); setEmail(""); load(org) } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) } }
  const setMemberRole = async (m: Member, r: string) => { if (!org) return; await fetch(`/api/orgs/${org.id}/members`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: m.user_id, role: r }) }); load(org) }
  const remove = async (m: Member) => { if (!org) return; await fetch(`/api/orgs/${org.id}/members`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: m.user_id, remove: true }) }); load(org) }
  const rename = async () => { if (!org) return; const r = await fetch("/api/orgs", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ orgId: org.id, name }) }); if (r.ok) toast.success("Organisation renamed") }
  const isOwner = org?.role === "owner"
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Organisation" title="Team & roles" subtitle="Everyone in the organisation sees its twins and decisions. Only owners and approvers can approve; planners build and simulate; viewers read." icon={<Users className="h-5 w-5" />} />
      {!me ? <div className="mt-6 text-sm text-theme-text-muted">Loading…</div> : !org ? <div className="mt-6 text-sm text-theme-text-muted">No organisation yet — sign in to create one.</div> : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4">
            <Building2 className="h-5 w-5 text-theme-blue" />
            <input value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwner} className="min-w-0 flex-1 rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-3 py-2 font-display text-lg font-semibold text-theme-text-primary disabled:opacity-70" />
            {isOwner && <Button size="sm" variant="outline" onClick={rename}>Rename</Button>}
            <span className="rounded-full border border-theme-border-subtle px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-theme-text-secondary">you: {org.role}</span>
          </div>
          <div className="mt-4 rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface">
            <ul>{members.map((m) => (
              <li key={m.user_id} className="flex flex-wrap items-center gap-3 border-b border-theme-border-subtle px-4 py-3 last:border-b-0">
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold", m.role === "owner" ? "bg-theme-amber-soft text-theme-amber" : "bg-theme-bg-secondary text-theme-text-secondary")}>{m.role === "owner" ? <Crown className="h-4 w-4" /> : (m.email ?? "?").slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-theme-text-primary">{m.email ?? m.user_id}{m.user_id === me.user?.id && <span className="ml-1 text-xs text-theme-text-muted">(you)</span>}</span>
                {isOwner && m.user_id !== me.user?.id ? <select value={m.role} onChange={(e) => setMemberRole(m, e.target.value)} className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-2 py-1 text-xs">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> : <span className="text-xs capitalize text-theme-text-secondary">{m.role}</span>}
                {isOwner && m.user_id !== me.user?.id && <button type="button" onClick={() => remove(m)} className="text-theme-text-muted hover:text-theme-red" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>}
              </li>))}</ul>
          </div>
          <RateCardCard orgId={org.id} canEdit={org.role === "owner" || org.role === "approver"} />
          {isOwner && (
            <div className="mt-4 rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-theme-text-primary"><UserPlus className="h-4 w-4 text-theme-blue" /> Invite a teammate</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-3"><Mail className="h-4 w-4 text-theme-text-muted" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-transparent py-2 text-sm outline-none" /></div>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-3 py-2 text-sm">{ROLES.filter(([v]) => v !== "owner").map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                <Button onClick={invite} disabled={busy || !email.includes("@")} className="gap-1.5">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Invite</Button>
              </div>
              <ul className="mt-3 grid gap-1 text-xs text-theme-text-secondary sm:grid-cols-2">{ROLES.map(([v, l, d]) => <li key={v} className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-theme-text-muted" /><strong className="text-theme-text-primary">{l}</strong> — {d}</li>)}</ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
