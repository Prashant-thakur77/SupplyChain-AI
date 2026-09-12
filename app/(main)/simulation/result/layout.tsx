export default function ResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex-1 overflow-auto">
      {children}
    </main>
  )
}
