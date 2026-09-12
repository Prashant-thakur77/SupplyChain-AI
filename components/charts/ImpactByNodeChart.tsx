"use client"

import { BarChart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
} from "recharts"

interface ImpactByNodeData {
  name: string
  impact: number
}

interface ImpactByNodeChartProps {
  data: ImpactByNodeData[]
}

const chartConfig = {
  impact: {
    label: "Impact",
    color: "#3b82f6",
  },
} satisfies ChartConfig

export default function ImpactByNodeChart({ data }: ImpactByNodeChartProps) {
  return (
    <Card className="bg-transparent  border-border/50 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0">
          <CardTitle className="text-lg font-semibold">Impact by Node</CardTitle>
          <CardDescription className="text-muted-foreground/80">Output reduction by node (%)</CardDescription>
        </div>
        <div className="p-2 rounded-lg bg-orange-500/10 shadow-sm">
          <BarChart className="h-4 w-4 text-orange-600" />
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <RechartsBarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: -20,
            }}
          >
            <XAxis type="number" dataKey="impact" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={150}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar 
              dataKey="impact" 
              fill="var(--color-impact)" 
              radius={5}
            />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 