"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Inbox } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { countPending } from "@/lib/decisions"
import { getUserData } from "@/utils/functions/userUtils"

/** Header chip showing how many decisions are waiting for the operator. Polls every 30s. */
export function DecisionsBadge() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    let uid: string | null = null
    let timer: ReturnType<typeof setInterval> | undefined
    ;(async () => {
      const u = await getUserData()
      uid = u?.id ?? null
      if (!uid) return
      const tick = () => countPending(uid!).then(setCount).catch(() => undefined)
      tick()
      timer = setInterval(tick, 30_000)
    })()
    return () => { if (timer) clearInterval(timer) }
  }, [])
  if (count === null) return null
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/decisions" aria-label={`${count} pending decisions`} className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-theme-text-secondary transition-colors hover:bg-theme-bg-secondary hover:text-theme-text-primary">
            <Inbox className="h-[18px] w-[18px]" />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-theme-amber px-1 text-[10px] font-bold text-black">{count > 9 ? "9+" : count}</span>}
          </Link>
        </TooltipTrigger>
        <TooltipContent>{count === 0 ? "No decisions waiting" : `${count} decision${count === 1 ? "" : "s"} waiting for you`}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
