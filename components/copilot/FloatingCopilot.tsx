"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Bot, X } from "lucide-react"
import { StrandsChat } from "@/components/copilot/StrandsChat"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"
import { cn } from "@/lib/utils"

/** The app-wide copilot: a floating button that opens the Strands copilot on the twin you are looking at (or your first twin). */
export function FloatingCopilot() {
  const [open, setOpen] = useState(false)
  const [me, setMe] = useState<{ id: string } | null>(null)
  const [chains, setChains] = useState<{ id: string; name: string }[]>([])
  const selected = useDigitalTwinStore((s) => s.selectedSupplyChain)
  const nodes = useDigitalTwinStore((s) => s.nodes)
  const edges = useDigitalTwinStore((s) => s.edges)
  const pathname = usePathname()
  useEffect(() => { fetch("/api/me").then((r) => r.json()).then(async (j) => { if (!j.user?.id) return; setMe(j.user); const r = await fetch(`/api/policies?userId=${j.user.id}`); const p = await r.json(); setChains((p.twins ?? []).map((t: any) => ({ id: t.id, name: t.name }))) }).catch(() => undefined) }, [])
  const onCanvas = pathname?.startsWith("/digital-twin") && nodes.length > 0
  const chainId = selected && selected !== "default-chain" ? selected : chains[0]?.id
  const chainName = chains.find((c) => c.id === chainId)?.name
  if (pathname?.startsWith("/demo")) return null
  return (
    <>
      <button type="button" aria-label={open ? "Close copilot" : "Open copilot"} onClick={() => setOpen((o) => !o)} data-tour="copilot"
        className={cn("fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-theme-blue text-white shadow-[0_20px_50px_-20px_rgba(39,72,232,0.8)] transition-transform hover:scale-105", open && "scale-95")}>
        {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-[90] flex h-[min(600px,calc(100vh-130px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-theme-border-subtle bg-theme-bg-surface shadow-[0_30px_80px_-30px_rgba(15,23,42,0.6)]">
          <div className="flex items-center gap-2 border-b border-theme-border-subtle px-4 py-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-theme-blue-soft text-theme-blue"><Bot className="h-4 w-4" /></span>
            <div className="min-w-0"><div className="text-sm font-semibold text-theme-text-primary">Copilot</div><div className="truncate text-[11px] text-theme-text-muted">{onCanvas ? "Reasoning on the canvas you are editing" : chainName ? `On ${chainName}` : "Build a twin to ask about your network"}</div></div>
          </div>
          <StrandsChat className="min-h-0 flex-1 rounded-none border-0" supplyChainId={chainId} userId={me?.id} nodes={onCanvas ? nodes : undefined} edges={onCanvas ? edges : undefined}
            suggestions={["What is our single point of failure?", "What if Suez is blocked?", "Cheapest route to our largest destination?", "Any delayed shipments?"]} />
        </div>
      )}
    </>
  )
}
