"use client"

import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { 
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
  BookOpen,
  MessageSquare,
  FileCode,
  Package,
  Code2,
  Globe,
  Newspaper,
  Bookmark,
  Server,
  Zap,
  Coffee,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { AlertDetailsSheetProps, ExtendedCriticalEvent } from '@/components/news-room/types'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TextShimmer } from '@/components/ui/text-shimmer'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  getCategoryIcon,
  getSeverityColor,
  getImpactColor,
  formatTimeAgo,
} from './utils'

const siteIcons: Record<string, React.ReactNode> = {
  "github.com": <Github className="w-3.5 h-3.5" />,
  "twitter.com": <Twitter className="w-3.5 h-3.5" />,
  "x.com": <Twitter className="w-3.5 h-3.5" />,
  "linkedin.com": <Linkedin className="w-3.5 h-3.5" />,
  "youtube.com": <Youtube className="w-3.5 h-3.5" />,
  "youtu.be": <Youtube className="w-3.5 h-3.5" />,
  "facebook.com": <Facebook className="w-3.5 h-3.5" />,
  "fb.com": <Facebook className="w-3.5 h-3.5" />,
  "instagram.com": <Instagram className="w-3.5 h-3.5" />,
  "medium.com": <BookOpen className="w-3.5 h-3.5" />,
  "stackoverflow.com": <MessageSquare className="w-3.5 h-3.5" />,
  "reddit.com": <MessageSquare className="w-3.5 h-3.5" />,
  "news.ycombinator.com": <Newspaper className="w-3.5 h-3.5" />,
  "npmjs.com": <Package className="w-3.5 h-3.5" />,
  "vercel.com": <Zap className="w-3.5 h-3.5" />,
  "nextjs.org": <Zap className="w-3.5 h-3.5" />,
  "reactjs.org": <Code2 className="w-3.5 h-3.5" />,
  "react.dev": <Code2 className="w-3.5 h-3.5" />,
  "developer.mozilla.org": <FileCode className="w-3.5 h-3.5" />,
  "mdn.dev": <FileCode className="w-3.5 h-3.5" />,
  "docs.microsoft.com": <FileCode className="w-3.5 h-3.5" />,
  "aws.amazon.com": <Server className="w-3.5 h-3.5" />,
  "cloud.google.com": <Server className="w-3.5 h-3.5" />,
  "azure.microsoft.com": <Server className="w-3.5 h-3.5" />,
  "digitalocean.com": <Server className="w-3.5 h-3.5" />,
  "dev.to": <Code2 className="w-3.5 h-3.5" />,
  "hashnode.com": <Bookmark className="w-3.5 h-3.5" />,
  "codepen.io": <Code2 className="w-3.5 h-3.5" />,
  "codesandbox.io": <Code2 className="w-3.5 h-3.5" />,
  "stackblitz.com": <Code2 className="w-3.5 h-3.5" />,
  "replit.com": <Code2 className="w-3.5 h-3.5" />,
  "kaggle.com": <FileCode className="w-3.5 h-3.5" />,
  "huggingface.co": <FileCode className="w-3.5 h-3.5" />,
  "buymeacoffee.com": <Coffee className="w-3.5 h-3.5" />,
  "patreon.com": <Bookmark className="w-3.5 h-3.5" />,
}

function getSiteIcon(url: string): React.ReactNode {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    const cleanHostname = hostname.replace(/^www\./, "")
    return siteIcons[cleanHostname] || <Globe className="w-3.5 h-3.5" />
  } catch {
    return <Globe className="w-3.5 h-3.5" />
  }
}

interface SourceMetadata {
  title?: string
  description?: string
  image?: string
  siteName?: string
  url?: string
  author?: string
  publishedTime?: string
}

const metadataCache = new Map<string, SourceMetadata | null>()
const inFlightRequests = new Map<string, Promise<SourceMetadata | null>>()

interface Source {
  url: string
  title: string
  credibility: number
  publishedAt: string
}

