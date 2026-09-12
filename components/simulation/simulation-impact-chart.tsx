"use client"

import { useTheme } from "next-themes"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { name: "Supplier A", cost: 450000, delay: 12, inventory: 85 },
  { name: "Warehouse B", cost: 320000, delay: 9, inventory: 65 },
  { name: "Factory C", cost: 280000, delay: 7, inventory: 55 },
  { name: "Distribution D", cost: 150000, delay: 5, inventory: 40 },
  { name: "Supplier E", cost: 80000, delay: 3, inventory: 25 },
]

export function SimulationImpactChart() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
        <XAxis dataKey="name" stroke={isDark ? "#888" : "#666"} />
        <YAxis stroke={isDark ? "#888" : "#666"} />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1f2937" : "#fff",
            borderColor: isDark ? "#374151" : "#e5e7eb",
            color: isDark ? "#f9fafb" : "#111827",
          }}
          formatter={(value, name) => {
            if (name === "cost") return [`$${value.toLocaleString()}`, "Cost Impact"]
            if (name === "delay") return [`${value} days`, "Time Delay"]
            if (name === "inventory") return [`${value}%`, "Inventory Impact"]
            return [value, name]
          }}
        />
        <Legend />
        <Bar dataKey="cost" name="Cost Impact ($)" fill="#ef4444" />
        <Bar dataKey="delay" name="Time Delay (days)" fill="#f59e0b" />
        <Bar dataKey="inventory" name="Inventory Impact (%)" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
