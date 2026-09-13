import webpush from "web-push"
import { supabaseServer } from "@/lib/supabase/server"

export function pushConfigured() { return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) }

/** Send a push to every device of a user. Dead subscriptions (410/404) are pruned. Returns the number delivered. */
export async function pushToUser(userId: string, payload: { title: string; body: string; url?: string; tag?: string; actions?: { action: string; title: string }[] }) {
  if (!pushConfigured()) return 0
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:ops@example.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)
  const { data } = await supabaseServer.from("push_subscriptions").select("id, endpoint, keys").eq("user_id", userId)
  let sent = 0
  for (const s of data ?? []) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys as any }, JSON.stringify(payload), { TTL: 3600 }); sent++ }
    catch (e: any) { if (e?.statusCode === 410 || e?.statusCode === 404) await supabaseServer.from("push_subscriptions").delete().eq("id", s.id) }
  }
  return sent
}
