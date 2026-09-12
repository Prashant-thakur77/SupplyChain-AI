import { ImpactProvider } from "@/lib/context/impact-context"

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col">
      <ImpactProvider>
        {children}
      </ImpactProvider>
    </div>
  )
}