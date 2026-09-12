"use client"

import { useEffect, useRef, useState } from "react"
import { motion, type Variants } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { BellIcon } from "@/components/icons"
import { getUserData } from "@/utils/functions/userUtils"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api/notifications"
import type { Tables } from "@/lib/types/database"
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
    ArrowRight,
    Check,
    CheckCheck,
    Loader2,
} from "lucide-react"
import { SourceBubble, type NotificationSource } from "@/components/ui/source-bubble"

// Utility function to safely format dates
function safeDateFormat(dateString: string): string | null {
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return null
        return formatDistanceToNow(date, { addSuffix: true })
    } catch {
        return null
    }
}

// Animation variants for dropdown content with dark mode support
const dropdownContent: Variants = {
    hidden: {
        clipPath: 'inset(10% 50% 90% 50% round 12px)',
        opacity: 0,
        scale: 0.95,
    },
    show: {
        clipPath: 'inset(0% 0% 0% 0% round 12px)',
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            bounce: 0,
            duration: 0.4,
            delayChildren: 0.1,
            staggerChildren: 0.05,
        },
    },
    exit: {
        clipPath: 'inset(10% 50% 90% 50% round 12px)',
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.2,
        }
    }
}

const dropdownItem: Variants = {
    hidden: {
        opacity: 0,
        y: -10,
        filter: 'blur(4px)',
    },
    show: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            type: 'spring',
            bounce: 0,
            duration: 0.3,
        }
    },
}

type Notification = Tables<"notifications">

