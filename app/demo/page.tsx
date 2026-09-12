import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ShieldAlert } from "lucide-react"
import { DemoTwinClient } from "@/components/demo/DemoTwinClient"

export const metadata: Metadata = {
  title: "Live demo · SupplyChain AI",
  description: "Fail a port, watch the Strands incident graph compute the blast radius, rank exact reroutes, and hand you one decision.",
}

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-theme-bg-primary text-theme-text-primary">
      <header className="sticky top-0 z-[100] flex h-[52px] w-full shrink-0 items-center justify-between border-b border-theme-border-subtle bg-theme-bg-surface px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <div className="rounded-xl bg-theme-blue p-1.5 shadow-sm"><ShieldAlert className="h-4 w-4 text-white" aria-hidden="true" /></div>
          <span className="text-[1rem] font-bold tracking-[-0.02em]">SupplyChain AI</span>
          <span className="ml-1 rounded-full border border-theme-blue/30 bg-theme-blue-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-theme-blue">Live demo</span>
        </Link>
        <div className="flex items-center gap-3">
          <a href="https://github.com/Prashant-thakur77/SupplyChain-AI" target="_blank" rel="noreferrer" className="hidden text-sm text-theme-text-secondary hover:text-theme-text-primary sm:inline">GitHub</a>
          <Link href="/signin" className="inline-flex items-center gap-1.5 rounded-full bg-theme-blue px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">Full app <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col"><DemoTwinClient /></main>
    </div>
  )
}
