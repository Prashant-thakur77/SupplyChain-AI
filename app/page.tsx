"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Github, Menu, ShieldAlert, X } from "lucide-react"
import { Footer } from "@/components/home-page"
import { Agents, CTA, Hero, HowItWorks, InboxPreview, RealNetwork, Problem, Stats, Ticker } from "@/components/landing/sections"

const NAV = [["#how-it-works", "How it works"], ["#inbox", "Decision Inbox"], ["/demo", "Live demo"]] as const

export default function Home() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8)
    f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] font-sans text-[#0F172A] antialiased">
      <header className={`sticky top-0 z-50 border-b transition-colors ${scrolled ? "border-[#E2E8F0] bg-[#F8FAFC]/85 backdrop-blur" : "border-transparent bg-transparent"}`}>
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4F46E5] text-white shadow-sm"><ShieldAlert className="h-4 w-4" /></span>
            <span className="text-[17px] font-bold tracking-[-0.02em]">SupplyChain AI</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[14px] font-medium text-[#475569] md:flex">
            {NAV.map(([h, l]) => <Link key={h} href={h} className="transition-colors hover:text-[#0F172A]">{l}</Link>)}
            <a href="https://github.com/Prashant-thakur77/SupplyChain-AI" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#0F172A]"><Github className="h-4 w-4" /> GitHub</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/signin" className="hidden rounded-full px-4 py-2 text-[14px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] md:inline-flex">Sign in</Link>
            <Link href="/demo" className="inline-flex items-center gap-1.5 rounded-full bg-[#4F46E5] px-4 py-2 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5">Live demo <ArrowRight className="h-3.5 w-3.5" /></Link>
            <button type="button" aria-label="Menu" onClick={() => setOpen((o) => !o)} className="ml-1 rounded-full p-2 md:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {open && (
          <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-[15px] font-medium">
              {NAV.map(([h, l]) => <Link key={h} href={h} onClick={() => setOpen(false)}>{l}</Link>)}
              <a href="https://github.com/Prashant-thakur77/SupplyChain-AI" target="_blank" rel="noreferrer">GitHub</a>
              <Link href="/signin" onClick={() => setOpen(false)}>Sign in</Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <Hero />
        <Ticker />
        <Problem />
        <Stats />
        <HowItWorks />
        <Agents />
        <InboxPreview />
        <RealNetwork />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
