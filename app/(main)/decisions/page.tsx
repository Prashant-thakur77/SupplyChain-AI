import type { Metadata } from "next"
import { DecisionInbox } from "@/components/decisions/decision-inbox"

export const metadata: Metadata = { title: "Decision Inbox · SupplyChain AI" }

export default function DecisionsPage() {
  return (
    <main className="flex-1 overflow-auto bg-theme-bg-primary">
      <DecisionInbox />
    </main>
  )
}
