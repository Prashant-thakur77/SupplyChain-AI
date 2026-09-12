"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"

import {
  AnimationStart,
  AnimationVariant,
  createAnimation,
} from "./theme-animations"

interface ThemeToggleProps {
  variant?: AnimationVariant
  start?: AnimationStart
  showLabel?: boolean
  url?: string
}

export function ThemeToggle({
  variant = "circle-blur",
  start = "bottom-left",
  showLabel = false,
  url = "",
}: ThemeToggleProps) {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const styleId = "theme-transition-styles"

  const updateStyles = React.useCallback((css: string, name: string) => {
    if (typeof window === "undefined") return

    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement("style")
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = css
  }, [])

  const handleToggle = React.useCallback(() => {
    const animation = createAnimation(variant, start, url)
    updateStyles(animation.css, animation.name)

    if (typeof window === "undefined") return

    const switchTheme = () => {
      setTheme(theme === "light" ? "dark" : "light")
    }

    if (!document.startViewTransition) {
      switchTheme()
      return
    }

    document.startViewTransition(switchTheme)
  }, [theme, setTheme, variant, start, url, updateStyles])

  if (!mounted) {
    // Render a placeholder to avoid layout shift
    return <div className="w-16 h-8" />
  }

  const darkmode = theme === "dark"

  return (
    <button
      onClick={handleToggle}
      className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-theme-bg-secondary border border-theme-border-subtle hover:bg-theme-bg-secondary/80 text-theme-text-primary transition-all duration-200 shrink-0"
    >
      {darkmode ? (
        <SunIcon className="w-4 h-4 text-theme-text-primary" />
      ) : (
        <MoonIcon className="w-4 h-4 text-theme-text-primary" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
