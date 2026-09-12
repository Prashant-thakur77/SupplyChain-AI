"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// The twin canvas pulls in Leaflet, which needs `window` — load client-side only.
const DemoTwin = dynamic(() => import("./DemoTwin").then((m) => m.DemoTwin), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-52px)] items-center justify-center text-sm text-theme-text-secondary"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading the twin…</div>
  ),
})

export function DemoTwinClient() {
  return <DemoTwin />
}
