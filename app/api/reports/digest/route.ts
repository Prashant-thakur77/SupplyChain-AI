import { NextRequest, NextResponse } from "next/server"
import { buildDigest, digestText } from "@/lib/digest"

export const dynamic = "force-dynamic"
/** ?userId&days → digest JSON (+ text for Slack). */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const userId = sp.get("userId"); if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })
  const d = await buildDigest(userId, Math.min(90, Math.max(1, Number(sp.get("days") ?? 7))))
  return NextResponse.json({ ...d, text: digestText(d) })
}
