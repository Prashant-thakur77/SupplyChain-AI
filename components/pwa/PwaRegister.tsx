"use client"

import { useEffect } from "react"

/** Registers the service worker once (push + offline shell). Safe on unsupported browsers. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  }, [])
  return null
}