const SourceLinkWithTooltip = ({ source }: { source: Source }) => {
  const [metadata, setMetadata] = useState<SourceMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function fetchMetadata() {
      if (!source.url || !isOpen) return

      if (metadataCache.has(source.url)) {
        const cachedData = metadataCache.get(source.url)
        setMetadata(cachedData || null)
        return
      }

      setLoading(true)
      try {
        let requestPromise = inFlightRequests.get(source.url)
        if (!requestPromise) {
          requestPromise = (async () => {
            try {
              const response = await fetch(
                `/api/getmetaData?url=${encodeURIComponent(source.url)}`,
              )
              if (response.ok) {
                const data = await response.json()
                metadataCache.set(source.url, data)
                return data
              }
            } catch (error) {
              console.error("Failed to fetch metadata:", error)
            }
            metadataCache.set(source.url, null)
            return null
          })()
          inFlightRequests.set(source.url, requestPromise)
        }

        const data = await requestPromise
        setMetadata(data)
      } catch (error) {
        console.error("Failed to resolve metadata:", error)
        metadataCache.set(source.url, null)
      } finally {
        inFlightRequests.delete(source.url)
        setLoading(false)
      }
    }
    fetchMetadata()
  }, [source.url, isOpen])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.open(source.url, "_blank", "noopener,noreferrer")
  }

  return (
    <TooltipProvider>
      <Tooltip onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
          >
            {getSiteIcon(source.url)}
            {source.title}
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="flex flex-col gap-2 p-2 min-w-[200px]">
            {loading ? (
              <div className="flex flex-col gap-1.5 py-1">
                <TextShimmer duration={1.5} className="text-xs text-muted-foreground">Fetching metadata...</TextShimmer>
                <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-2.5 bg-muted animate-pulse rounded w-full"></div>
              </div>
            ) : (
              <>
                {metadata?.image && (
                  <img
                    src={metadata.image}
                    alt={source.title || "Source preview"}
                    className="w-full h-24 object-cover rounded"
                  />
                )}
                <div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClick}
                    className="font-medium text-sm text-left hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {source.title}
                    <ExternalLink className="w-3 h-3 inline ml-1 opacity-60" />
                  </a>
                  <div className="text-xs text-muted-foreground mt-1">
                    Credibility: {Math.round(source.credibility * 100)}%
                  </div>
                  {source.publishedAt && formatTimeAgo(source.publishedAt) && (
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(source.publishedAt)}
                    </div>
                  )}
                  {metadata?.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {metadata.description.length > 120
                        ? `${metadata.description.substring(0, 120)}...`
                        : metadata.description}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function AlertDetailsSheet({ isOpen, onOpenChange, event: selectedEvent }: AlertDetailsSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-slate-200/40 dark:border-slate-800/40 shadow-2xl rounded-lg">
        {selectedEvent && (
          <div className="overflow-y-auto h-full">
            <CardHeader className="pt-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">{getCategoryIcon(selectedEvent.category)}</span>
                <div>
                  <Badge className={`text-xs font-medium ${getSeverityColor(selectedEvent.severity)}`}>
                    Severity {selectedEvent.severity}
                  </Badge>
                  <Badge className={`text-xs font-medium ml-2 ${getImpactColor(selectedEvent.impact)}`}>
                    {selectedEvent.impact} Impact
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
                {selectedEvent.title}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 pt-1">
                {selectedEvent.summary}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Supply Chain and Timeline */}
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">Supply Chain</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedEvent.supplyChainName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedEvent.nodeName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">Timeframe</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedEvent.timeframe}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Detected {formatTimeAgo(selectedEvent.batchTimestamp)}
                  </p>
                </div>
              </div>

              {/* Affected Entities */}
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 text-sm">Affected Entities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.affectedEntities.map((entity, index) => (
                    <Badge key={index} variant="secondary" className="text-sm font-normal border-gray-300/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50">
                      {entity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Confidence */}
              <div className='pt-2'>
                <div className='flex justify-between items-center mb-2'>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Confidence Level</h4>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {Math.round(selectedEvent.confidence * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200/80 dark:bg-gray-700/60 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-2.5 rounded-full shadow-md" 
                    style={{ width: `${selectedEvent.confidence * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Sources */}
              {selectedEvent.sources.length > 0 && (
                <div className='pt-2'>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 text-sm">Sources</h4>
                  <div className="space-y-3">
                    {selectedEvent.sources.map((source, index) => (
                      <div key={index} className="p-3 bg-white/60 dark:bg-slate-800/50 rounded-lg border border-gray-200/80 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <SourceLinkWithTooltip source={source} />
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <Badge variant="outline" className='border-green-300/80 text-green-700 bg-green-50/80 dark:text-green-300 dark:bg-green-950/50 dark:border-green-700/50'>
                                {Math.round(source.credibility * 100)}% credible
                              </Badge>
                              <span className='text-gray-400 dark:text-gray-600'>•</span>
                              <span>{formatTimeAgo(source.publishedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
} 