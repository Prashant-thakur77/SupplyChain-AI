"use client"

import { cn } from "@/lib/utils"
import { HeaderActions } from "./header-actions"
import React from "react"

interface AppHeaderProps {
  title: string | React.ReactNode
  leftContent?: React.ReactNode
  className?: string
  as?: React.ElementType
}

export function AppHeader({ title, leftContent, className, as: Container = "header" }: AppHeaderProps) {
  return (
    <Container
      className={cn(
        "sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background-100/70 dark:bg-[#232325]/70 backdrop-blur-md shadow-sm px-6",
        className,
      )}
    >
      {leftContent}
      <div className="font-semibold text-lg">{title}</div>
      <HeaderActions />
    </Container>
  )
} 