"use client"

import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { getSiteIcon, safeDateFormat } from "../functions"
import { metadataCache } from "../constants"
import type { NotificationSource, SourceMetadata } from "../types"

interface SourceBubbleProps {
  source: NotificationSource
}

// Global cache of in-flight promises to deduplicate concurrent requests for the same URL
const inFlightRequests = new Map<string, Promise<SourceMetadata | null>>()

export function SourceBubble({ source }: SourceBubbleProps) {
  const [metadata, setMetadata] = useState<SourceMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function fetchMetadata() {
      if (!source.url || !isOpen) return
      
      // Validate URL format before fetching or caching
      try {
        new URL(source.url)
      } catch {
        return
      }
      
      // Check cache first
      if (metadataCache.has(source.url)) {
        const cachedData = metadataCache.get(source.url)
        setMetadata(cachedData || null)
        return
      }
      
      setLoading(true)
      try {
        // Retrieve or create in-flight promise for this URL to prevent duplicate parallel requests
        let requestPromise = inFlightRequests.get(source.url)
        if (!requestPromise) {
          requestPromise = (async () => {
            try {
              const response = await fetch(`/api/getmetaData?url=${encodeURIComponent(source.url)}`)
              if (response.ok) {
                const data = await response.json()
                metadataCache.set(source.url, data)
                return data
              }
            } catch (error) {
              console.error('Failed to fetch metadata:', error)
            }
            metadataCache.set(source.url, null)
            return null
          })()
          inFlightRequests.set(source.url, requestPromise)
        }

        const data = await requestPromise
        setMetadata(data)
      } catch (error) {
        console.error('Failed to resolve metadata:', error)
        metadataCache.set(source.url, null)
      } finally {
        inFlightRequests.delete(source.url)
        setLoading(false)
      }
    }
    fetchMetadata()
  }, [source.url, isOpen])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (source.url && (source.url.startsWith('http://') || source.url.startsWith('https://'))) {
      window.open(source.url, '_blank', 'noopener,noreferrer')
    }
  }

  let displayTitle = source.title
  if (!displayTitle) {
    try {
      displayTitle = source.url ? new URL(source.url).hostname : 'Source'
    } catch {
      displayTitle = source.url || 'Source'
    }
  }

  return (
    <TooltipProvider>
      <Tooltip onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <button 
            onClick={handleClick}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer hover:opacity-80 transition-all border bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {getSiteIcon(source.url)}
            {displayTitle.length > 25 ? `${displayTitle.substring(0, 25)}...` : displayTitle}
            <ExternalLink className="w-2 h-2 opacity-60" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="flex flex-col gap-2 min-w-[200px]">
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
                    alt={source.title || 'Source preview'}
                    className="w-full h-24 object-cover rounded"
                  />
                )}
                <div>
                  <button 
                    onClick={handleClick}
                    className="font-medium text-sm text-left hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {source.title}
                    <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-60" />
                  </button>
                  <div className="text-xs text-muted-foreground mt-1">
                    Credibility: {Math.round(source.credibility * 100)}%
                  </div>
                  {source.publishedAt && safeDateFormat(source.publishedAt) && (
                    <div className="text-xs text-muted-foreground">
                      {safeDateFormat(source.publishedAt)}
                    </div>
                  )}
                  {metadata?.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {metadata.description.length > 120 
                        ? `${metadata.description.substring(0, 120)}...` 
                        : metadata.description
                      }
                    </div>
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