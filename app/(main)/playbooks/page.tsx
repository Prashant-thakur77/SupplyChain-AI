import type { Metadata } from "next"
import { PlaybooksPage } from "@/components/playbooks/PlaybooksPage"
export const metadata: Metadata = { title: "Playbooks · SupplyChain AI" }
export default function Page() { return <main className="flex-1 overflow-auto bg-theme-bg-primary"><PlaybooksPage /></main> }
