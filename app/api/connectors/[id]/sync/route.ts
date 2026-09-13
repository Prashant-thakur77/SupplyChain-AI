import { NextRequest, NextResponse } from "next/server"
import { syncConnector } from "@/lib/connectors/sync"
import { requireRowAccess } from "@/lib/auth-server"

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const rg = await requireRowAccess("connectors", id); if ("error" in rg) return NextResponse.json({ error: rg.error }, { status: rg.status })
  try { return NextResponse.json(await syncConnector(id)) } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 502 }) }
}
