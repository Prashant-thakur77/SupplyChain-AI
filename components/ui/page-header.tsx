"use client"

import type { ReactNode } from "react"
import { Reveal } from "@/components/motion"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  /** Small uppercase label above the title. */
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  /** Right-aligned actions (buttons, filters, etc.). */
  actions?: ReactNode
  /** Optional leading icon element. */
  icon?: ReactNode
  className?: string
}

/**
 * Consistent page header used across in-app screens. Editorial (Fraunces)
 * title, muted subtitle, optional eyebrow + actions. Theme-aware via tokens.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          {eyebrow && (
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </Reveal>
  )
}
