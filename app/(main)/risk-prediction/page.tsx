import type { Metadata } from "next"
import { RiskPage } from "@/components/risk/RiskPage"
export const metadata: Metadata = { title: "Site risk · SupplyChain AI" }
export default function Page() { return <main className="flex-1 overflow-auto bg-theme-bg-primary"><RiskPage /></main> }
