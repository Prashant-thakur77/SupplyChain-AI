/** Compact money for stat tiles: $950, $12k, $3.4M, $1.2B. */
export function compactUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—"
  const a = Math.abs(n), sign = n < 0 ? "-" : ""
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(a >= 1e10 ? 0 : 1)}B`
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}k`
  return `${sign}$${Math.round(a)}`
}
