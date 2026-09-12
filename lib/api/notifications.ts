import { supabaseClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"

export async function getNotifications(userId: string): Promise<Tables<"notifications">[]> {
  try {
    const { data, error } = await supabaseClient
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      if (error.code === 'PGRST205' || error.code === '404') {
        // Table doesn't exist yet, return empty array silently to prevent console spam
        return [];
      }
      console.error("Error fetching notifications:", error)
      return [];
    }
    return data || []
  } catch (error) {
    // Silently return empty array to prevent console spam for missing table
    return [];
  }
}


import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from "@/lib/actions/notifications"

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  console.log(`[API] Marking notification ${notificationId} as read via server action...`)
  const result = await markNotificationAsReadAction(notificationId)

  if (!result.success) {
    console.error("❌ [API] Error marking notification as read:", result.error)
    throw new Error(result.error)
  }

  console.log("✅ [API] Notification marked as read successfully")
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  console.log(`[API] Marking all notifications for ${userId} as read via server action...`)
  const result = await markAllNotificationsAsReadAction(userId)

  if (!result.success) {
    console.error("❌ [API] Error marking all notifications as read:", result.error)
    throw new Error(result.error)
  }

  console.log("✅ [API] All notifications marked as read successfully")
}

/**
 * Fetches the top 5 most recent live_news_alert notifications from the DB.
 * These are persisted by the /api/agent/news-polling route when it runs.
 */
export async function getLatestNewsNotifications(userId: string): Promise<Tables<"notifications">[]> {
  try {
    const { data, error } = await supabaseClient
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("notification_type", "live_news_alert")
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      console.error("Error fetching news notifications:", error)
      return []
    }
    return data || []
  } catch {
    return []
  }
}
