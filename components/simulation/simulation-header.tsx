"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/layout/app-header"

export function SimulationHeader() {
  return (
    <AppHeader
      title="Simulation & Scenario Generation"
      leftContent={<SidebarTrigger />}
      className="z-10 bg-white dark:bg-gray-800"
    />
  )
}
