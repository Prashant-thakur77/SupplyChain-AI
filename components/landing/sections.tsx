"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Bot, Check, Cpu, GitBranch, Inbox, Radar, ShieldAlert, Sparkles, Waypoints, X } from "lucide-react"
import { Reveal, RevealGroup, RevealItem, Marquee } from "@/components/motion"
import { HeroTwin } from "./HeroTwin"

const ease = [0.16, 1, 0.3, 1] as const

/* ────────────────────────────── Hero ────────────────────────────── */
export function Hero() {
  const reduce = useReducedMotion()
  const words = ["Your supply chain,", "watched 24/7.", "You only get", "the decision."]
  return (
    <section className="relative overflow-hidden bg-[#F7F7F8]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(ellipse_70%_55%_at_50%_-8%,rgba(39,72,232,0.10),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(11,11,15,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,11,15,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,#000_30%,transparent_75%)]" />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-28 lg:pt-24">
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-[#2748E8]/25 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2748E8] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2748E8]" /> Built with Strands Agents · runs in the background
          </motion.div>
          <h1 className="mt-6 font-display text-[clamp(2.3rem,4.6vw,3.9rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-[#0B0B0F]">
            {words.map((w, i) => (
              <span key={i} className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                <motion.span className={`block ${i === 1 ? "text-[#2748E8]" : ""}`} initial={reduce ? false : { y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: 0.1 + i * 0.09, ease }}>{w}</motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.55, ease }} className="mt-6 max-w-[52ch] text-[1.08rem] leading-relaxed text-[#52525B]">
            An autonomous agent watches your ports, suppliers and lanes. When something breaks it computes the blast radius, finds the cheapest viable reroute, drafts the mitigation — and pings you with <strong className="font-semibold text-[#0B0B0F]">one ranked decision</strong> to approve.
          </motion.p>
          <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7, ease }} className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/demo" className="group inline-flex items-center gap-2 rounded-full bg-[#2748E8] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(39,72,232,0.6)] transition-transform hover:-translate-y-0.5">
              Break a port in the live demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/signin" className="inline-flex items-center gap-2 rounded-full border border-[#0B0B0F]/15 bg-white/60 px-6 py-3 text-[15px] font-semibold text-[#0B0B0F] backdrop-blur transition-colors hover:border-[#0B0B0F]/40">Sign in</Link>
          </motion.div>
          <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.9 }} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#52525B]">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#15803D]" /> No login for the demo</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#15803D]" /> Open source · MIT</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#15803D]" /> Gemini · Bedrock · Groq · local Ollama</span>
          </motion.div>
        </div>
        <motion.div initial={reduce ? false : { opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35, ease }}
          className="rounded-[28px] border border-[#E8E8EC] bg-white/70 p-4 shadow-[0_30px_80px_-30px_rgba(11,11,15,0.35)] backdrop-blur sm:p-6">
          <HeroTwin className="pb-2" />
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────────────── Ticker ────────────────────────────── */
const TICKER = [
  ["news", "Port of Singapore: terminal fire halts PSA operations"], ["weather", "Typhoon warning · Shenzhen · 48h"], ["news", "Suez Canal: grounded vessel, 10–14 days"],
  ["news", "Rotterdam pilots strike ballot · 20 Sept"], ["weather", "Storm surge · Hamburg · gusts 22 m/s"], ["news", "Colombo port congestion easing"], ["news", "Sanctions update affects Red Sea transits"],
]
export function Ticker() {
  return (
    <section className="border-y border-[#E8E8EC] bg-[#EFEFF2]">
      <div className="mx-auto max-w-[1200px] px-6 py-3">
        <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#52525B]">What Sentinel reads so you don't have to · every 15 minutes</div>
        <Marquee speed={40} className="text-[13px] text-[#0B0B0F]">
          {TICKER.map(([k, t], i) => (
            <span key={i} className="mx-5 inline-flex items-center gap-2 whitespace-nowrap"><span className={`h-1.5 w-1.5 rounded-full ${k === "weather" ? "bg-[#B45309]" : "bg-[#2748E8]"}`} />{t}</span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

/* ────────────────────────────── Problem / Solution ────────────────────────────── */
export function Problem() {
  return (
    <section className="bg-[#F7F7F8]" id="problem">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <Reveal>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B91C1C]">The chore</div>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#0B0B0F]">You find out from the news. Then you lose a day.</h2>
          <p className="mt-4 max-w-[48ch] text-[1.02rem] leading-relaxed text-[#52525B]">Port closures, strikes and typhoons don't wait for office hours. Working out what they hit, what the alternatives cost and who to call is repetitive <em>and</em> judgement-heavy — the worst kind of work to start from zero at 2 a.m.</p>
          <ul className="mt-6 space-y-3">
            {["No real-time view of which lanes are actually exposed", "Reroute costs guessed in spreadsheets, never audited", "Every incident handled from scratch — nothing learned"].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-[#0B0B0F]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[#B91C1C]"><X className="h-3 w-3" /></span>{t}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2748E8]">What the agent does instead</div>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#0B0B0F]">Background by default. One card when it matters.</h2>
          <ul className="mt-6 space-y-3">
            {["Sentinel scans news and weather for every node and lane, on a schedule", "Analyst grades severity and blast radius — below HIGH, nobody is interrupted", "A deterministic routing engine computes the real alternatives; the model only ranks and explains", "Approve, reject or snooze in the Decision Inbox — it records, notifies and remembers"].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-[#0B0B0F]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ECFDF3] text-[#15803D]"><Check className="h-3 w-3" /></span>{t}</li>
            ))}
          </ul>
          <Link href="/demo" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0B0B0F] px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5">See it break a port <ArrowRight className="h-4 w-4" /></Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ────────────────────────────── Stats ────────────────────────────── */
const STATS = [["~30 s", "from event to a ranked, sourced decision"], ["0", "routes or costs invented by the model"], ["10", "Strands agents · 2 graphs · typed outputs"], ["100%", "of agent runs traced and auditable"]]
export function Stats() {
  return (
    <section className="bg-[#0F1420] text-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-px px-6 py-14 md:grid-cols-4">
        {STATS.map(([v, l], i) => (
          <Reveal key={l} delay={i * 0.07} className="px-4 py-6 text-center md:border-l md:border-white/10 md:first:border-l-0">
            <div className="font-display text-[clamp(2.2rem,4vw,3.4rem)] font-semibold tracking-[-0.02em] text-white">{v}</div>
            <div className="mt-2 text-[12px] font-medium uppercase tracking-[0.12em] text-white/60">{l}</div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ────────────────────────────── How it works ────────────────────────────── */
const STEPS = [
  { icon: Radar, t: "Watch", d: "Sentinel reads news and weather for every node and lane of every twin, every 15 minutes, server-side." },
  { icon: ShieldAlert, t: "Grade", d: "Analyst separates what failed from what's downstream and scores severity and confidence with sources." },
  { icon: Waypoints, t: "Compute", d: "Dijkstra and Yen's k-shortest paths produce the real alternate lanes with exact added cost and days." },
  { icon: Inbox, t: "Decide", d: "Router ∥ Impact → Strategist run as a Strands Graph. You get one card: approve, reject or snooze." },
]
export function HowItWorks() {
  return (
    <section className="bg-[#F7F7F8]" id="how-it-works">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
        <Reveal className="max-w-[60ch]">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2748E8]">How it works</div>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#0B0B0F]">Four steps. Three of them happen while you sleep.</h2>
        </Reveal>
        <RevealGroup className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, t, d }, i) => (
            <RevealItem key={t} className="group relative rounded-2xl border border-[#E8E8EC] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-24px_rgba(11,11,15,0.35)]">
              <div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#2748E8]"><Icon className="h-5 w-5" /></span><span className="font-display text-2xl text-[#E8E8EC] transition-colors group-hover:text-[#2748E8]/30">0{i + 1}</span></div>
              <h3 className="mt-5 font-display text-xl font-semibold text-[#0B0B0F]">{t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#52525B]">{d}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ────────────────────────────── Agents ────────────────────────────── */
const AGENTS = [
  ["Sentinel", "watches news & weather", "#2748E8"], ["Analyst", "severity · confidence · blast radius", "#7C3AED"], ["Router", "ranks exact reroutes", "#15803D"],
  ["Impact", "revenue at risk · delay", "#B91C1C"], ["Strategist", "executable mitigation", "#B45309"], ["Forecaster", "30-day risk drivers", "#0E7490"], ["Scenario", "what-ifs on your twin", "#52525B"], ["Copilot", "asks the routing engine", "#0B0B0F"],
  ["Contracts", "SLA clauses → penalties", "#9333EA"], ["Lane Assessor", "answers other agents (A2A)", "#0F766E"],
]
export function Agents() {
  return (
    <section className="border-y border-[#E8E8EC] bg-[#EFEFF2]">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:py-28">
        <Reveal>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2748E8]">Strands Agents SDK</div>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#0B0B0F]">Ten specialised agents. One incident graph.</h2>
          <p className="mt-4 max-w-[50ch] text-[1.02rem] leading-relaxed text-[#52525B]">Every agent is a Strands <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px]">Agent</code> with tools and a typed Pydantic output. The incident pipeline is a <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px]">GraphBuilder</code> graph — Router and Impact in parallel, feeding the Strategist — with hooks tracing every run. Model-agnostic: Gemini, Amazon Bedrock, Groq or a local Ollama model with one environment variable.</p>
          <div className="mt-6 flex flex-wrap gap-2">{["GraphBuilder", "structured_output_model", "@tool", "HookProvider", "stream_async", "AgentCore /invocations"].map((t) => <span key={t} className="rounded-full border border-[#E8E8EC] bg-white px-2.5 py-1 font-mono text-[11px] text-[#52525B]">{t}</span>)}</div>
          <a href="https://github.com/Prashant-thakur77/SupplyChain-AI#how-strands-is-used" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-[#2748E8] hover:underline">Read the architecture <ArrowRight className="h-4 w-4" /></a>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {AGENTS.map(([n, r, c]) => (
            <RevealItem key={n} className="rounded-2xl border border-[#E8E8EC] bg-white p-4 transition-transform hover:-translate-y-1">
              <span className="block h-2 w-2 rounded-full" style={{ background: c }} />
              <div className="mt-3 font-display text-[17px] font-semibold text-[#0B0B0F]">{n}</div>
              <div className="mt-1 text-[12px] leading-snug text-[#52525B]">{r}</div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ────────────────────────────── Inbox preview ────────────────────────────── */
export function InboxPreview() {
  return (
    <section className="bg-[#F7F7F8]" id="inbox">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
        <Reveal className="order-2 lg:order-1">
          <div className="rounded-[24px] border border-[#E8E8EC] bg-white p-5 shadow-[0_30px_80px_-40px_rgba(11,11,15,0.4)]">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52525B]"><Inbox className="h-3.5 w-3.5" /> Decision Inbox · 1 pending</div>
            <div className="mt-4 rounded-2xl border-l-4 border-[#B45309] bg-[#F7F7F8] p-4">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide"><span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[#B45309]">High</span><span className="text-[#52525B]">2 minutes ago</span><span className="ml-auto rounded-full border border-[#15803D]/30 bg-[#ECFDF3] px-2 py-0.5 text-[#15803D]">95% · 2 sources</span></div>
              <div className="mt-2 font-display text-[19px] font-semibold leading-tight text-[#0B0B0F]">Port of Singapore closed for 3 weeks: choose a route</div>
              {[["Shenzhen → Colombo → Suez → Rotterdam → Berlin", "+$1,000 · +5d · low risk", true], ["Shenzhen → Colombo → Suez → Hamburg → Berlin", "+$1,000 · +6d · low risk", false], ["Wait and monitor", "+21d · high risk", false]].map(([l, s, rec]) => (
                <div key={l as string} className={`mt-2 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${rec ? "border-[#2748E8] bg-[#EEF1FF]" : "border-[#E8E8EC] bg-white"}`}>
                  <span className="truncate text-[13px] font-medium text-[#0B0B0F]">{l}</span><span className="shrink-0 text-[11px] text-[#52525B]">{s}</span>
                </div>
              ))}
              <div className="mt-3 flex gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#2748E8] px-4 py-1.5 text-[12px] font-semibold text-white"><Check className="h-3.5 w-3.5" /> Approve</span><span className="rounded-full border border-[#E8E8EC] px-4 py-1.5 text-[12px] font-semibold text-[#52525B]">Reject</span><span className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#52525B]">Snooze 24h</span></div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#2748E8]/20 bg-[#EEF1FF]/60 px-3 py-2 text-[12px] text-[#52525B]"><Sparkles className="h-3.5 w-3.5 text-[#2748E8]" /> Last time this happened: rerouted via Colombo, +$1,000, delivered 4 days early.</div>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="order-1 lg:order-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2748E8]">Human in the loop</div>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#0B0B0F]">Not another dashboard to babysit. An inbox that's usually empty.</h2>
          <p className="mt-4 max-w-[48ch] text-[1.02rem] leading-relaxed text-[#52525B]">Every card carries exact cost, time and risk deltas, the agent's rationale, its sources and a confidence badge. Approve it and the reroute is drawn on your twin, the team is notified, the audit trail is written — and the agent remembers what you chose.</p>
          <ul className="mt-6 grid gap-2 text-[14px] text-[#0B0B0F] sm:grid-cols-2">{[["Bot", "Typed outputs, traced runs"], ["GitBranch", "Routes drawn on the twin"], ["Cpu", "Deterministic numbers"], ["Inbox", "Approve · reject · snooze"]].map(([i, t]) => { const I = { Bot, GitBranch, Cpu, Inbox }[i as string]!; return <li key={t} className="flex items-center gap-2"><I className="h-4 w-4 text-[#2748E8]" />{t}</li> })}</ul>
        </Reveal>
      </div>
    </section>
  )
}

/* ────────────────────────────── Real network ────────────────────────────── */
const REAL = [
  ["Flows, rate cards, quotes", "Impact and reroute cost are weighted by what actually moves; real carrier prices override estimates."],
  ["ERP / TMS connectors", "SAP OData, NetSuite SuiteQL, Odoo, CSV or any REST feed — flows and shipments sync on a schedule."],
  ["Contracts & SLAs", "Paste a penalty clause; every impact estimate adds the exact liquidated damages."],
  ["Inventory-aware waiting", "\"Wait and monitor\" is only offered when days of cover outlast the outage."],
  ["Playbooks", "Your standard responses per disruption type — the Strategist follows them, the checklist inherits their steps."],
  ["Carbon co-optimisation", "CO₂e per lane; a policy slider decides how much a tonne weighs against a dollar in the ranking."],
  ["Orgs, roles, Slack, push", "Owners approve, planners simulate, viewers read; approve from Slack or a phone at 2 a.m."],
  ["A2A + public feeds", "Other agents ask \"is this lane safe?\"; Sentinel reads GDACS, USGS and NWS alongside the news."],
]
export function RealNetwork() {
  return (
    <section className="bg-[#F7F7F8]">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
        <Reveal className="max-w-[60ch]">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2748E8]">Built for a real network</div>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#0B0B0F]">The demo is a toy twin. The product is not.</h2>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-[#52525B]">Everything a supply-chain team needs to trust an agent with real money: the data it decides on, the limits it acts within, and the paper trail it leaves.</p>
        </Reveal>
        <RevealGroup className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REAL.map(([t, d]) => (
            <RevealItem key={t} className="rounded-2xl border border-[#E8E8EC] bg-white p-5 transition-transform hover:-translate-y-1">
              <div className="font-display text-[17px] font-semibold text-[#0B0B0F]">{t}</div>
              <div className="mt-2 text-[13px] leading-relaxed text-[#52525B]">{d}</div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ────────────────────────────── CTA ────────────────────────────── */
export function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#0F1420] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,rgba(39,72,232,0.35),transparent_70%)]" />
      <div className="relative mx-auto max-w-[900px] px-6 py-24 text-center lg:py-32">
        <Reveal>
          <h2 className="font-display text-[clamp(2.2rem,4.6vw,3.8rem)] font-semibold leading-[1.05] tracking-[-0.025em]">Stop finding out from the news.</h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-[1.05rem] leading-relaxed text-white/70">Fail a port in the live demo and watch the agent grade it, reroute it and ask you once. No login, no setup, thirty seconds.</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/demo" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#0F1420] transition-transform hover:-translate-y-0.5">Try the live demo <ArrowRight className="h-4 w-4" /></Link>
            <a href="https://github.com/Prashant-thakur77/SupplyChain-AI" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-[15px] font-semibold text-white hover:border-white/50">View on GitHub</a>
          </div>
          <p className="mt-6 text-[12px] text-white/50">Open source (MIT) · Built with the Strands Agents SDK · Gemini, Bedrock, Groq or local Ollama</p>
        </Reveal>
      </div>
    </section>
  )
}
