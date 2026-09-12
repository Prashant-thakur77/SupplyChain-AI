"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, CheckCircle, Info, BellOff, X, ArrowRight, Plus, Route, MapPin, Package, Factory } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import Lottie from "lottie-react"
import comingSoonAnimation from "@/public/animations/coming-soon.json"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Import API functions and types
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api/notifications"
import { getUserSupplyChains } from "@/lib/api/supply-chain"
import { getUserData } from "@/utils/functions/userUtils"
import type { Tables } from "@/lib/types/database"

// Import local modules
import { INITIAL_DISPLAY_COUNT } from "./constants"
import { safeDateFormat, getNotificationType, getNotificationIcon, truncateMessage } from "./functions"
import { SourceBubble} from "./components"
import type { NotificationType, MainTab, Notification, NotificationCitations } from "./types"

export function NotificationFeed() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("alerts")
  const [showMore, setShowMore] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [user, setUser] = useState<Tables<'users'> | null>(null)
  const [supplyChains, setSupplyChains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [analyzingNews, setAnalyzingNews] = useState(false)
  const [newsAnalysisResults, setNewsAnalysisResults] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const { toast } = useToast()

  // Client-side set of IDs the user has marked read — survives re-fetches from the polling interval
  const locallyReadIds = useRef<Set<string>>(new Set())

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserData()
        setUser(userData)
        if (userData?.id) {
          const fetchedChains = await getUserSupplyChains(userData.id)
          setSupplyChains(fetchedChains?.data || [])
        }
      } catch (error) {
        console.error('Error fetching user or supply chains:', error)
      }
    }
    fetchUser()
  }, [])

  const supplyChainsRef = useRef(supplyChains);
  useEffect(() => {
    supplyChainsRef.current = supplyChains;
  }, [supplyChains]);

  // Fetch notifications
  useEffect(() => {
    if (!user?.id) return

    async function fetchNotifications() {
      if (!user?.id) return
      try {
        setLoading(true)
        const fetchedNotifications = await getNotifications(user.id)
        // Merge locally-marked-read IDs so polling never reverts optimistic state
        const merged = fetchedNotifications.map(n =>
          locallyReadIds.current.has(n.notification_id)
            ? { ...n, read_status: true }
            : n
        )
        setNotifications(merged)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        toast({
          title: "Error",
          description: "Failed to fetch notifications",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    // Real-time news polling 
    let isNewsPolling = false;
    const fetchLiveNews = async () => {
        if (isNewsPolling || !user?.id) return;
        isNewsPolling = true;
        try {
            const response = await fetch(`/api/agent/news-polling?userId=${user.id}`)
            if (!response.ok) return;

            const data = await response.json()
            if (data.notifications && data.notifications.length > 0) {
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.notification_id))
                    const newUnique = data.notifications.filter((n: Notification) => !existingIds.has(n.notification_id))
                    
                    if (newUnique.length === 0) return prev; 

                    const combined = [...newUnique, ...prev].sort((a, b) => {
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
            isNewsPolling = false;
        }
    }

    // Autonomous Threat Scanning — round-robin across ALL supply chains
    let isScanning = false;
    let scanIndex = 0; // tracks which supply chain to scan next
    const runThreatScans = async () => {
        const chains = supplyChainsRef.current;
        if (!user?.id || chains.length === 0 || isScanning) return;
        isScanning = true;
        
        try {
            // Round-robin: scan next supply chain in sequence
            const targetChain = chains[scanIndex % chains.length];
            scanIndex++;
            if (!targetChain) return;

            console.log(`[DASHBOARD-FEED] Triggering autonomous threat scan for SC ${scanIndex}/${chains.length}: ${targetChain.supply_chain_id}`);
            const res = await fetch(`/api/agent/automated-alerts?supplyChainId=${targetChain.supply_chain_id}&userId=${user.id}`);
            const data = await res.json();
            
            if (data.success && data.alertsGenerated > 0) {
               // A new threat was found — pull it into the feed immediately
               fetchNotifications();
            }
        } catch (error) {
            console.error('Background threat scan failed:', error)
        } finally {
            isScanning = false;
        }
    }

    // Weather Intelligence Scan — checks ALL nodes + transit route midpoints
    // Runs once on mount then every 3 hours (weather changes slowly)
    let isWeatherScanning = false;
    const runWeatherScan = async () => {
        if (!user?.id || isWeatherScanning) return;
        isWeatherScanning = true;
        try {
            console.log('[DASHBOARD-FEED] Running weather intelligence scan across all transit routes...');
            const res = await fetch('/api/agent/weather-intelligence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            const data = await res.json();
            if (data.success && data.adverseConditions > 0) {
                console.log(`[DASHBOARD-FEED] ${data.adverseConditions} adverse weather conditions found — refreshing notifications`);
                fetchNotifications();
            }
        } catch (error) {
            console.error('[DASHBOARD-FEED] Weather scan failed:', error);
        } finally {
            isWeatherScanning = false;
        }
    }

    fetchNotifications()
    fetchLiveNews()
    runWeatherScan() // Run once immediately on mount
    
    const dbInterval      = setInterval(fetchNotifications, 30000)   // Refresh DB every 30s
    const newsInterval    = setInterval(fetchLiveNews, 120000)        // Live news every 2 min
    const scanInterval    = setInterval(runThreatScans, 180000)       // Deep AI threat scan every 3 min
    const weatherInterval = setInterval(runWeatherScan, 3 * 60 * 60 * 1000) // Weather scan every 3 hours

    return () => {
        clearInterval(dbInterval)
        clearInterval(newsInterval)
        clearInterval(scanInterval)
        clearInterval(weatherInterval)
    }
  }, [user?.id]) // Removed toast and supplyChains to prevent infinite remounting of intervals

  // Fetch Audit Logs
  useEffect(() => {
    if (!user?.id || activeMainTab !== "activity") return;
    
    async function fetchAuditLogs() {
      try {
        setLoadingLogs(true)
        const res = await fetch(`/api/audit-logs?userId=${user?.id}`)
        if (res.ok) {
          const data = await res.json()
          setAuditLogs(data.logs || [])
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
      } finally {
        setLoadingLogs(false)
      }
    }
    
    fetchAuditLogs()
    const interval = setInterval(fetchAuditLogs, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [user?.id, activeMainTab])

  const handleMarkAsRead = async (id: string) => {
    // Optimistically mark read in UI immediately
    locallyReadIds.current.add(id)
    setNotifications(prev => prev.map(n =>
      n.notification_id === id ? { ...n, read_status: true } : n
    ))
    try {
      await markNotificationAsRead(id)
    } catch (error) {
      // Revert on failure
      locallyReadIds.current.delete(id)
      setNotifications(prev => prev.map(n =>
        n.notification_id === id ? { ...n, read_status: false } : n
      ))
      console.error('Error marking notification as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    // Optimistically mark all read in UI immediately
    const allIds = notifications.map(n => n.notification_id)
    allIds.forEach(id => locallyReadIds.current.add(id))
    setNotifications(prev => prev.map(n => ({ ...n, read_status: true })))
    try {
      await markAllNotificationsAsRead(user.id)
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      // Revert on failure
      allIds.forEach(id => locallyReadIds.current.delete(id))
      setNotifications(prev => prev.map(n => ({ ...n, read_status: false })))
      console.error('Error marking all notifications as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      })
    }
  }

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification)
    setNewsAnalysisResults([]) // Clear previous analysis when opening new modal
    setDialogOpen(true)
  }

  const handleAnalyzeNewsImpact = async () => {
    if (!selectedNotification || supplyChains.length === 0) return;
    
    setAnalyzingNews(true);
    setNewsAnalysisResults([]); // Reset
    
    try {
        const results = [];
        
        // Run against first 3 supply chains to avoid rate limits
        const targets = supplyChains.slice(0, 3);
        
        for (const chain of targets) {
            try {
                console.log(`[IMPACT] Creating simulation for SC: ${chain.supply_chain_id}`);
                
                // 1. Create the simulation scenario from the news
                const simRes = await fetch('/api/agent/news-simulation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        notificationId: selectedNotification.notification_id,
                        supplyChainId: chain.supply_chain_id,
                        notification: selectedNotification
                    })
                });

                if (!simRes.ok) {
                    const errData = await simRes.json().catch(() => ({}));
                    console.error(`[IMPACT] Simulation creation failed for ${chain.supply_chain_id}:`, errData);
                    results.push({
                        supplyChainName: chain.name || 'Supply Chain',
                        error: errData.error || `Simulation failed (HTTP ${simRes.status})`
                    });
                    continue;
                }

                const simData = await simRes.json();
                console.log(`[IMPACT] Simulation created:`, simData);
                
                if (!simData.success || !simData.simulation_id) {
                    results.push({
                        supplyChainName: chain.name || 'Supply Chain',
                        error: simData.error || "Failed to create simulation from news"
                    });
                    continue;
                }

                // 2. Run the impact agent against this new simulation
                console.log(`[IMPACT] Running impact analysis for simulation: ${simData.simulation_id}`);
                const impactRes = await fetch('/api/agent/impact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        simulationId: simData.simulation_id,
                        supplyChainId: chain.supply_chain_id,
                        forceRefresh: true
                    })
                });

                if (!impactRes.ok) {
                    const errData = await impactRes.json().catch(() => ({}));
                    console.error(`[IMPACT] Impact analysis failed:`, errData);
                    results.push({
                        supplyChainName: chain.name || 'Supply Chain',
                        simulation_id: simData.simulation_id,
                        error: errData.error || `Impact analysis failed (HTTP ${impactRes.status})`
                    });
                    continue;
                }

                const impactData = await impactRes.json();
                const analysis = impactData.data;

                results.push({
                    supplyChainName: chain.name || 'Supply Chain',
                    chain_id: chain.supply_chain_id,
                    simulation_id: simData.simulation_id,
                    impactMetrics: analysis?.metrics || null,
                    cascadingEffects: analysis?.cascadingEffects || [],
                    keyFindings: analysis?.keyFindings || [],
                    error: impactData.error || null
                });

            } catch (chainErr: any) {
                console.error(`[IMPACT] Chain error for ${chain.supply_chain_id}:`, chainErr);
                results.push({
                    supplyChainName: chain.name || 'Supply Chain',
                    error: chainErr.message || 'Unexpected error during analysis'
                });
            }
        }
        
        setNewsAnalysisResults(results);
        
    } catch (error) {
        console.error("Failed to analyze news impact:", error);
        toast({
            title: "Analysis Failed",
            description: "An error occurred while running the AI simulation.",
            variant: "destructive"
        })
    } finally {
        setAnalyzingNews(false);
    }
  }

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-black dark:text-white" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      case "info":
        return <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-black dark:text-white" />
    }
  }

  const renderNotificationIcon = (notification: Notification) => {
    const iconData = getNotificationIcon(notification)
    
    switch (iconData.type) {
      case 'route':
        return <Route className={iconData.className} />
      case 'factory':
        return <Factory className={iconData.className} />
      default:
        return <Package className={iconData.className} />
    }
  }

  const renderNotificationList = () => {
    const filteredNotifications = notifications.filter(n => 
      activeMainTab === "alerts" ? n.notification_type !== 'live_news_alert' : n.notification_type === 'live_news_alert'
    )

    const displayNotifications = showMore 
      ? filteredNotifications 
      : filteredNotifications.slice(0, INITIAL_DISPLAY_COUNT)
    
    const hasMoreNotifications = filteredNotifications.length > INITIAL_DISPLAY_COUNT
    const unreadCount = filteredNotifications.filter(n => !n.read_status).length

    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-4 bg-white dark:bg-gray-900 shadow-sm animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground">
              {activeMainTab === "alerts" ? "Threat Alerts" : "Live News"}
            </h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground border-none text-xs rounded-full">
                {unreadCount} new
              </Badge>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            disabled={unreadCount === 0}
          >
            <BellOff className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          <AnimatePresence>
            {displayNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400"
              >
                <BellOff className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">No notifications to display</p>
              </motion.div>
            ) : (
              displayNotifications.map((notification, index) => {
                const type = getNotificationType(notification)
                const citations = notification.citations as NotificationCitations | null
                const isRead = notification.read_status || false
                const truncatedMessage = truncateMessage(notification.message)

                return (
                  <motion.div
                    key={notification.notification_id || index}
                    className={cn(
                      "relative pl-7 py-4 pr-5 border rounded-theme-md transition-all duration-200 cursor-pointer flex flex-col mb-2",
                      isRead 
                        ? "bg-theme-bg-surface/50 border-theme-border-subtle/50 opacity-60" 
                        : "bg-theme-bg-surface border-theme-border-subtle hover:bg-theme-bg-secondary hover:border-theme-border-default hover:shadow-md"
                    )}
                    onClick={() => handleViewDetails(notification)}
                  >
                    {/* Left accent bar */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-[3px]",
                      isRead ? "bg-theme-text-muted/30" : (
                        notification.severity === 'HIGH' 
                          ? "bg-theme-red" 
                          : notification.severity === 'MEDIUM'
                          ? "bg-theme-amber"
                          : "bg-theme-blue"
                      )
                    )} />
                    {/* Main content */}
                    <div className="flex items-start gap-4 mb-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="rounded-full p-2 bg-theme-bg-secondary">
                          {renderNotificationIcon(notification)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-[600] text-theme-text-primary text-[0.88rem] leading-[1.4]">{notification.title}</p>
                            {/* Visual indicator for Live News */}
                            {notification.notification_type === 'live_news_alert' && (
                                <div className="inline-flex items-center gap-1.5 px-[8px] py-[2px] rounded-theme-pill bg-theme-blue-soft border border-theme-blue/20 text-theme-blue text-[0.65rem] font-[700] tracking-[0.05em] uppercase w-fit shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-theme-blue animate-pulse"></div>
                                    Live News
                                </div>
                            )}
                            {!isRead && (
                              <span className="h-2 w-2 rounded-full bg-theme-blue flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notification.severity && (
                              <span className={cn(
                                "text-[0.65rem] font-[700] tracking-[0.05em] py-[2px] px-[8px] rounded-theme-pill border border-transparent",
                                notification.severity === 'HIGH' 
                                  ? 'bg-theme-red/10 text-theme-red' 
                                  : notification.severity === 'MEDIUM'
                                  ? 'bg-theme-bg-secondary text-theme-text-secondary'
                                  : 'bg-theme-blue-soft text-theme-blue'
                              )}>
                                {notification.severity}
                              </span>
                            )}
                            {!isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full hover:bg-theme-bg-secondary text-theme-text-secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.notification_id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {truncatedMessage && (
                          <p className="text-sm text-theme-text-secondary leading-relaxed mb-3 line-clamp-2">{truncatedMessage}</p>
                        )}

                        {/* Simplified metadata row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type)}
                            <p className="text-xs text-theme-text-muted">
                              {notification.created_at && safeDateFormat(notification.created_at) || "Unknown time"}
                            </p>
                            
                            {/* Show source count if available */}
                            {(() => {
                              const citations = notification.citations as NotificationCitations | null
                              const sourceCount = citations?.sources?.length || 0
                              const entityCount = citations?.affectedEntities?.length || 0
                              const relationshipCount = citations?.relationships?.length || 0
                              
                              if (sourceCount > 0 || entityCount > 0 || relationshipCount > 0) {
                                return (
                                  <div className="flex items-center gap-1 text-xs text-theme-text-muted">
                                    <span>•</span>
                                    {sourceCount > 0 && <span>{sourceCount} sources</span>}
                                    {entityCount > 0 && sourceCount > 0 && <span>•</span>}
                                    {entityCount > 0 && <span>{entityCount} entities</span>}
                                    {relationshipCount > 0 && (sourceCount > 0 || entityCount > 0) && <span>•</span>}
                                    {relationshipCount > 0 && <span>{relationshipCount} risks</span>}
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </div>
                          
                          <button
                            className="h-7 px-2 text-[0.78rem] text-theme-blue font-[500] hover:text-theme-blue/80 transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(notification)
                            }}
                          >
                            View Details
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sources - clean layout */}
                    {(() => {
                      const citations = notification.citations as NotificationCitations | null
                      if (citations?.sources && citations.sources.length > 0) {
                        return (
                          <div className="mt-3 pt-3 border-t border-theme-border-subtle">
                            <div className="flex flex-wrap gap-2">
                              {/* Show first 2 sources */}
                              {citations.sources.slice(0, 2).map((source, idx) => (
                                <SourceBubble key={idx} source={source} />
                              ))}
                              {/* Show count if more than 2 sources */}
                              {citations.sources.length > 2 && (
                                <div className="inline-flex items-center px-[8px] py-[3px] rounded-theme-sm border border-theme-border-subtle bg-theme-bg-secondary text-[0.72rem] text-theme-text-secondary">
                                  +{citations.sources.length - 2} more sources
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* Show More Button */}
        {hasMoreNotifications && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {showMore ? (
                <span>Show Less</span>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Show {filteredNotifications.length - INITIAL_DISPLAY_COUNT} More</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderAuditLogs = () => {
    if (loadingLogs && auditLogs.length === 0) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-4 bg-white dark:bg-gray-900 shadow-sm animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (auditLogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
          <Info className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm">No recent activity found.</p>
        </div>
      )
    }

    return (
      <div className="relative border-l border-theme-border-subtle ml-4 space-y-6 pb-4">
        {auditLogs.map((log) => {
          const isError = log.details?.status === 'error';
          const isSuccess = log.details?.status === 'success';
          const isStart = log.details?.status === 'started';
          
          return (
            <div key={log.log_id} className="relative pl-6">
              {/* Timeline Dot */}
              <div className={cn(
                "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900",
                isError ? "bg-theme-red" : isStart ? "bg-theme-blue animate-pulse" : "bg-theme-green"
              )} />
              
              <div className="bg-theme-bg-surface border border-theme-border-subtle rounded-theme-md p-3 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-theme-text-muted">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[0.65rem] text-theme-text-muted">
                    {safeDateFormat(log.timestamp)}
                  </span>
                </div>
                <p className={cn(
                  "text-sm", 
                  isError ? "text-theme-red font-medium" : "text-theme-text-primary"
                )}>
                  {log.details?.summary || 'Activity recorded'}
                </p>
                {log.details?.agent && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-theme-bg-secondary text-[0.65rem] text-theme-text-secondary border border-theme-border-subtle">
                    <Factory className="h-3 w-3" />
                    {log.details.agent}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Main Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="bg-theme-bg-secondary border border-theme-border-subtle rounded-theme-pill p-[3px] flex flex-wrap gap-1 w-fit sm:space-x-1">
          {[
            { id: "alerts" as MainTab, label: "Threat Alerts" },
            { id: "news" as MainTab, label: "Live News" },
            { id: "activity" as MainTab, label: "Recent Activity" },
          ].map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`relative px-[16px] py-[6px] rounded-theme-pill text-[0.82rem] font-[600] transition-colors duration-200 ${
                activeMainTab === tab.id
                  ? "bg-theme-text-primary text-theme-bg-primary"
                  : "text-theme-text-muted hover:text-theme-text-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>
        <Link 
          href="/news-room" 
          className="text-[0.82rem] text-theme-blue font-[500] hover:text-theme-blue/80 hover:underline underline-offset-4 transition-colors flex items-center gap-1 w-fit"
        >
          View Real-Time Alerts
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {(activeMainTab === "alerts" || activeMainTab === "news") && (
          <motion.div
            key={activeMainTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            {renderNotificationList()}
          </motion.div>
        )}
        {activeMainTab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
            className="h-full pr-2"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Audit & System Activity</h3>
              <div className="flex items-center gap-4 text-[0.7rem] text-theme-text-muted font-medium bg-theme-bg-surface px-3 py-1.5 rounded-full border border-theme-border-subtle">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-theme-blue animate-pulse"></span> Started
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-theme-green"></span> Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-theme-red"></span> Error
                </span>
              </div>
            </div>
            {renderAuditLogs()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-theme-bg-glass backdrop-blur-[16px] saturate-[180%] border border-theme-border-subtle/50 shadow-lg">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-full p-1.5 bg-theme-bg-secondary">
                    {renderNotificationIcon(selectedNotification)}
                  </div>
                  <DialogTitle className="text-lg font-semibold text-theme-text-primary">{selectedNotification.title}</DialogTitle>
                  {selectedNotification.severity && (
                    <span className={cn(
                      "text-[0.65rem] font-[700] tracking-[0.05em] py-[2px] px-[8px] rounded-theme-pill border border-transparent",
                      selectedNotification.severity === 'HIGH' 
                        ? 'bg-theme-red/10 text-theme-red' 
                        : selectedNotification.severity === 'MEDIUM'
                        ? 'bg-theme-bg-secondary text-theme-text-secondary'
                        : 'bg-theme-blue-soft text-theme-blue'
                    )}>
                      {selectedNotification.severity}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-theme-text-muted">
                  {getTypeIcon(getNotificationType(selectedNotification))}
                  <span>{selectedNotification.created_at && safeDateFormat(selectedNotification.created_at) || "Unknown time"}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedNotification.notification_type?.replace('_', ' ')}</span>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Full Message */}
                {selectedNotification.message && (
                  <div>
                    <h4 className="font-[600] text-theme-text-primary mb-2">Details</h4>
                    <div className="bg-theme-bg-secondary/40 border border-theme-border-subtle rounded-theme-md p-4">
                      <p className="text-sm text-theme-text-secondary leading-relaxed whitespace-pre-wrap">
                        {selectedNotification.message}
                      </p>
                    </div>
                  </div>
                )}

                {(() => {
                  const citations = selectedNotification.citations as NotificationCitations | null
                  
                  return (
                    <>
                      {/* Sources */}
                      {citations?.sources && citations.sources.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Sources ({citations.sources.length})</h4>
                          <div className="space-y-2">
                            {citations.sources.map((source, idx) => (
                              <SourceBubble key={idx} source={source} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk Relationships */}
                      {citations?.relationships && citations.relationships.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Risk Relationships ({citations.relationships.length})</h4>
                          <div className="space-y-3">
                            {citations.relationships.map((relationship, idx) => (
                              <div key={idx} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full"></div>
                                  <span className="font-medium text-black dark:text-white text-sm">
                                    {Math.round(relationship.strength * 100)}% Impact Strength
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{relationship.source}</span>
                                  <span className="mx-2 text-gray-500">→</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{relationship.target}</span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Impact: {relationship.relationship}
                                </div>
                                {relationship.context && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Context: {relationship.context}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Affected Entities */}
                      {citations?.affectedEntities && citations.affectedEntities.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Affected Entities ({citations.affectedEntities.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {citations.affectedEntities.map((entity, idx) => (
                              <div key={idx} className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-md border border-gray-200 dark:border-gray-700">
                                <MapPin className="w-3 h-3 mr-1" />
                                {entity}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Details */}
                      {citations && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Additional Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {citations.category && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</div>
                                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 capitalize">{citations.category.toLowerCase()}</div>
                              </div>
                            )}
                            {citations.confidence && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Confidence</div>
                                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">{Math.round(citations.confidence * 100)}%</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* --- AI IMPACT ANALYSIS SECTION --- */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                   <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                       AI Impact Simulation
                   </h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                       Run this real-world event as a scenario against your supply chains to quantify the potential financial and operational fallout.
                   </p>
                   
                   {newsAnalysisResults.length === 0 && !analyzingNews && (
                       <Button 
                           onClick={handleAnalyzeNewsImpact} 
                           disabled={supplyChains.length === 0}
                           className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                       >
                           {supplyChains.length === 0 ? "No Active Supply Chains" : "Analyze Impact on My Supply Chains"}
                       </Button>
                   )}
                   
                   {analyzingNews && (
                       <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                           <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                           <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Running Multi-Agent Simulation...</p>
                           <p className="text-xs text-gray-500 text-center">Converting news context to scenario parameters and calculating network cascading effects.</p>
                       </div>
                   )}
                   
                   {newsAnalysisResults.length > 0 && !analyzingNews && (
                       <div className="space-y-4">
                           {newsAnalysisResults.map((res, idx) => (
                               <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
                                   <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                                       <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{res.supplyChainName}</h5>
                                       {res.error ? (
                                           <Badge variant="destructive" className="text-[10px]">Error</Badge>
                                       ) : (
                                           <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Analysis Complete</Badge>
                                       )}
                                   </div>
                                   
                                    {res.error ? (
                                        <p className="text-xs text-red-500 font-medium">{res.error}</p>
                                    ) : res.impactMetrics ? (
                                        <div className="space-y-5">
                                            {/* Primary Metrics */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-md border border-gray-100 dark:border-gray-700">
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-bold">Total Cost</p>
                                                    <p className="text-sm font-bold text-red-600 dark:text-red-400">{res.impactMetrics.totalCostImpact}</p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-md border border-gray-100 dark:border-gray-700">
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-bold">Delay</p>
                                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{res.impactMetrics.averageDelay}</p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-md border border-gray-100 dark:border-gray-700">
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-bold">Resilience</p>
                                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{res.impactMetrics.networkResilience}/100</p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-md border border-gray-100 dark:border-gray-700">
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-bold">Recovery</p>
                                                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{res.impactMetrics.recoveryTime}</p>
                                                </div>
                                            </div>

                                            {/* Node Specific Impact */}
                                            {res.cascadingEffects && res.cascadingEffects.length > 0 && (
                                                <div className="space-y-2">
                                                    <h6 className="text-[11px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 text-red-500" />
                                                        Primary Node Impact
                                                    </h6>
                                                    <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{res.cascadingEffects[0].affectedNode}</p>
                                                            <Badge className="text-[9px] h-4 bg-red-600 dark:bg-red-500 text-white border-none">{res.cascadingEffects[0].severity}</Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold">Direct Financial Hit</p>
                                                                <p className="text-xs font-semibold text-red-700 dark:text-red-400">{res.cascadingEffects[0].financialImpact}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold">Timeline</p>
                                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{res.cascadingEffects[0].timeline}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Key Findings */}
                                            {res.keyFindings && res.keyFindings.length > 0 && (
                                                <div className="space-y-2">
                                                    <h6 className="text-[11px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Strategic Findings</h6>
                                                    <ul className="space-y-1.5">
                                                        {res.keyFindings.slice(0, 3).map((finding: string, idx: number) => (
                                                            <li key={idx} className="text-[11px] text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                                <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 shrink-0"></span>
                                                                {finding}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">No impact metrics generated.</p>
                                    )}

                               </div>
                           ))}
                       </div>
                   )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Notification ID: {selectedNotification.notification_id}
                  </div>
                  {!selectedNotification.read_status && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleMarkAsRead(selectedNotification.notification_id)
                        setDialogOpen(false)
                      }}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
