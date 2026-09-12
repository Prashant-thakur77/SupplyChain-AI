import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

type SupabaseClient = ReturnType<typeof createBrowserClient>

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

/**
 * Creates or returns the browser Supabase client.
 * Returns null on the server to avoid localStorage errors.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null
  return getClient()
}

// A recursive deep proxy that safely short-circuits on the server
function makeServerSafeProxy(target: any): any {
  return new Proxy(target, {
    get(_t, prop) {
      if (typeof window === "undefined") {
        // On the server return a callable proxy that always resolves to empty
        const noop: any = () => Promise.resolve({ data: null, error: null })
        noop.then = undefined
        return makeServerSafeProxy(noop)
      }
      const client = getClient()
      const value = (client as any)[prop]
      return typeof value === "function" ? value.bind(client) : value
    },
  })
}

export const supabaseClient: SupabaseClient = makeServerSafeProxy({})

