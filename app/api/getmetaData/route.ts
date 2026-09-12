import { type NextRequest, NextResponse } from "next/server"
import ogs from "open-graph-scraper"

export const dynamic = "force-dynamic"

// In-memory cache to prevent redundant external scraping calls
interface CacheEntry {
    data: any
    timestamp: number
    isSuccess: boolean
}
const metadataCache = new Map<string, CacheEntry>()
const CACHE_TTL_SUCCESS = 30 * 60 * 1000 // 30 minutes
const CACHE_TTL_FAIL = 5 * 60 * 1000 // 5 minutes

/**
 * API route that fetches Open Graph metadata from a URL.
 * Falls back to null data (200 OK) if the site blocks scrapers or times out.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const link = searchParams.get("url")

        if (!link) {
            return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 })
        }

        // Validate URL format and protocol
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(link)
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                return NextResponse.json(
                    { error: "Invalid URL protocol. Only HTTP and HTTPS are allowed." },
                    { status: 400 },
                )
            }
        } catch {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
        }

        // Check cache first
        const cached = metadataCache.get(link)
        if (cached) {
            const age = Date.now() - cached.timestamp
            const ttl = cached.isSuccess ? CACHE_TTL_SUCCESS : CACHE_TTL_FAIL
            if (age < ttl) {
                return NextResponse.json(cached.data)
            }
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            controller.abort()
        }, 4000) // strict 4-second timeout limit

        try {
            const { error: ogsError, result } = await ogs({
                url: link,
                fetchOptions: {
                    signal: controller.signal,
                    headers: {
                        // Standard Chrome User-Agent on Windows to bypass bot-blocking (e.g. 403 Forbidden)
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                    },
                },
            })
            clearTimeout(timeoutId)

            // OGS returns error:true when it can't fetch — return null data gracefully
            if (ogsError || !result) {
                const failData = {
                    title: null,
                    description: null,
                    image: null,
                    siteName: parsedUrl.hostname,
                    url: link,
                    favicon: null,
                    success: false,
                }
                metadataCache.set(link, { data: failData, timestamp: Date.now(), isSuccess: false })
                return NextResponse.json(failData)
            }

            const {
                ogTitle, ogDescription, ogImage, twitterImage,
                ogSiteName, ogUrl, ogType, favicon, requestUrl,
                success, twitterCard, twitterTitle, twitterDescription,
                articlePublishedTime, articleAuthor, ogDate, dcDate, dcCreator,
            } = result

            const getImageUrl = (imageData: any) => {
                if (!imageData) return null
                if (Array.isArray(imageData)) return imageData[0]?.url || null
                return imageData.url || null
            }

            const successData = {
                title: ogTitle || twitterTitle || null,
                description: ogDescription || twitterDescription || null,
                image: getImageUrl(ogImage) || getImageUrl(twitterImage) || null,
                siteName: ogSiteName || parsedUrl.hostname || null,
                url: ogUrl || requestUrl || link,
                type: ogType || null,
                favicon: favicon || null,
                publishedTime: articlePublishedTime || ogDate || dcDate || null,
                author: articleAuthor || dcCreator || null,
                twitterCard: twitterCard || null,
                success: success || false,
            }

            metadataCache.set(link, { data: successData, timestamp: Date.now(), isSuccess: true })
            return NextResponse.json(successData)

        } catch (ogsErr: any) {
            clearTimeout(timeoutId)
            const isAbort = ogsErr?.name === 'AbortError' || ogsErr?.message?.includes('aborted')
            console.warn(`[getmetaData] Failed to fetch OG data for ${link}:`, isAbort ? 'Request timed out (4s limit)' : (ogsErr?.message || ogsErr))

            const failData = {
                title: null,
                description: null,
                image: null,
                siteName: parsedUrl.hostname,
                url: link,
                favicon: null,
                success: false,
            }
            metadataCache.set(link, { data: failData, timestamp: Date.now(), isSuccess: false })
            return NextResponse.json(failData)
        }

    } catch (err: any) {
        console.error("Metadata fetch error:", err)
        return NextResponse.json({ error: "Server error fetching metadata" }, { status: 500 })
    }
}

