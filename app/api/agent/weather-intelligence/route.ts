import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { agentAudit } from "@/lib/audit-logger"
import { loadTwinForAgent } from "@/lib/server/twin"
import { supabaseServer } from "@/lib/supabase/server"

export const maxDuration = 240

/** Weather sweep over every node of the user's twins. Deterministic severity flag from OpenWeather via agent-service `/weather`;
 *  severe hits are pushed through the Strands incident graph so they land in the Decision Inbox when they matter. */
export async function POST(req: NextRequest) {
  const { userId, supplyChainId } = await req.json().catch(() => ({}))
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
  const audit = agentAudit("WeatherIntelligenceAgent", userId)
  try {
    let q = supabaseServer.from("supply_chains").select("supply_chain_id, name").eq("user_id", userId)
    if (supplyChainId) q = q.eq("supply_chain_id", supplyChainId)
    const { data: chains } = await q
    if (!chains?.length) return NextResponse.json({ success: true, message: "No supply chains found", totalPointsChecked: 0, adverseConditions: 0, data: [] })

    const adverse: any[] = []
    let checked = 0
    for (const chain of chains) {
      const twin = await loadTwinForAgent(chain.supply_chain_id)
      const out = await agentClient.post("/weather", { supply_chain_id: chain.supply_chain_id, user_id: userId, twin })
      checked += out.nodes.length
      const rows = out.nodes.map((w: any) => ({
        supply_chain_id: chain.supply_chain_id, node_id: w.node_id, node_name: w.label, condition: w.condition, description: w.description,
        temperature: w.temp_c, wind_speed: w.wind_ms, visibility: w.visibility_m, is_adverse: !!w.severe, severity: w.severe ? "HIGH" : "LOW",
        checked_at: new Date().toISOString(),
      }))
      if (rows.length) await supabaseServer.from("weather_intelligence").upsert(rows, { onConflict: "supply_chain_id,node_id" }).then(() => undefined, () => undefined)
      for (const w of out.severe as any[]) {
        adverse.push({ supply_chain_id: chain.supply_chain_id, ...w })
        // Severe weather → incident graph (analyst decides severity; decisions only when it matters).
        await agentClient.post("/incident/sync", {
          supply_chain_id: chain.supply_chain_id, user_id: userId, persist: true, twin,
          event: { id: `weather-${w.node_id}-${Date.now()}`, kind: "weather", title: `${w.condition ?? "Severe weather"} at ${w.label}`,
                   description: `${w.description ?? ""}; wind ${w.wind_ms ?? "?"} m/s, visibility ${w.visibility_m ?? "?"} m`, failed_node_ids: [w.node_id], failed_edge_ids: [],
                   sources: [{ title: "OpenWeather", url: "https://openweathermap.org", credibility: 0.9 }] },
        }).catch((e) => console.warn("[weather] incident failed:", (e as Error).message))
      }
    }
    await audit.success(`Weather scan complete: ${checked} points checked, ${adverse.length} adverse`, { total: checked, adverse: adverse.length })
    return NextResponse.json({ success: true, totalPointsChecked: checked, adverseConditions: adverse.length, data: adverse })
  } catch (e) {
    await audit.error(String((e as Error).message))
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json({ success: false, ...body }, { status })
  }
}
