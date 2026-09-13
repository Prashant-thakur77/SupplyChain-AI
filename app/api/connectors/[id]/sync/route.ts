import { NextRequest, NextResponse } from "next/server"
import { syncConnector } from "@/lib/connectors/sync"

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try { return NextResponse.json(await syncConnector(id)) } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 502 }) }
}