interface NotificationCitations {
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

function RelationshipBubble({ relationship }: { relationship: { source: string, target: string, strength: number, relationship: string } }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md cursor-pointer border bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                        <div className="w-1.5 h-1.5 bg-current rounded-full" />
                        Risk Chain ({Math.round(relationship.strength * 100)}%)
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <div className="flex flex-col gap-1">
                        <div className="font-medium text-sm">Risk Relationship</div>
                        <div className="text-xs">
                            <span className="font-medium">{relationship.source}</span>
                            <span className="mx-1">→</span>
                            <span className="font-medium">{relationship.target}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Impact: {relationship.relationship}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Strength: {Math.round(relationship.strength * 100)}%
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function NotificationItem({ notification, onMarkAsRead }: { notification: Notification, onMarkAsRead: (id: string) => Promise<void> }) {
    const [isMarking, setIsMarking] = useState(false)
    const citations = notification.citations as NotificationCitations | null
    
    // Truncate message to 120 characters for better layout
    const truncatedMessage = notification.message && notification.message.length > 120 
        ? `${notification.message.substring(0, 120)}...` 
        : notification.message

    // Enhanced severity color with dark mode support
    const severityColor = notification.severity === 'HIGH' 
        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700' 
        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'

    const handleMarkAsRead = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (notification.read_status || isMarking) return
        
        setIsMarking(true)
        try {
            await onMarkAsRead(notification.notification_id)
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        } finally {
            setIsMarking(false)
        }
    }

    return (
        <motion.div variants={dropdownItem}>
            <DropdownMenuItem className={cn(
                "cursor-pointer p-3 transition-colors duration-200 outline-none",
                "focus:bg-theme-bg-secondary hover:bg-theme-bg-secondary",
                !notification.read_status ? 'bg-theme-blue-soft/40 dark:bg-theme-blue-soft/10' : ''
            )}>
                <div className="flex flex-col gap-2.5 w-full text-left">
                    <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm leading-tight text-theme-text-primary">{notification.title}</div>
                        <div className="flex items-center gap-1">
                            {notification.severity && (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 border ${severityColor}`}>
                                    {notification.severity}
                                </Badge>
                            )}
                            {!notification.read_status && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={handleMarkAsRead}
                                                disabled={isMarking}
                                            >
                                                {isMarking ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Check className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Mark as read</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                    {truncatedMessage && (
                        <div className="text-xs text-theme-text-secondary leading-relaxed mb-2">
                            {truncatedMessage}
                        </div>
                    )}
                    
                    {/* Visual indicator for Live News */}
                    {notification.notification_type === 'live_news_alert' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-2 rounded border bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-[10px] uppercase font-bold tracking-wider w-fit shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                            Live News
                        </div>
                    )}

                    {/* Display sources if available */}
                    {citations?.sources && citations.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {citations.sources.slice(0, 3).map((source, index) => (
                                <SourceBubble key={index} source={source} />
                            ))}
                            {citations.sources.length > 3 && (
                                <div className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-theme-bg-secondary text-theme-text-muted rounded-md border border-theme-border-subtle">
                                    +{citations.sources.length - 3} more
                                </div>
                            )}
                        </div>
                    )}

                    {/* Display relationships if available */}
                    {citations?.relationships && citations.relationships.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            <RelationshipBubble relationship={citations.relationships[0]} />
                            {citations.relationships.length > 1 && (
                                <div className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-theme-bg-secondary text-theme-text-secondary rounded-md border border-theme-border-subtle">
                                    +{citations.relationships.length - 1} more
                                </div>
                            )}
                        </div>
                    )}

                    {/* Display affected entities */}
                    {citations?.affectedEntities && citations.affectedEntities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {citations.affectedEntities.slice(0, 3).map((entity, index) => (
                                <div key={index} className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-theme-bg-secondary text-theme-text-secondary rounded-md border border-theme-border-subtle">
                                    {entity}
                                </div>
                            ))}
                            {citations.affectedEntities.length > 3 && (
                                <div className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-theme-bg-secondary text-theme-text-muted rounded-md border border-theme-border-subtle">
                                    +{citations.affectedEntities.length - 3} more
                                </div>
                            )}
                        </div>
                    )}

                    {notification.created_at && safeDateFormat(notification.created_at) && (
                        <div className="text-[10px] text-theme-text-muted">
                            {safeDateFormat(notification.created_at)}
                        </div>
                    )}
                </div>
            </DropdownMenuItem>
        </motion.div>
    )
}

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [user, setUser] = useState<Tables<'users'> | null>(null)
    const [isMarkingAll, setIsMarkingAll] = useState(false)
    const locallyReadIds = useRef<Set<string>>(new Set())

    useEffect(() => {
        async function fetchUser() {
            const userData = await getUserData()
            setUser(userData)
        }
        fetchUser()
    }, [])

    useEffect(() => {
        if (!user?.id) return;

        async function fetchNotifications() {
            if (!user?.id) return; // Additional null check for TypeScript
            const fetchedNotifications = await getNotifications(user.id)
            
            // Merge locally-marked-read IDs
            const merged = fetchedNotifications.map(n =>
                locallyReadIds.current.has(n.notification_id)
                    ? { ...n, read_status: true }
                    : n
            )
            
            setNotifications(merged)
            const unread = merged.filter(n => !n.read_status).length
            setUnreadCount(unread)
        }
        fetchNotifications()

        const dbInterval = setInterval(fetchNotifications, 60000) // Refresh DB every minute

        // Real-time news polling (every 2 minutes)
        let isPolling = false;
        const fetchLiveNews = async () => {
            if (isPolling || !user?.id) return;
            isPolling = true;
            try {
                const response = await fetch(`/api/agent/news-polling?userId=${user.id}`)
                if (!response.ok) return;

                const data = await response.json()
                if (data.notifications && data.notifications.length > 0) {
                    setNotifications(prev => {
                        // Create a map to ensure uniqueness by ID
                        const existingIds = new Set(prev.map(n => n.notification_id))
                        const newUnique = data.notifications.filter((n: Notification) => !existingIds.has(n.notification_id))
                        
                        if (newUnique.length === 0) return prev; // No actual new items

                        // Mark any as read if they match our local set
                        const processedNew = newUnique.map((n: Notification) => 
                            locallyReadIds.current.has(n.notification_id) ? { ...n, read_status: true } : n
                        )

                        // Update unread count based on actual new unique items that aren't already locally marked as read
                        const unreadNew = processedNew.filter((n: Notification) => !n.read_status).length
                        setUnreadCount(prevCount => prevCount + unreadNew)

                        // Combine, sort by date descending
                        const combined = [...processedNew, ...prev].sort((a, b) => {
                            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                            return dateB - dateA;
                        });

                        return combined;
                    })
                }
            } catch (error) {
                console.error('Failed to fetch live news stream:', error)
            } finally {
                isPolling = false;
            }
        }
        
        // Initial fetch for news
        fetchLiveNews()
        const newsInterval = setInterval(fetchLiveNews, 120000) // Live news every 2 min (mitigate API limits)

        return () => {
            clearInterval(dbInterval)
            clearInterval(newsInterval)
        }
    }, [user])

    const handleMarkAsRead = async (notificationId: string) => {
        // Optimistically update
        locallyReadIds.current.add(notificationId)
        setNotifications(prev => 
            prev.map(n => 
                n.notification_id === notificationId 
                    ? { ...n, read_status: true }
                    : n
            )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))

        try {
            await markNotificationAsRead(notificationId)
            toast.success('Notification marked as read')
        } catch (error) {
            // Revert
            locallyReadIds.current.delete(notificationId)
            setNotifications(prev => 
                prev.map(n => 
                    n.notification_id === notificationId 
                        ? { ...n, read_status: false }
                        : n
                )
            )
            setUnreadCount(prev => prev + 1)
            console.error('Failed to mark notification as read:', error)
            toast.error('Failed to mark notification as read')
        }
    }

    const handleMarkAllAsRead = async () => {
        if (!user?.id || isMarkingAll) return
        
        setIsMarkingAll(true)
        
        // Optimistically update
        const currentNotifications = [...notifications]
        const allIds = currentNotifications.map(n => n.notification_id)
        allIds.forEach(id => locallyReadIds.current.add(id))
        setNotifications(prev => prev.map(n => ({ ...n, read_status: true })))
        setUnreadCount(0)

        try {
            await markAllNotificationsAsRead(user.id)
            toast.success('All notifications marked as read')
        } catch (error) {
            // Revert
            allIds.forEach(id => locallyReadIds.current.delete(id))
            setNotifications(currentNotifications)
            const unread = currentNotifications.filter(n => !n.read_status).length
            setUnreadCount(unread)
            console.error('Failed to mark all notifications as read:', error)
            toast.error('Failed to mark all notifications as read')
        } finally {
            setIsMarkingAll(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-theme-bg-secondary border border-theme-border-subtle hover:bg-theme-bg-secondary/80 text-theme-text-primary transition-all duration-200 shrink-0 relative focus:outline-none focus:ring-2 focus:ring-theme-blue/50">
                    <BellIcon size={16} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] font-[700] bg-theme-blue text-white rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[32rem] bg-theme-bg-primary border-theme-border-subtle shadow-xl" asChild>
                <motion.div
                    variants={dropdownContent}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                >
                    <div className="flex items-center justify-between px-4 py-2">
                        <DropdownMenuLabel className="text-sm font-semibold p-0 text-theme-text-primary">Notifications</DropdownMenuLabel>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8 px-2 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary"
                                onClick={handleMarkAllAsRead}
                                disabled={isMarkingAll}
                            >
                                {isMarkingAll ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                    <CheckCheck className="w-3 h-3 mr-1" />
                                )}
                                Mark all read
                            </Button>
                        )}
                    </div>
                    <DropdownMenuSeparator className="bg-theme-border-subtle" />
                    <div className="max-h-96 overflow-auto">
                        {notifications.length > 0 ? (
                            notifications.map((n, index) => <NotificationItem key={n.notification_id || index} notification={n} onMarkAsRead={handleMarkAsRead} />)
                        ) : (
                            <motion.div variants={dropdownItem}>
                                <DropdownMenuItem disabled className="focus:bg-transparent">
                                    <div className="flex flex-col gap-1 w-full text-center py-6">
                                        <div className="text-sm text-theme-text-muted">
                                            No new notifications
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            </motion.div>
                        )}
                    </div>
                    <DropdownMenuSeparator className="bg-theme-border-subtle" />
                    <motion.div variants={dropdownItem}>
                        <DropdownMenuItem asChild className="cursor-pointer justify-center font-medium text-sm text-theme-blue focus:bg-theme-bg-secondary hover:bg-theme-bg-secondary outline-none">
                            <Link href="/news-room">
                                View real time alerts <ArrowRight className="ml-1 w-4 h-4" />
                            </Link>
                        </DropdownMenuItem>
                    </motion.div>
                </motion.div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 