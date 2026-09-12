"use client"

import { useState } from "react"
import { ArrowUpDown, Info } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type SupplyChainNode, supplyChainImpactData } from "@/lib/data/impactresult"
import { useImpact } from "@/lib/context/impact-context"
import { Skeleton } from "@/components/ui/skeleton"

export default function NodeImpactGrid() {
  const [sortBy, setSortBy] = useState<keyof SupplyChainNode>("riskScore")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  
  // Get the impact data from context 
  const { impactData, isLoading } = useImpact();
  
  // Use default data if impactData is not available
  const safeImpactData = impactData || supplyChainImpactData;

  const sortedNodes = [...(safeImpactData.nodes || [])].sort((a, b) => {
    if (sortOrder === "asc") {
      if (typeof a[sortBy] === "string" && typeof b[sortBy] === "string") {
        return (a[sortBy] as string).localeCompare(b[sortBy] as string)
      }
      return (a[sortBy] ?? 0) > (b[sortBy] ?? 0) ? 1 : -1
    } else {
      if (typeof a[sortBy] === "string" && typeof b[sortBy] === "string") {
        return (b[sortBy] as string).localeCompare(a[sortBy] as string)
      }
      return (a[sortBy] ?? 0) < (b[sortBy] ?? 0) ? 1 : -1
    }
  })

  const handleSort = (column: keyof SupplyChainNode) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const getStatusBadge = (status: string) => {
    // Convert status to capitalized form for display
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    
    switch (status) {
      case "operational":
        return <Badge className="bg-green-500">{capitalizedStatus}</Badge>
      case "partial":
        return <Badge className="bg-yellow-500">{capitalizedStatus}</Badge>
      case "disrupted":
        return <Badge className="bg-orange-500">{capitalizedStatus}</Badge>
      case "failed":
        return <Badge variant="destructive">{capitalizedStatus}</Badge>
      default:
        return <Badge>{capitalizedStatus}</Badge>
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <Card className="shadow-xl shadow-black/10 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          Node-Level Impact Grid
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 ml-2 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  This grid shows the impact on each node in your supply chain. Click on column headers to sort the
                  data.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>Detailed impact analysis for each node in the supply chain</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border shadow-lg shadow-black/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("name")} className="p-0 h-8">
                    Node
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("type")} className="p-0 h-8">
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("status")} className="p-0 h-8">
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("downtime")} className="p-0 h-8">
                    Downtime
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("outputDrop")} className="p-0 h-8">
                    Output Drop
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("recovery")} className="p-0 h-8">
                    Recovery
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("riskScore")} className="p-0 h-8">
                    Risk Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell className="font-medium">{node.name}</TableCell>
                  <TableCell>{node.type.charAt(0).toUpperCase() + node.type.slice(1)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(node.status)}
                      <span className="text-xs text-muted-foreground">{node.statusDetail}</span>
                    </div>
                  </TableCell>
                  <TableCell>{node.downtime}</TableCell>
                  <TableCell>{node.outputDrop}</TableCell>
                  <TableCell>{node.recovery}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            node.riskScore > 70 ? "bg-red-500" : node.riskScore > 40 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${node.riskScore}%` }}
                        />
                      </div>
                      <span className="text-xs">{node.riskScore}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <Card className="shadow-xl shadow-black/10 border-border/50">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-64" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-96" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="p-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
