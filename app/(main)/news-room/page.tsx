"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { Search, Filter, Calendar, MapPin, AlertTriangle, Clock, TrendingUp, Workflow } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow, format } from 'date-fns'
import { NewsRoomHeader, TimelineEventCard, AlertDetailsSheet } from '@/components/news-room'
import {
  TimelineBatch,
  SupplyChainTimelineData,
  ExtendedCriticalEvent,
} from '../../../components/news-room/types'
import { useUser } from '@/lib/stores/user'
import { getNewsRoomInfo } from '@/lib/api/supply-chain'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getCategoryIcon,
  formatTimeAgo,
} from '@/components/news-room/utils'

const LOCAL_STORAGE_KEY = 'newsRoomLastAlertCount';

// Types for supply chain data

const TimelineSkeleton = () => (
  <div className="space-y-8">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="relative">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="ml-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="p-4 rounded-lg border border-gray-200/50 dark:border-slate-700/50 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function NewsRoomPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['HIGH', 'CRITICAL'])
  const [selectedSupplyChains, setSelectedSupplyChains] = useState<string[]>([])
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedEvent, setSelectedEvent] = useState<ExtendedCriticalEvent | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [newAlertCount, setNewAlertCount] = useState(0)

  const [newsRoomData, setNewsRoomData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { userData } = useUser()

  useEffect(() => {
    const fetchData = async () => {
      if (userData?.id) {
        setIsLoading(true)
        setError(null)
        try {
          const data = await getNewsRoomInfo(userData.id)
          setNewsRoomData(data)
        } catch (err) {
          setError('Failed to fetch news room data.')
          console.error(err)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    if (userData) {
      fetchData()
    }
  }, [userData])

  // Process supply chain data into timeline format
  const timelineData = useMemo(() => {
    if (!newsRoomData) {
      return []
    }
    const allData = newsRoomData as any
    const processedData: SupplyChainTimelineData[] = []
    
    Object.entries(allData).forEach(([key, chainArray]: [string, any]) => {
      if (Array.isArray(chainArray)) {
        const supplyChainName = key.split('_')[0] || key
        const supplyChainId = key
        
        processedData.push({
          supplyChainName,
          supplyChainId,
          batches: chainArray.sort((a, b) => 
            new Date(b.batchTimestamp).getTime() - new Date(a.batchTimestamp).getTime()
          )
        })
      }
    })
    
    return processedData
  }, [newsRoomData])

  // Extract all timeline entries and flatten them
  const allTimelineEntries = useMemo(() => {
    const entries: Array<{
      supplyChainName: string
      supplyChainId: string
      batch: TimelineBatch
      events: ExtendedCriticalEvent[]
    }> = []
    
    timelineData.forEach(({ supplyChainName, supplyChainId, batches }) => {
      batches.forEach(batch => {
        const events: ExtendedCriticalEvent[] = []
        
        batch.nodes.forEach(node => {
          if (node.criticalEvents) {
            node.criticalEvents.forEach((event, index) => {
              events.push({
                ...event,
                id: `${node.nodeId}-${index}-${batch.batchTimestamp}`,
                nodeName: node.nodeName,
                location: node.weather?.forecast?.location || 'Unknown',
                supplyChainName,
                batchTimestamp: batch.batchTimestamp
              })
            })
          }
        })
        
        entries.push({
          supplyChainName,
          supplyChainId,
          batch,
          events
        })
      })
    })
    
    const now = new Date().getTime()
    return entries.sort((a, b) => {
      const timeA = new Date(a.batch.batchTimestamp).getTime()
      const timeB = new Date(b.batch.batchTimestamp).getTime()
      const aIsPast = timeA <= now
      const bIsPast = timeB <= now

      if (aIsPast && !bIsPast) return -1 // a is past, b is future -> a comes first
      if (!aIsPast && bIsPast) return 1  // a is future, b is past -> b comes first

      if (aIsPast) { // Both are past
        return timeB - timeA // Sort descending (most recent first)
      } else { // Both are future
        return timeA - timeB // Sort ascending (soonest first)
      }
    })
  }, [timelineData])

  const totalAlerts = useMemo(() => {
    return allTimelineEntries.reduce((acc, entry) => acc + entry.events.length, 0)
  }, [allTimelineEntries])

  useEffect(() => {
    if (!isLoading && newsRoomData) {
      const lastSeenTotalStr = localStorage.getItem(LOCAL_STORAGE_KEY);
      const lastSeenTotal = lastSeenTotalStr ? parseInt(lastSeenTotalStr, 10) : 0;
      
      if (lastSeenTotal > 0) {
        const newCount = totalAlerts - lastSeenTotal;
        setNewAlertCount(Math.max(0, newCount));
      } else {
        // On the first visit (or if the last count was 0), we don't show any new alerts.
        // The new baseline will be set when the user navigates away.
        setNewAlertCount(0);
      }
    }
  }, [totalAlerts, isLoading, newsRoomData]);

  // Update localStorage when the component unmounts
  useEffect(() => {
    return () => {
      if (totalAlerts > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, totalAlerts.toString());
      }
    };
  }, [totalAlerts]);

  // Filter timeline entries based on time filter
  const filteredTimelineEntries = useMemo(() => {
    return allTimelineEntries.filter(entry => {
      const batchDate = new Date(entry.batch.batchTimestamp)
      const now = new Date()
      
      switch (timelineFilter) {
        case 'today':
          return batchDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return batchDate >= weekAgo
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return batchDate >= monthAgo
        default:
          return true
      }
    }).filter(entry => {
      // Apply search and filter logic
      if (selectedSupplyChains.length > 0 && !selectedSupplyChains.includes(entry.supplyChainName)) {
        return false
      }
      
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSupplyChain = entry.supplyChainName.toLowerCase().includes(searchLower)
        const matchesEvents = entry.events.some(event =>
          event.title.toLowerCase().includes(searchLower) ||
          event.summary.toLowerCase().includes(searchLower) ||
          event.nodeName.toLowerCase().includes(searchLower)
        )
        return matchesSupplyChain || matchesEvents
      }
      
      if (selectedCategories.length > 0 || selectedImpacts.length > 0) {
        return entry.events.some(event => {
          const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category)
          const matchesImpact = selectedImpacts.length === 0 || selectedImpacts.includes(event.impact)
          return matchesCategory && matchesImpact
        })
      }
      
      return true
    })
  }, [allTimelineEntries, timelineFilter, selectedSupplyChains, searchQuery, selectedCategories, selectedImpacts])

  // Extract unique supply chains for filter
  const uniqueSupplyChains = useMemo(() => {
    return Array.from(new Set(timelineData.map(data => data.supplyChainName)))
  }, [timelineData])

  const handleCardClick = (event: ExtendedCriticalEvent) => {
    setSelectedEvent(event)
    setIsSheetOpen(true)
  }

  const categories = ['WEATHER', 'GEOPOLITICAL', 'OPERATIONAL', 'ECONOMIC']
  const impacts = ['HIGH', 'MEDIUM', 'LOW']

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

  return (
    <div className="relative min-h-full flex-1 bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 dark:from-gray-900 dark:to-slate-900 overflow-x-hidden">
      {/* Enhanced background blurred elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-900 dark:to-pink-900 opacity-30 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 dark:from-blue-900 dark:to-cyan-900 opacity-25 blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 dark:from-emerald-900 dark:to-teal-900 opacity-20 blur-2xl"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 dark:from-orange-900 dark:to-amber-900 opacity-15 blur-3xl animate-pulse"></div>
      
      {/* Header */}
      <NewsRoomHeader 
        alertCount={newAlertCount} 
      />

      {/* Search and Filters */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search supply chains, alerts, or nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/60 dark:bg-slate-900/20 border-white/20 dark:border-slate-700/20 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-sm"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Time Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/20 backdrop-blur-sm text-gray-700 dark:text-gray-200 shadow-sm">
                  <Clock className="h-4 w-4" />
                  {timelineFilter === 'all' && 'All Time'}
                  {timelineFilter === 'today' && 'Today'}
                  {timelineFilter === 'week' && 'This Week'}
                  {timelineFilter === 'month' && 'This Month'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20 dark:border-slate-700/20">
                <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">Filter by Time</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                {[
                  { key: 'all', label: 'All Time', icon: TrendingUp },
                  { key: 'today', label: 'Today', icon: Clock },
                  { key: 'week', label: 'This Week', icon: Calendar },
                  { key: 'month', label: 'This Month', icon: Calendar }
                ].map(({ key, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setTimelineFilter(key as any)}
                    className={`cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 ${
                      timelineFilter === key ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : ''
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Supply Chain Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/20 backdrop-blur-sm text-gray-700 dark:text-gray-200 shadow-sm">
                  <Filter className="h-4 w-4" />
                  Supply Chain
                  {selectedSupplyChains.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {selectedSupplyChains.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20 dark:border-slate-700/20">
                <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">Filter by Supply Chain</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                {uniqueSupplyChains.map((chainName) => (
                  <DropdownMenuCheckboxItem
                    key={chainName}
                    checked={selectedSupplyChains.includes(chainName)}
                    onCheckedChange={(checked) => {
                      setSelectedSupplyChains(prev => 
                        checked 
                          ? [...prev, chainName]
                          : prev.filter(c => c !== chainName)
                      )
                    }}
                    className="text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/50"
                  >
                    {chainName}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/20 backdrop-blur-sm text-gray-700 dark:text-gray-200 shadow-sm">
                  <Filter className="h-4 w-4" />
                  Category
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20 dark:border-slate-700/20">
                <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(prev => 
                        checked 
                          ? [...prev, category]
                          : prev.filter(c => c !== category)
                      )
                    }}
                    className="text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/50"
                  >
                    <span className="mr-2">{getCategoryIcon(category)}</span>
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Impact Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/20 backdrop-blur-sm text-gray-700 dark:text-gray-200 shadow-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Impact
                  {selectedImpacts.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {selectedImpacts.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20 dark:border-slate-700/20">
                <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">Filter by Impact</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                {impacts.map((impact) => (
                  <DropdownMenuCheckboxItem
                    key={impact}
                    checked={selectedImpacts.includes(impact)}
                    onCheckedChange={(checked) => {
                      setSelectedImpacts(prev => 
                        checked 
                          ? [...prev, impact]
                          : prev.filter(i => i !== impact)
                      )
                    }}
                    className="text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/50"
                  >
                    {impact} Impact
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <TimelineSkeleton />
        ) : error ? (
           <div className="text-center py-12">
            <div className="h-12 w-12 text-red-400 dark:text-red-600 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error loading data</h3>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        ) : (
        <div className="space-y-8">
          {filteredTimelineEntries.map((entry, index) => {
            const entryId = `${entry.supplyChainId}-${entry.batch.batchTimestamp}`
            const isExpanded = expandedEntries.has(entryId)
            const maxCollapsedCards = 2
            const hasMoreCards = entry.events.length > maxCollapsedCards
            const visibleEvents = isExpanded ? entry.events : entry.events.slice(0, maxCollapsedCards)
            const hiddenEventsCount = entry.events.length - maxCollapsedCards

            return (
              <motion.div
                key={entryId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Timeline Connector */}
                {index > 0 && (
                  <div className="absolute left-6 -top-4 w-0.5 h-4 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600"></div>
                )}
                
                {/* Timeline Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {entry.supplyChainName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(entry.batch.batchTimestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(entry.batch.batchTimestamp), 'PPp')}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {entry.events.length} alerts
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Timeline Content */}
                {entry.events.length > 0 ? (
                  <div className="ml-16 space-y-4">
                    {/* Visible Events Grid */}
                    <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence>
                        {visibleEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            <TimelineEventCard
                              event={event}
                              onClick={handleCardClick}
                              isCollapsed={!isExpanded}
                            />
                          </motion.div>
                        ))}
                        {!isExpanded && hasMoreCards && (
                          <motion.div
                            key="show-more"
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => toggleEntryExpansion(entryId)}
                            className="relative cursor-pointer group rounded-lg h-full min-h-[160px] "
                          >
                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-700/20 rounded-lg transform-gpu transition-transform duration-300 group-hover:scale-105 blur-sm" style={{ transform: 'rotate(6deg)' }}></div>
                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-700/20 rounded-lg transform-gpu transition-transform duration-300 group-hover:scale-105" style={{ transform: 'rotate(2deg)' }}></div>
                            <div className="relative w-full h-full p-4 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md rounded-lg border border-gray-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center text-center">
                              <h4 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                                Show All
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                ({hiddenEventsCount} more)
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Show All / Show Less Button */}
                    {hasMoreCards && (
                      <div className="flex justify-center pt-2">
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                            >
                              <Button
                                variant="outline"
                                onClick={() => toggleEntryExpansion(entryId)}
                                className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/20 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-200 shadow-md"
                              >
                                <motion.div
                                  initial={false}
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  className="mr-2"
                                >
                                  ▼
                                </motion.div>
                                Show Less
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ml-16 text-center py-8">
                    <div className="text-gray-400 dark:text-gray-600 mb-2">📊</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No critical events in this batch</p>
                  </div>
                )}

                {/* Timeline Spacer */}
                {index < filteredTimelineEntries.length - 1 && (
                  <div className="mt-8 border-b border-gray-200/50 dark:border-gray-700/50"></div>
                )}
              </motion.div>
            )
          })}
        </div>
        )}

        {!isLoading && !error && filteredTimelineEntries.length === 0 && (
          <div className="text-center py-12">
            <div className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4 flex items-center justify-center">
              📋
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No timeline entries found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Alert Details Sheet */}
      <AlertDetailsSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        event={selectedEvent}
      />
    </div>
  )
}
