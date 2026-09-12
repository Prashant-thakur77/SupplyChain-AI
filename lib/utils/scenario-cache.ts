// Simple client-side cache for scenario data
interface CachedScenario {
  data: any
  timestamp: number
  supplyChainId: string
}

class ScenarioCache {
  private cache: Map<string, CachedScenario> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  set(supplyChainId: string, data: any): void {
    this.cache.set(supplyChainId, {
      data,
      timestamp: Date.now(),
      supplyChainId
    })
  }

  get(supplyChainId: string): any | null {
    const cached = this.cache.get(supplyChainId)
    
    if (!cached) {
      return null
    }

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(supplyChainId)
      return null
    }

    return cached.data
  }

  clear(supplyChainId?: string): void {
    if (supplyChainId) {
      this.cache.delete(supplyChainId)
    } else {
      this.cache.clear()
    }
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key)
      }
    }
  }
}

export const scenarioCache = new ScenarioCache()

// Auto cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    scenarioCache.cleanup()
  }, 10 * 60 * 1000)
}
