import { formatDistanceToNow } from 'date-fns'
import { Globe } from "lucide-react"
import { siteIcons } from "./constants"
import type { NotificationType, Notification, NotificationCitations } from "./types"

/**
 * Safely formats a date string to a human-readable format
 * @param dateString - ISO date string to format
 * @returns Formatted date string or null if invalid
 */
export function safeDateFormat(dateString: string): string | null {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return null
  }
}

/**
 * Gets the appropriate icon for a website URL
 * @param url - The URL to get the icon for
 * @returns React node representing the site icon
 */
export function getSiteIcon(url: string): React.ReactNode {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    // Remove www. prefix
    const cleanHostname = hostname.replace(/^www\./, '')
    return siteIcons[cleanHostname] || <Globe className="w-3.5 h-3.5" />
  } catch {
    return <Globe className="w-3.5 h-3.5" />
  }
}

/**
 * Determines the notification type based on the notification data
 * @param notification - The notification object
 * @returns The notification type
 */
export function getNotificationType(notification: Notification): NotificationType {
  if (notification.severity === 'HIGH') return "alert"
  if (notification.severity === 'MEDIUM') return "warning"
  if (notification.notification_type?.includes('success')) return "success"
  return "info"
}

/**
 * Gets the appropriate icon for a notification based on its category
 * @param notification - The notification object
 * @returns JSX element representing the notification icon
 */
export function getNotificationIcon(notification: Notification) {
  const category = notification.citations as NotificationCitations | null
  const categoryType = category?.category || notification.notification_type

  if (categoryType?.includes('transport') || categoryType?.includes('logistics') || categoryType?.includes('edge')) {
    return { type: 'route', className: 'h-5 w-5' }
  } else if (categoryType?.includes('node') || categoryType?.includes('facility') || categoryType?.includes('supplier')) {
    return { type: 'factory', className: 'h-5 w-5' }
  } else {
    return { type: 'package', className: 'h-5 w-5' }
  }
}

/**
 * Truncates a message to a specified length
 * @param message - The message to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated message with ellipsis if needed
 */
export function truncateMessage(message: string | null, maxLength: number = 120): string | null {
  if (!message) return null
  return message.length > maxLength 
    ? `${message.substring(0, maxLength)}...` 
    : message
} 