"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ProductionData {
  day: number
  actual: number | null
  projected: number
}

interface ProductionOutputChartProps {
  data: ProductionData[]
}

const chartConfig = {
  actual: {
    label: "Actual",
    color: "#3b82f6",
  },
  projected: {
    label: "Projected",
    color: "#94a3b8",
  },
} satisfies ChartConfig

export default function ProductionOutputChart({ data }: ProductionOutputChartProps) {
  return (
    <Card className="bg-transparent  border-border/50 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
      <CardHeader>
        <CardTitle>Production Output</CardTitle>
        <CardDescription>Daily production capacity (% of normal)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `Day ${value}`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="actual"
              type="monotone"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5, fill: "#3b82f6" }}
              activeDot={{ r: 6, fill: "#3b82f6" }}
              connectNulls={false}
            />
            <Line
              dataKey="projected"
              type="monotone"
              stroke="#94a3b8"
              strokeWidth={3}
              dot={{ r: 5, fill: "#94a3b8" }}
              activeDot={{ r: 6, fill: "#94a3b8" }}
              strokeDasharray="8 4"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Production tracking analysis <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Showing actual vs projected production output
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
} 