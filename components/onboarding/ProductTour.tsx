"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react"
import { TOUR_STEPS, type TourStep } from "@/lib/tour/steps"
import { cn } from "@/lib/utils"

/** Fire this anywhere to (re)start the tour: window.dispatchEvent(new Event("sc:tour:start")). */
export const TOUR_START_EVENT = "sc:tour:start"

type Rect = { top: number; left: number; width: number; height: number }
const PAD = 8
const CARD_W = 340

function findTarget(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${id}"]`)
}

/**
 * First-run product tour. A spotlight (a fixed box with a huge box-shadow) moves from anchor to anchor across pages;
 * the card explains what the thing is. State lives in the user's row (tour_completed_at) so it only auto-starts once
 * per account, and it can be replayed from Profile.
 */
export function ProductTour() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [missing, setMissing] = useState(false)
  const step: TourStep | undefined = TOUR_STEPS[i]
  const raf = useRef<number | null>(null)

  // Auto-start once per account (checked against the DB flag, cached per session so it never re-fires).
  useEffect(() => {
    if (sessionStorage.getItem("sc-tour-checked")) return
    fetch("/api/tour").then((r) => r.json()).then((j) => {
      sessionStorage.setItem("sc-tour-checked", "1")
      if (j && j.done === false) { setI(0); setActive(true) }
    }).catch(() => undefined)
  }, [])
  useEffect(() => {
    const on = () => { setI(0); setActive(true) }
    window.addEventListener(TOUR_START_EVENT, on)
    return () => window.removeEventListener(TOUR_START_EVENT, on)
  }, [])

  const finish = useCallback((completed: boolean) => {
    setActive(false); setRect(null)
    fetch("/api/tour", { method: "POST" }).catch(() => undefined)
    if (completed) router.push("/digital-twin")
  }, [router])

  // Navigate to the step's route, then track its anchor's rect (re-measured on scroll/resize and while layout settles).
  useEffect(() => {
    if (!active || !step) return
    if (pathname !== step.route) { router.push(step.route); return }
    let alive = true, tries = 0
    setMissing(false)
    const measure = () => {
      if (!alive) return
      const el = findTarget(step.target)
      if (!el) { if (++tries < 40) { raf.current = window.setTimeout(measure, 100) as unknown as number; return } setMissing(true); setRect(null); return }
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) { if (++tries < 40) { raf.current = window.setTimeout(measure, 100) as unknown as number; return } }
      const inView = r.top >= 60 && r.bottom <= window.innerHeight - 20
      if (!inView) el.scrollIntoView({ block: "center", behavior: "smooth" })
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      raf.current = window.setTimeout(measure, 250) as unknown as number // keep following while things animate/scroll
    }
    measure()
    return () => { alive = false; if (raf.current) window.clearTimeout(raf.current) }
  }, [active, step, pathname, router])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false)
      if (e.key === "ArrowRight" || e.key === "Enter") setI((n) => Math.min(TOUR_STEPS.length - 1, n + 1))
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, finish])

  // Card placement: below the anchor when there is room, else above; clamped to the viewport. Narrow screens: bottom sheet.
  const [card, setCard] = useState<{ top: number; left: number; arrow: "up" | "down" | "none" }>({ top: 0, left: 0, arrow: "none" })
  useLayoutEffect(() => {
    if (!rect) return
    const vw = window.innerWidth, vh = window.innerHeight
    if (vw < 640) { setCard({ top: -1, left: 0, arrow: "none" }); return }
    const cardH = 190
    const below = rect.top + rect.height + PAD + 12
    const fitsBelow = below + cardH < vh - 16
    const top = fitsBelow ? below : Math.max(16, rect.top - PAD - 12 - cardH)
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - CARD_W / 2), vw - CARD_W - 16)
    setCard({ top, left, arrow: fitsBelow ? "up" : "down" })
  }, [rect])

  if (!active || !step) return null
  const last = i === TOUR_STEPS.length - 1
  const spot = rect ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 } : null

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Spotlight: the box-shadow paints the dim layer everywhere except the anchor. */}
      {spot ? (
        <div className="pointer-events-none absolute rounded-[14px] transition-all duration-300 ease-out" style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height, boxShadow: "0 0 0 9999px rgba(24,22,15,0.55), 0 0 0 3px rgba(39,72,232,0.9), 0 0 40px 6px rgba(39,72,232,0.35)" }} />
      ) : (
        <div className="absolute inset-0 bg-[rgba(24,22,15,0.55)]" />
      )}
      {/* Click-catcher so the page underneath does not react while touring. */}
      <div className="absolute inset-0" onClick={() => finish(false)} />

      <div
        className={cn("absolute w-[340px] max-w-[calc(100vw-32px)] rounded-2xl border border-theme-border-subtle bg-theme-bg-surface p-4 shadow-[0_30px_80px_-30px_rgba(24,22,15,0.6)] transition-all duration-300 ease-out", card.top === -1 && "bottom-4 left-4 right-4 w-auto max-w-none")}
        style={card.top === -1 ? undefined : { top: card.top, left: card.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {card.arrow !== "none" && spot && (
          <span className={cn("absolute h-3 w-3 rotate-45 border-theme-border-subtle bg-theme-bg-surface", card.arrow === "up" ? "-top-1.5 border-l border-t" : "-bottom-1.5 border-b border-r")} style={{ left: Math.min(Math.max(16, spot.left + spot.width / 2 - card.left - 6), CARD_W - 28) }} />
        )}
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-theme-blue-soft text-theme-blue"><Sparkles className="h-3.5 w-3.5" /></span>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-theme-text-muted">Tour · {i + 1} / {TOUR_STEPS.length}</span>
          <button type="button" onClick={() => finish(false)} aria-label="Skip tour" className="ml-auto rounded-full p-1 text-theme-text-muted hover:bg-theme-bg-secondary hover:text-theme-text-primary"><X className="h-4 w-4" /></button>
        </div>
        <h3 className="mt-2 font-display text-[19px] font-semibold leading-tight text-theme-text-primary">{step.title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-theme-text-secondary">{step.body}{missing && <span className="block pt-1 text-[11px] text-theme-text-muted">(This element isn't on screen right now — open the page later to see it.)</span>}</p>
        <div className="mt-3 flex items-center gap-1">
          {TOUR_STEPS.map((s, n) => <button key={s.id} type="button" aria-label={`Go to step ${n + 1}`} onClick={() => setI(n)} className={cn("h-1.5 rounded-full transition-all", n === i ? "w-4 bg-theme-blue" : n < i ? "w-1.5 bg-theme-blue opacity-40" : "w-1.5 bg-theme-border-default")} />)}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" onClick={() => finish(false)} className="text-xs font-medium text-theme-text-muted hover:text-theme-text-primary">Skip tour</button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0} className="inline-flex h-8 items-center gap-1 rounded-full border border-theme-border-subtle px-3 text-xs font-semibold text-theme-text-secondary hover:text-theme-text-primary disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
            <button type="button" onClick={() => (last ? finish(true) : setI((n) => n + 1))} className="inline-flex h-8 items-center gap-1 rounded-full bg-theme-blue px-3.5 text-xs font-semibold text-white hover:opacity-90">{last ? "Build my twin" : "Next"} {!last && <ArrowRight className="h-3.5 w-3.5" />}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
