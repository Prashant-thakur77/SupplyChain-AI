"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = React.useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light")
  }, [theme, setTheme])

  if (!mounted) {
    // Render a placeholder to avoid layout shift
    return <div className="w-16 h-8" />
  }

  const darkmode = theme === "dark"

  return (
    <div
      className={`flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300 ${
        darkmode
          ? "bg-zinc-950 border border-zinc-800"
          : "bg-white border border-zinc-200"
      }`}
      onClick={handleToggle}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={`flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300 ${
            darkmode
              ? "transform translate-x-0 bg-zinc-800"
              : "transform translate-x-8 bg-gray-200"
          }`}
        >
          {darkmode ? (
            <MoonIcon className="w-4 h-4 text-white" />
          ) : (
            <SunIcon className="w-4 h-4 text-gray-700" />
          )}
        </div>
        <div
          className={`flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300 ${
            darkmode ? "bg-transparent" : "transform -translate-x-8"
          }`}
        >
          {darkmode ? (
            <SunIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <MoonIcon className="w-4 h-4 text-black" />
          )}
        </div>
      </div>
    </div>
  )
} 