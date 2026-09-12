import { tavily, TavilyClient } from '@tavily/core'

// Lazy singleton — only created on first request at runtime.
let _client: TavilyClient | null = null

export function getTavilyClient(): TavilyClient {
  if (!_client) {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      throw new Error('Missing TAVILY_API_KEY environment variable')
    }
    _client = tavily({ apiKey })
  }
  return _client
}
