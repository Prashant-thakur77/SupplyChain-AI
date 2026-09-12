"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/layout/app-header"

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <AppHeader
      title={title}
      leftContent={<SidebarTrigger />}
    />
  )
}
