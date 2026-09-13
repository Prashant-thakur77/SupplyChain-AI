import type { Metadata } from "next"
import { AgentOps } from "@/components/agents/AgentOps"
export const metadata: Metadata = { title: "Agent Ops · SupplyChain AI" }
export default function AgentsPage() { return <main className="flex-1 overflow-auto bg-theme-bg-primary"><AgentOps /></main> }
