"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, FileSpreadsheet, ShieldCheck, Sparkles, Users, Wand2 } from "lucide-react"

/** Shown on the dashboard until the account has its first twin: the four things that turn an empty account into a watched network. */
export function GettingStarted() {
  const steps = [
    { icon: Wand2, title: "Build your digital twin", body: "Describe your network in words, import a CSV/Excel, or start from an industry template. Coordinates and lane costs are filled in for you.", href: "/digital-twin", cta: "Open Digital Twin" },
    { icon: FileSpreadsheet, title: "Add what moves", body: "Flows (units, value, days of cover) make impact and reroute costs real. Rate cards and carrier quotes replace estimates with your prices.", href: "/digital-twin", cta: "Control Tower → Flows" },
    { icon: ShieldCheck, title: "Set the guardrails", body: "Decide what the agent may approve alone — max added cost, max added days, minimum confidence — and where to be notified.", href: "/decisions", cta: "Autonomy policy" },
    { icon: Users, title: "Bring the team", body: "Owners approve, planners simulate, viewers read. Install the playbooks your organisation already follows.", href: "/team", cta: "Team & playbooks" },
  ]
  return (
    <section className="rounded-theme-lg border border-theme-blue/25 bg-gradient-to-br from-theme-blue-soft/60 to-theme-bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-theme-blue text-white"><Sparkles className="h-4 w-4" /></span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-theme-text-primary">Four steps to a watched supply chain</h2>
          <p className="text-sm text-theme-text-secondary">Nothing here yet — the agent needs a twin to watch. Most teams are live in under 15 minutes. Or <Link href="/demo" className="font-medium text-theme-blue hover:underline">break a port in the live demo</Link> first.</p>
        </div>
        <Link href="/playbooks" className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-theme-border-subtle bg-theme-bg-surface px-3 py-1.5 text-xs font-semibold text-theme-text-secondary hover:border-theme-blue hover:text-theme-blue"><BookOpen className="h-3.5 w-3.5" /> See the playbooks</Link>
      </div>
      <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface p-4">
            <div className="flex items-center gap-2"><span className="font-mono text-xs text-theme-text-muted">0{i + 1}</span><s.icon className="h-4 w-4 text-theme-blue" /><span className="font-semibold text-theme-text-primary">{s.title}</span></div>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-theme-text-secondary">{s.body}</p>
            <Link href={s.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-theme-blue hover:underline">{s.cta} <ArrowRight className="h-3 w-3" /></Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
