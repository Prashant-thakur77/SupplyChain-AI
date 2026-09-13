"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  HelpCircle,
  Home,
  LineChart,
  Network,
  Settings,
  ShieldAlert,
  User,
  Brain,
  Inbox,
  Activity,
  Users,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme"
import { TOUR_START_EVENT } from "@/components/onboarding/ProductTour"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/layout/notification-dropdown"
import { DecisionsBadge } from "@/components/decisions/decisions-badge"
import { AgentHealthDot } from "@/components/layout/agent-health-dot"

export function AppSidebar() {
  const pathname = usePathname()

  const navigationItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", isActive: pathname === "/dashboard", tour: "nav-dashboard" },
    { href: "/decisions", icon: Inbox, label: "Decisions", isActive: pathname === "/decisions", tour: "nav-decisions" },
    { href: "/agents", icon: Activity, label: "Agent Ops", isActive: pathname === "/agents", tour: "nav-agents" },
    { href: "/playbooks", icon: BookOpen, label: "Playbooks", isActive: pathname === "/playbooks", tour: "nav-playbooks" },
    { href: "/digital-twin", icon: Network, label: "Digital Twin", isActive: pathname === "/digital-twin", tour: "nav-twin" },
    { href: "/simulation", icon: LineChart, label: "Simulation", isActive: pathname === "/simulation", tour: "nav-simulation" },
    { href: "/risk-prediction", icon: Brain, label: "Site Risk", isActive: pathname === "/risk-prediction", tour: "nav-risk" },
  ]

  const footerItems = [
    { href: "/team", icon: Users, label: "Team", isActive: pathname === "/team", tour: "header-team" },
    { href: "/profile", icon: User, label: "Profile", isActive: pathname === "/profile", tour: "header-profile" },
  ]

  return (
    <div className="w-full h-[52px] border-b border-theme-border-subtle bg-theme-bg-glass backdrop-blur-[16px] saturate-[180%] flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-[100]">
      {/* Left: Logo + Nav links */}
      <div className="flex items-center gap-4">
        <Link href="/" data-tour="brand" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-theme-blue/10 rounded-xl blur-sm group-hover:blur-md transition-all" />
            <div className="relative bg-theme-blue p-1.5 rounded-xl shadow-sm">
              <ShieldAlert className="h-4 w-4 text-white" />
            </div>
          </div>
          <span className="font-[700] text-[1rem] tracking-[-0.02em] text-theme-text-primary hidden sm:block">
            SupplyChain AI
          </span>
        </Link>

        <div className="h-5 w-px bg-theme-border-subtle hidden sm:block" />

        <nav className="flex items-center gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <TooltipProvider key={item.href} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      data-tour={item.tour}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[0.82rem] font-[500] transition-all duration-200 border border-transparent",
                        item.isActive
                          ? "bg-theme-blue-soft text-theme-blue font-semibold"
                          : "text-theme-text-muted hover:bg-theme-bg-secondary hover:text-theme-text-primary"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden md:block">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </nav>
      </div>

      {/* Right: Notification + Theme + Profile */}
      <div className="flex items-center gap-2">
        <span data-tour="header-agent" className="flex items-center gap-2"><AgentHealthDot />
        <DecisionsBadge />
        <NotificationDropdown /></span>
        <ThemeToggle />
        <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
          <button type="button" aria-label="Take the product tour" onClick={() => window.dispatchEvent(new Event(TOUR_START_EVENT))} className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full bg-theme-bg-secondary border border-theme-border-subtle text-theme-text-primary hover:bg-theme-bg-secondary/80 transition-all shrink-0"><HelpCircle className="h-4 w-4" /></button>
        </TooltipTrigger><TooltipContent side="bottom">Take the tour</TooltipContent></Tooltip></TooltipProvider>
        {footerItems.map((item) => {
          const Icon = item.icon
          return (
            <TooltipProvider key={item.href} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    data-tour={item.tour}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-theme-bg-secondary border border-theme-border-subtle hover:bg-theme-bg-secondary/80 text-theme-text-primary transition-all duration-200 shrink-0",
                      item.isActive && "ring-2 ring-theme-blue/50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </div>
  )
}