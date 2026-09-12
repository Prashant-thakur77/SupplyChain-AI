export const ROUTE_COLORS = ["#22c55e", "#3b82f6", "#a855f7"] as const
export const routeColor = (rank: number) => ROUTE_COLORS[rank % ROUTE_COLORS.length]
export const ROUTE_EDGE_PREFIX = "route-"
