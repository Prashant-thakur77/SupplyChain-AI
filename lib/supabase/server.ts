import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Lazy singleton — client is only created on first request at runtime,
// not at module import time during the Next.js build.
let _client: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (!_client) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      )
    }

    _client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  }
  return _client
}

// Backward-compat proxy for existing callers using `supabaseServer` directly.
// Functions are bound to the real client so `this` is always correct.
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getSupabaseServer()
    const value = (client as any)[prop]
    return typeof value === "function" ? value.bind(client) : value
  },
})

