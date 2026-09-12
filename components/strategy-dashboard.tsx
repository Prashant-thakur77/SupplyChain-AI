"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Download, Filter, Search } from "lucide-react"

interface StrategyDashboardProps {
  scenarioId: string
}


// Glassmorphic Card Component
function GlassmorphicCard({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  return (
    <Card 
      className={`border border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-950 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 rounded-xl ${className}`} 
      {...props}
    >
      {children}
    </Card>
  )
}


export default function StrategyDashboard({ scenarioId }: StrategyDashboardProps) {
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([])
  const [appliedStrategies, setAppliedStrategies] = useState<string[]>([])

  const toggleStrategy = (id: string) => {
    if (selectedStrategies.includes(id)) {
      setSelectedStrategies(selectedStrategies.filter((s) => s !== id))
    } else {
      setSelectedStrategies([...selectedStrategies, id])
    }
  }

  const applySimulation = (id: string) => {
    if (!appliedStrategies.includes(id)) {
      setAppliedStrategies([...appliedStrategies, id])
    }
  }

  // Dummy data for strategies
  const strategies = [
    {
      id: "alt-port",
      title: "Alternate Port Routing",
      description: "Reroute shipments through alternative ports to avoid closure impact",
      cost: 600000,
      savings: 2900000,
      roi: 4.8,
      time: 3,
      impactReduction: 45,
    },
    {
      id: "dual-source",
      title: "Dual-Sourcing",
      description: "Implement dual-sourcing strategy for critical components",
      cost: 450000,
      savings: 2300000,
      roi: 5.1,
      time: 5,
      impactReduction: 38,
    },
    {
      id: "temp-warehouse",
      title: "Temporary Warehousing",
      description: "Secure temporary warehousing near alternative ports",
      cost: 300000,
      savings: 1200000,
      roi: 4.0,
      time: 2,
      impactReduction: 25,
    },
    {
      id: "air-freight",
      title: "Air-freight Triage",
      description: "Use air-freight for high-priority items to maintain service levels",
      cost: 500000,
      savings: 3200000,
      roi: 6.4,
      time: 1,
      impactReduction: 52,
    },
  ]

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)} M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value}`
  }

  // Calculate totals
  const totalCost = selectedStrategies.reduce((sum, id) => {
    const strategy = strategies.find((s) => s.id === id)
    return sum + (strategy?.cost || 0)
  }, 0)

  const totalSavings = selectedStrategies.reduce((sum, id) => {
    const strategy = strategies.find((s) => s.id === id)
    return sum + (strategy?.savings || 0)
  }, 0)

  const averageROI =
    selectedStrategies.length > 0
      ? selectedStrategies.reduce((sum, id) => {
          const strategy = strategies.find((s) => s.id === id)
          return sum + (strategy?.roi || 0)
        }, 0) / selectedStrategies.length
      : 0

  const averageTime =
    selectedStrategies.length > 0
      ? selectedStrategies.reduce((sum, id) => {
          const strategy = strategies.find((s) => s.id === id)
          return sum + (strategy?.time || 0)
        }, 0) / selectedStrategies.length
      : 0

  return (
    <div className="min-h-screen ">
      {/* Simplified Header */}
      <GlassmorphicCard className="  backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm rounded-xl">
        <div className="px-6 py-6 ">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Strategy Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{scenarioId}</p>
            </div>
            <Badge variant="info" className="text-xs">
              Updated: Apr 22, 2025 10:45 AM
            </Badge>
          </div>
        </div>
      </GlassmorphicCard>

      <div className="px-0 py-4">
        {/* Executive Summary Panel with better shadows */}
        <GlassmorphicCard className=" shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 mb-8">
          <CardContent className="p-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Impact Overview</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700 shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Disruption Type</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Port Closure</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/30 shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Impact Cost</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">$4.2M</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">(next 30 days)</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/30 shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Downtime</p>
                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">10 days</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Affected Volume</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">25,000 TEUs</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/30 shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Current Mitigation</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">$350K</p>
              </div>
            </div>
          </CardContent>
        </GlassmorphicCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Simplified Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-900/60">
              <div className="flex items-center gap-3">
                <Select defaultValue="roi">
                  <SelectTrigger className="w-[160px] shadow-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="roi" className="text-slate-900 dark:text-slate-100">Highest ROI</SelectItem>
                    <SelectItem value="cost" className="text-slate-900 dark:text-slate-100">Lowest Cost</SelectItem>
                    <SelectItem value="time" className="text-slate-900 dark:text-slate-100">Fastest Implementation</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input type="search" placeholder="Search..." className="pl-9 w-[200px] shadow-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </div>
              </div>
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-600">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>

            {/* Strategy Cards with enhanced shadows */}
            <GlassmorphicCard className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {strategies.map((strategy) => (
                <GlassmorphicCard
                  key={strategy.id}
                  className={`
                    border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                    ${selectedStrategies.includes(strategy.id) 
                      ? "ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/30" 
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }
                  `}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-slate-900 dark:text-slate-100 leading-tight">{strategy.title}</CardTitle>
                      {strategy.roi > 5 && (
                        <Badge className="bg-amber-500 dark:bg-amber-600 text-white shadow-sm text-xs">Top ROI</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-2">{strategy.description}</p>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <Badge variant="info" className="text-xs font-medium">
                        💰 {formatCurrency(strategy.cost)}
                      </Badge>
                      <Badge variant="success" className="text-xs font-medium">
                        ↗️ {strategy.roi}× ROI
                      </Badge>
                      <Badge variant="blue" className="text-xs font-medium">
                        ⏱ {strategy.time} days
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Savings:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(strategy.savings)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Impact Reduction:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{strategy.impactReduction}%</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-0">
                    <Button
                      className="flex-1 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={() => applySimulation(strategy.id)}
                      disabled={appliedStrategies.includes(strategy.id)}
                    >
                      {appliedStrategies.includes(strategy.id) ? "Simulated" : "Simulate"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-sm hover:shadow-md transition-all"
                      onClick={() => toggleStrategy(strategy.id)}
                    >
                      {selectedStrategies.includes(strategy.id) ? "Remove" : "Add"}
                    </Button>
                  </CardFooter>
                </GlassmorphicCard>
              ))}
            </GlassmorphicCard>

            {/* Strategy Comparison Table with better styling */}
            <GlassmorphicCard className=" shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Strategy Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 dark:border-slate-700">
                        <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Strategy</TableHead>
                        <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Cost</TableHead>
                        <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Savings</TableHead>
                        <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">ROI</TableHead>
                        <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Time</TableHead>
                        <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {strategies.map((strategy, index) => (
                        <TableRow 
                          key={strategy.id} 
                          className={`border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                            index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-900/50"
                          }`}
                        >
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{strategy.title}</TableCell>
                          <TableCell className="text-slate-900 dark:text-slate-100">{formatCurrency(strategy.cost)}</TableCell>
                          <TableCell className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(strategy.savings)}</TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{strategy.roi}×</TableCell>
                          <TableCell className="text-slate-900 dark:text-slate-100">{strategy.time} days</TableCell>
                          <TableCell>
                            {selectedStrategies.includes(strategy.id) && (
                              <span className="text-green-600 dark:text-green-400 font-medium">Added ✓</span>
                            )}
                            {appliedStrategies.includes(strategy.id) && !selectedStrategies.includes(strategy.id) && (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">Applied 🔄</span>
                            )}
                            {!selectedStrategies.includes(strategy.id) && !appliedStrategies.includes(strategy.id) && (
                              <span className="text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </GlassmorphicCard>

            {/* Action Section */}
            <GlassmorphicCard className=" shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Finalize Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea 
                    placeholder="Add notes about your strategy plan..." 
                    className="shadow-sm resize-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                    rows={3}
                    maxLength={500} 
                  />
                  <div className="flex justify-end">
                    <Button className="bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all px-6">
                      Finalize Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </GlassmorphicCard>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 bg-transparent">
            <GlassmorphicCard className="sticky top-6 shadow-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Plan Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg">💰</span>
                      <div className="text-left">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total Cost</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalCost)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/30 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg">📈</span>
                      <div className="text-left">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total Savings</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(totalSavings)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg">🔄</span>
                      <div className="text-left">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Avg ROI</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{averageROI.toFixed(1)}×</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/30 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg">⏱</span>
                      <div className="text-left">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Avg Time</p>
                        <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{averageTime.toFixed(1)} days</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced ROI Chart placeholder */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">ROI Projection</h3>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg p-6 h-[200px] flex items-center justify-center shadow-lg shadow-inner">
                    {selectedStrategies.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                        Select strategies to view<br />ROI projection
                      </p>
                    ) : (
                      <div className="w-full h-full relative">
                        {/* Simple visualization placeholder */}
                        <div className="absolute bottom-2 left-2 w-full h-[1px] bg-slate-300 dark:bg-slate-500"></div>
                        <div className="absolute left-2 bottom-2 h-full w-[1px] bg-slate-300 dark:bg-slate-500"></div>
                        <div className="absolute bottom-4 left-4 w-[80%] h-[2px] bg-red-400 dark:bg-red-500 rounded"></div>
                        <div className="absolute bottom-4 left-4 w-[80%] h-[60px] border-t-2 border-green-500 dark:border-green-400 rounded-t-full"></div>
                        <div className="absolute top-2 right-2 space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded"></div>
                            <span className="text-slate-600 dark:text-slate-400">Savings</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-400 dark:bg-red-500 rounded"></div>
                            <span className="text-slate-600 dark:text-slate-400">Cost</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Strategies */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Selected Strategies</h3>
                  {selectedStrategies.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg text-center shadow-md">
                      No strategies selected
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedStrategies.map((id) => {
                        const strategy = strategies.find((s) => s.id === id)
                        return strategy ? (
                          <div key={id} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 shadow-md hover:shadow-lg transition-shadow">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{strategy.title}</span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(strategy.savings)}</span>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}
                </div>

                <Separator className="my-4 border-slate-200 dark:border-slate-700" />

                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-lg hover:shadow-xl transition-shadow">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Net Benefit:</span>
                  <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSavings - totalCost)}</span>
                </div>
              </CardContent>
            </GlassmorphicCard>
          </div>
        </div>
      </div>
    </div>
  )
}
