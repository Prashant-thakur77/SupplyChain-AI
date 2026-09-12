"use client"

import { PieChart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface NodeStatusData {
  name: string
  value: number
}

interface NodeStatusChartProps {
  data: NodeStatusData[]
  colors: string[]
}

export default function NodeStatusChart({ data, colors }: NodeStatusChartProps) {
  return (
    <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0">
          <CardTitle className="text-lg font-semibold">Node Status</CardTitle>
          <CardDescription className="text-muted-foreground/80">Current operational status</CardDescription>
        </div>
        <div className="p-2 rounded-lg bg-green-500/10 shadow-sm">
          <PieChart className="h-4 w-4 text-green-600" />
        </div>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
} 