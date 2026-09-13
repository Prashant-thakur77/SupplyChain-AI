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
