"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { createAnimation } from "./theme-animations"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarThemeToggleProps {
  variant?: "collapsed" | "expanded"
  className?: string
}

export function SidebarThemeToggle({ 
  variant = "expanded", 
  className 
}: SidebarThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    
    // Apply theme animation
    const animation = createAnimation("circle", "bottom-left")
    
    // Add animation styles
    const style = document.createElement("style")
    style.textContent = animation.css
    document.head.appendChild(style)
    
    // Start view transition if supported
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      ;(document as any).startViewTransition(() => {
        setTheme(newTheme)
      }).finished.finally(() => {
        // Clean up animation styles
        document.head.removeChild(style)
      })
    } else {
      setTheme(newTheme)
      // Clean up animation styles after a delay
      setTimeout(() => {
        document.head.removeChild(style)
      }, 1000)
    }
  }

  if (variant === "collapsed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleTheme}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted/40 hover:shadow-sm hover:scale-105 mx-auto",
              className
            )}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Toggle theme</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Expanded variant - you can customize this for the expanded sidebar if needed
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 hover:bg-muted/50",
        className
      )}
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4" />
          <span className="text-sm">Light mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          <span className="text-sm">Dark mode</span>
        </>
      )}
    </button>
  )
} 