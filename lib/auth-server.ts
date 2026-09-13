// Server-side session + role helpers. Session comes from the @supabase/ssr cookies the browser client sets.
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { supabaseServer } from "@/lib/supabase/server"

export type Role = "owner" | "approver" | "planner" | "viewer"

export async function getSessionUser(): Promise<{ id: string; email?: string } | null> {
  try {
    const store = await cookies()
    const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll: () => store.getAll(), setAll: () => undefined },
    })
    const { data } = await sb.auth.getUser()
    return data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null
  } catch { return null }
}

/** Role of a user on the org that owns a supply chain (chain owner counts as owner). */
export async function roleForChain(userId: string, supplyChainId: string): Promise<Role | null> {
  const { data: sc } = await supabaseServer.from("supply_chains").select("user_id, org_id").eq("supply_chain_id", supplyChainId).maybeSingle()
  if (!sc) return null
  if (sc.user_id === userId) return "owner"
  if (!sc.org_id) return null
  const { data: m } = await supabaseServer.from("org_members").select("role").eq("org_id", sc.org_id).eq("user_id", userId).maybeSingle()
  return (m?.role as Role) ?? null
}

export const canApprove = (r: Role | null) => r === "owner" || r === "approver"

/**
 * Guard for per-twin data routes. The caller must be signed in and be the chain owner or a member of its org.
 * `write` additionally requires planner or above (viewers read only). Returns the user or a ready-to-send error response.
 */
export async function requireChainAccess(supplyChainId: string | null | undefined, write = false): Promise<{ user: { id: string }; role: Role } | { error: string; status: number }> {
  if (!supplyChainId) return { error: "supplyChainId is required", status: 400 }
  const user = await getSessionUser()
  if (!user) return { error: "sign in required", status: 401 }
  const role = await roleForChain(user.id, supplyChainId)
  if (!role) return { error: "you do not have access to this supply chain", status: 403 }
  if (write && role === "viewer") return { error: "viewers cannot change this supply chain", status: 403 }
  return { user, role }
}

/** Guard for user-scoped routes (?userId=…): the session user must be that user. */
export async function requireSelf(userId: string | null | undefined): Promise<{ user: { id: string } } | { error: string; status: number }> {
  if (!userId) return { error: "userId is required", status: 400 }
  const user = await getSessionUser()
  if (!user) return { error: "sign in required", status: 401 }
  if (user.id !== userId) return { error: "forbidden", status: 403 }
  return { user }
}

/** Guard for DELETE ?id= on per-twin tables: looks up the row's supply chain and requires write access. */
export async function requireRowAccess(table: string, id: string | null | undefined): Promise<{ user: { id: string }; role: Role; supplyChainId: string } | { error: string; status: number }> {
  if (!id) return { error: "id is required", status: 400 }
  const { data } = await supabaseServer.from(table).select("supply_chain_id").eq("id", id).maybeSingle()
  if (!data) return { error: "not found", status: 404 }
  const g = await requireChainAccess(data.supply_chain_id, true)
  return "error" in g ? g : { ...g, supplyChainId: data.supply_chain_id }
}

/** Agent proxies: when a saved twin is addressed (no canvas nodes in the body), the caller needs read access to it. */
export async function guardSavedTwin(body: any): Promise<{ error: string; status: number } | null> {
  const id = body?.supplyChainId
  if (!id || body?.nodes || id === "canvas" || id === "default-chain") return null
  const g = await requireChainAccess(String(id))
  return "error" in g ? g : null
}
