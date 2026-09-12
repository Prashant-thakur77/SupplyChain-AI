"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, Loader2, Send, Wrench, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { consumeSse } from "@/lib/sse"
import { cn } from "@/lib/utils"

interface Msg { role: "user" | "assistant"; text: string; tools?: string[] }

interface Props {
  supplyChainId?: string
  userId?: string
  /** Unsaved canvas state (optional) — sent inline so the copilot can reason about it. */
  nodes?: any[]
  edges?: any[]
  /** Demo endpoint override. */
  endpoint?: string
  placeholder?: string
  suggestions?: string[]
  className?: string
  compact?: boolean
}

/** Streaming chat with the Strands copilot agent (tools: load_twin, blast radius, reroutes, impact, news, weather, memory). */
export function StrandsChat({ supplyChainId, userId, nodes, edges, endpoint = "/api/agent/chat", placeholder = "Ask about risk, routes, or 'what if Suez is blocked?'", suggestions = [], className, compact }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs])

  async function send(text: string) {
    const q = text.trim()
    if (!q || busy) return
    setInput("")
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "assistant", text: "", tools: [] }])
    setBusy(true)
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", accept: "text/event-stream" }, body: JSON.stringify({ supplyChainId, userId, message: q, nodes, edges }) })
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({})))?.detail ?? `Request failed (${res.status})`)
      await consumeSse(res, (event, data) => {
        setMsgs((m) => {
          const last = { ...m[m.length - 1] }
          if (event === "token") last.text += data?.text ?? ""
          else if (event === "tool" && data?.name) last.tools = [...(last.tools ?? []), data.name]
          else if (event === "error") last.text += `\n\n_${data?.error ?? "error"}_`
          return [...m.slice(0, -1), last]
        })
      })
    } catch (e) {
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", text: `Sorry — ${(e as Error).message}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-col rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface", className)}>
      <div className={cn("min-h-0 flex-1 space-y-3 overflow-y-auto p-3", compact ? "max-h-72" : "")}>
        {msgs.length === 0 && (
          <div className="space-y-2 text-xs text-theme-text-muted">
            <p className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5 text-theme-blue" /> Strands copilot — it calls the routing engine, so the numbers are exact.</p>
            {suggestions.length > 0 && <div className="flex flex-wrap gap-1.5">{suggestions.map((s) => <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-theme-border-subtle px-2 py-0.5 text-[11px] text-theme-text-secondary hover:border-theme-blue hover:text-theme-blue">{s}</button>)}</div>}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "assistant" && <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-theme-blue-soft text-theme-blue"><Bot className="h-3.5 w-3.5" /></span>}
            <div className={cn("max-w-[85%] rounded-theme-md px-3 py-2 text-sm leading-relaxed", m.role === "user" ? "bg-theme-blue text-white" : "bg-theme-bg-secondary text-theme-text-primary")}>
              {m.tools && m.tools.length > 0 && <div className="mb-1.5 flex flex-wrap gap-1">{[...new Set(m.tools)].map((t) => <span key={t} className="inline-flex items-center gap-1 rounded-full border border-theme-border-subtle bg-theme-bg-surface px-1.5 py-0.5 font-mono text-[10px] text-theme-text-secondary"><Wrench className="h-2.5 w-2.5" />{t}</span>)}</div>}
              {m.role === "assistant" ? (m.text ? <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown></div> : <Loader2 className="h-4 w-4 animate-spin text-theme-text-muted" />) : m.text}
            </div>
            {m.role === "user" && <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-theme-bg-secondary text-theme-text-secondary"><User className="h-3.5 w-3.5" /></span>}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2 border-t border-theme-border-subtle p-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} disabled={busy} className="min-w-0 flex-1 rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text-primary outline-none focus:ring-2 focus:ring-theme-blue" />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-theme-md bg-theme-blue text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
      </form>
    </div>
  )
}
