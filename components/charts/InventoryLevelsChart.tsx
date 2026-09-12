"use client"

import { AreaChart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface InventoryData {
  day: number
  level: number
}

interface InventoryLevelsChartProps {
  data: InventoryData[]
}

export default function InventoryLevelsChart({ data }: InventoryLevelsChartProps) {
  return (
    <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0">
          <CardTitle className="text-lg font-semibold">Inventory Levels</CardTitle>
          <CardDescription className="text-muted-foreground/80">Daily inventory (% of capacity)</CardDescription>
        </div>
        <div className="p-2 rounded-lg bg-purple-500/10 shadow-sm">
          <AreaChart className="h-4 w-4 text-purple-600" />
        </div>
      </CardHeader>
      <CardContent className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <defs>
              <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="level"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorLevel)"
              name="Inventory"
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
} 