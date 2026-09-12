import * as React from "react"
import { Card } from "@/components/ui/card"

/**
 * GlassmorphicCard is a styled Card component with glassmorphism effects and three variants.
 * It supports all Card props and can be used for visually elevated UI sections.
 */
export interface GlassmorphicCardProps extends React.ComponentProps<typeof Card> {
  variant?: "default" | "accent" | "subtle"
}

export const GlassmorphicCard = React.forwardRef<HTMLDivElement, GlassmorphicCardProps>(
  ({ children, className = "", variant = "default", ...props }, ref) => {
    const variantStyles = {
      default:
        "border border-white/30 dark:border-slate-700/20 bg-white/80 dark:bg-slate-900/20 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/30",
      accent:
        "border border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-white/90 to-blue-50/80 dark:from-slate-900/30 dark:to-blue-950/20 backdrop-blur-xl shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20",
      subtle:
        "border border-white/20 dark:border-slate-700/10 bg-white/60 dark:bg-slate-900/10 backdrop-blur-lg shadow-lg shadow-black/5 dark:shadow-black/20",
    } as const

    return (
      <Card
        ref={ref}
        className={`${variantStyles[variant]} rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/40 ${className}`}
        {...props}
      >
        {children}
      </Card>
    )
  }
)
GlassmorphicCard.displayName = "GlassmorphicCard" 