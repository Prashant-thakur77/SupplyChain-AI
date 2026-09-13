import type { Metadata } from "next"
import { TeamPage } from "@/components/team/TeamPage"
export const metadata: Metadata = { title: "Team · SupplyChain AI" }
export default function Page() { return <main className="flex-1 overflow-auto bg-theme-bg-primary"><TeamPage /></main> }
