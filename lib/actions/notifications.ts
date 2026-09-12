"use server"

import { supabaseServer } from "@/lib/supabase/server"

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("notifications")
      .update({ read_status: true })
      .eq("notification_id", notificationId)
      .select()

    if (error) {
      console.error("Error in markNotificationAsReadAction:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Critical error in markNotificationAsReadAction:", error)
    return { success: false, error: error.message }
  }
}

export async function markAllNotificationsAsReadAction(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("notifications")
      .update({ read_status: true })
      .eq("user_id", userId)
      .eq("read_status", false)
      .select()

    if (error) {
      console.error("Error in markAllNotificationsAsReadAction:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Critical error in markAllNotificationsAsReadAction:", error)
    return { success: false, error: error.message }
  }
}
