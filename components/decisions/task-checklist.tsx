"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Circle, CircleDashed, ListChecks, MinusCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task { id: string; position: number; title: string; owner: string | null; due_in_days: number | null; detail: string | null; status: "todo" | "doing" | "done" | "skipped"; done_at: string | null }

const NEXT: Record<Task["status"], Task["status"]> = { todo: "doing", doing: "done", done: "todo", skipped: "todo" }
const ICON = { todo: Circle, doing: CircleDashed, done: CheckCircle2, skipped: MinusCircle }

/** The Strategist's mitigation steps as a trackable checklist (click to advance todo → doing → done). */
export function TaskChecklist({ decisionId, decidedAt, readOnly }: { decisionId: string; decidedAt?: string | null; readOnly?: boolean }) {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  useEffect(() => { fetch(`/api/decisions/${decisionId}/tasks`).then((r) => r.json()).then((j) => setTasks(j.tasks ?? [])).catch(() => setTasks([])) }, [decisionId])
  if (!tasks || tasks.length === 0) return null
  const done = tasks.filter((t) => t.status === "done").length
  const advance = async (t: Task, to?: Task["status"]) => {
    if (readOnly) return
    const status = to ?? NEXT[t.status]
    setTasks((ts) => (ts ?? []).map((x) => (x.id === t.id ? { ...x, status } : x)))
    await fetch(`/api/decisions/${decisionId}/tasks`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ taskId: t.id, status }) }).catch(() => undefined)
  }
  const base = decidedAt ? new Date(decidedAt) : new Date()
  return (
    <div className="mt-4 rounded-theme-md border border-theme-border-subtle p-3">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-theme-blue" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Execution checklist</span>
        <span className="ml-auto text-xs text-theme-text-secondary">{done}/{tasks.length} done</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-theme-bg-secondary"><div className="h-full bg-theme-green transition-all" style={{ width: `${(done / tasks.length) * 100}%` }} /></div>
      <ul className="mt-2 space-y-1">
        {tasks.map((t) => { const I = ICON[t.status]; const due = t.due_in_days != null ? new Date(base.getTime() + t.due_in_days * 86400000) : null; const overdue = due && t.status !== "done" && due < new Date()
          return (
            <li key={t.id} className="flex items-start gap-2 rounded px-1 py-1 hover:bg-theme-bg-secondary/60">
              <button type="button" onClick={() => advance(t)} disabled={readOnly} aria-label={`Mark ${t.title}`} className={cn("mt-0.5 shrink-0", t.status === "done" ? "text-theme-green" : t.status === "doing" ? "text-theme-blue" : "text-theme-text-muted")}><I className="h-4 w-4" /></button>
              <div className="min-w-0 flex-1">
                <div className={cn("text-sm text-theme-text-primary", t.status === "done" && "line-through opacity-60", t.status === "skipped" && "opacity-50")}>{t.title}</div>
                <div className="text-[11px] text-theme-text-muted">{t.owner ?? "unassigned"}{due ? ` · due ${due.toLocaleDateString()}` : ""}{overdue ? <span className="ml-1 font-semibold text-theme-red">overdue</span> : null}{t.detail ? ` · ${t.detail}` : ""}</div>
              </div>
              {!readOnly && t.status !== "skipped" && t.status !== "done" && <button type="button" onClick={() => advance(t, "skipped")} className="text-[10px] text-theme-text-muted hover:text-theme-text-primary">skip</button>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
