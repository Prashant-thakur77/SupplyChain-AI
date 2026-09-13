import { NextRequest, NextResponse } from "next/server"
import { verifyAction } from "@/lib/action-token"
import { canApprove, roleForChain } from "@/lib/auth-server"
import { applyDecision } from "@/lib/decisions-server"
import { supabaseServer } from "@/lib/supabase/server"

/** One-click action from Slack / email: /d/<decisionId>/<approve|reject|snooze>?t=<signed token>. Renders a tiny confirmation page. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await ctx.params
  const t = new URL(req.url).searchParams.get("t") ?? ""
  const v = verifyAction(t)
  const page = (title: string, body: string, ok: boolean) => new NextResponse(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="margin:0;background:#F6F3EE;color:#18160F;font:16px/1.5 Inter,system-ui,sans-serif"><div style="max-width:560px;margin:12vh auto;padding:0 24px">
<div style="display:inline-flex;align-items:center;gap:8px;border:1px solid ${ok ? "#1A7F4B55" : "#B91C1C55"};background:${ok ? "#DCFCE7" : "#FEE2E2"};color:${ok ? "#1A7F4B" : "#B91C1C"};border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${ok ? "Done" : "Not applied"}</div>
<h1 style="font-family:Georgia,serif;font-size:2rem;margin:16px 0 8px">${title}</h1><p style="color:#5C5850">${body}</p>
<a href="${(process.env.APP_URL ?? "").replace(/\/$/, "")}/decisions" style="display:inline-block;margin-top:16px;background:#2748E8;color:#fff;text-decoration:none;border-radius:999px;padding:10px 18px;font-weight:600">Open the Decision Inbox</a></div></body>`, { headers: { "content-type": "text/html; charset=utf-8" }, status: ok ? 200 : 400 })
  if (!v || v.decisionId !== id || v.action !== action) return page("This link is invalid or has expired", "Action links are valid for 72 hours. Open the inbox to act on the decision.", false)
  const { data: d } = await supabaseServer.from("decisions").select("title, supply_chain_id, status").eq("id", id).maybeSingle()
  if (!d) return page("Decision not found", "It may have been deleted.", false)
  if (!canApprove(await roleForChain(v.userId, d.supply_chain_id))) return page("Not allowed", "This link belongs to someone without approval rights on that supply chain.", false)
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "snoozed"
  const r = await applyDecision(id, status, v.userId)
  if ("error" in r && r.error) return page(r.status === 409 ? `Already ${(r as any).decision?.status}` : "Could not apply", r.error, false)
  const chosen = (r.decision?.options ?? []).find((o: any) => o.id === r.decision?.chosen_option_id)
  return page(status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Snoozed for 24 hours", `${d.title}${chosen ? ` → ${chosen.label}` : ""}. Logged, notified, and remembered by the agent.`, true)
}
