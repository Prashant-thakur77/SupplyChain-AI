import type { Tables } from "@/lib/types/database"

export type NotificationType = "alert" | "warning" | "info" | "success"
export type MainTab = "alerts" | "news" | "activity"
export type Notification = Tables<"notifications">

export interface SourceMetadata {
  title?: string
  description?: string
  image?: string
  siteName?: string
  url?: string
  author?: string
  publishedTime?: string
}

export interface NotificationSource {
  url: string
  title: string
  credibility: number
  publishedAt: string
}

export interface NotificationCitations {
  sources?: NotificationSource[]
  relationships?: Array<{
    source: string
    target: string
    context: string
    strength: number
    relationship: string
  }>
  highest_impact?: {
    source: string
    target: string
    context: string
    strength: number
    relationship: string
  }
  category?: string
  confidence?: number
  affectedEntities?: string[]
} 