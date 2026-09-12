import { Redis } from '@upstash/redis'

// Lazy singleton — only created on first request at runtime.
let _client: Redis | null = null

export function getRedisClient(): Redis {
  if (!_client) {
    const url = process.env.UPSTASH_REDIS_URL
    const token = process.env.UPSTASH_REDIS_TOKEN
    if (!url || !token) {
      throw new Error('Missing UPSTASH_REDIS_URL or UPSTASH_REDIS_TOKEN environment variables')
    }
    _client = new Redis({ url, token })
  }
  return _client
}
