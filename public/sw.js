// SupplyChain AI service worker: push notifications + app-shell cache for offline reopen.
const SHELL = "sc-shell-v1"
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(SHELL).then((c) => c.addAll(["/decisions", "/favicon.svg"]).catch(() => {}))) })
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()))
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin) || e.request.url.includes("/api/")) return
  e.respondWith(fetch(e.request).then((r) => { if (r.ok && e.request.mode === "navigate") caches.open(SHELL).then((c) => c.put(e.request, r.clone())); return r }).catch(() => caches.match(e.request).then((m) => m || caches.match("/decisions"))))
})
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {} } catch { d = { title: "SupplyChain AI", body: e.data && e.data.text() } }
  e.waitUntil(self.registration.showNotification(d.title || "SupplyChain AI", { body: d.body || "", icon: "/favicon.svg", badge: "/favicon.svg", tag: d.tag || "decision", data: { url: d.url || "/decisions" }, actions: d.actions || [] }))
})
self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  const url = (e.action && e.notification.data && e.notification.data[e.action]) || (e.notification.data && e.notification.data.url) || "/decisions"
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => { const c = cs.find((x) => "focus" in x); if (c) { c.navigate(url); return c.focus() } return self.clients.openWindow(url) }))
})
