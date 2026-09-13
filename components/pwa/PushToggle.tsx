"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function b64ToU8(b64: string) { const p = "=".repeat((4 - (b64.length % 4)) % 4); const s = (b64 + p).replace(/-/g, "+").replace(/_/g, "/"); const raw = atob(s); return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))) }

/** Subscribe this device to decision push notifications (PWA). */
export function PushToggle({ className }: { className?: string }) {
  const [supported, setSupported] = useState(false), [on, setOn] = useState(false), [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    setSupported(true)
    navigator.serviceWorker.getRegistration().then((r) => r?.pushManager.getSubscription()).then((s) => setOn(!!s)).catch(() => {})
  }, [])
  if (!supported) return null
  const toggle = async () => {
    setBusy(true)
    try {
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"))
      const existing = await reg.pushManager.getSubscription()
      if (existing) { await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: existing.endpoint }) }); await existing.unsubscribe(); setOn(false); toast.success("Push notifications off"); return }
      const { publicKey } = await fetch("/api/push/subscribe").then((r) => r.json())
      if (!publicKey) { toast.error("Push is not configured on this deployment (VAPID keys missing)."); return }
      if ((await Notification.requestPermission()) !== "granted") { toast.error("Notifications were blocked in the browser."); return }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(publicKey) })
      const r = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) })
      if (!r.ok) throw new Error((await r.json()).error)
      setOn(true); toast.success("This device will be pinged when a decision needs you")
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return <Button variant="outline" size="sm" onClick={toggle} disabled={busy} className={className}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : on ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}<span className="ml-1.5">{on ? "Push on" : "Enable push"}</span></Button>
}
