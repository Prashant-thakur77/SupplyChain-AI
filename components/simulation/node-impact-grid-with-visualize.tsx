"use client"

import { useState } from "react"
import { ArrowUpDown, Info, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import CascadingFailureMap from "@/components/cascading-failure-map"
import { 
  SupplyChainNode, 
  DEFAULT_SIMULATION_NODES, 
  NODE_STATUS_CONFIG,
  NodeStatus 
} from "@/lib/data/simulation-nodes"

interface NodeImpactGridProps {
  nodes?: SupplyChainNode[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  showVisualize?: boolean;
}

export default function NodeImpactGridWithVisualize({
  nodes = DEFAULT_SIMULATION_NODES,
  title = "Node-Level Impact Grid",
  description = "Detailed impact analysis for each node in the supply chain",
  isLoading = false,
  showVisualize = true
}: NodeImpactGridProps) {
  const [sortBy, setSortBy] = useState<keyof SupplyChainNode>("riskScore")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [visualizeOpen, setVisualizeOpen] = useState(false)

  const sortedNodes = [...nodes].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    
    // Handle null/undefined values - place them at the end regardless of sort order
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1
    
    if (sortOrder === "asc") {
      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue)
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue
      }
      // For mixed types or other types, convert to string for comparison
      return String(aValue).localeCompare(String(bValue))
    } else {
      if (typeof aValue === "string" && typeof bValue === "string") {
        return bValue.localeCompare(aValue)
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return bValue - aValue
      }
      // For mixed types or other types, convert to string for comparison
      return String(bValue).localeCompare(String(aValue))
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
    const nodeStatus = status as NodeStatus;
    const config = NODE_STATUS_CONFIG[nodeStatus];
    
    if (config) {
      return <Badge className={config.className}>{config.label}</Badge>
    }
    
    // Fallback for unknown status
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    return <Badge>{capitalizedStatus}</Badge>
  }

  return (
    <>
      <Card className="shadow-xl shadow-black/10 border-border/50 bg-white/70 dark:bg-slate-900/5 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CardTitle className="flex items-center">
                {title}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        This grid shows the impact on each node in your supply chain. Click on column headers to sort the data.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
            {showVisualize && (
              <Dialog open={visualizeOpen} onOpenChange={setVisualizeOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/20 backdrop-blur-xl border-white/40 dark:border-slate-700/30 hover:bg-white/90 dark:hover:bg-slate-900/30"
                    disabled={isLoading}
                  >
                    <Eye className="h-4 w-4" />
                    Visualize
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Cascading Failure Visualization</DialogTitle>
                    <DialogDescription>
                      Interactive network view showing how disruptions cascade through your supply chain
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <CascadingFailureMap />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border shadow-lg shadow-black/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("name")} 
                      className="p-0 h-8"
                      disabled={isLoading}
                    >
                      Node
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("type")} 
                      className="p-0 h-8"
                      disabled={isLoading}
                    >
                      Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("status")} 
                      className="p-0 h-8"
                      disabled={isLoading}
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("downtime")} 
                      className="p-0 h-8"
                      disabled={isLoading}
                    >
                      Downtime
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("outputDrop")} 
                      className="p-0 h-8"
                      disabled={isLoading}
                    >
                      Output Drop
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("recovery")} 
                      className="p-0 h-8"
                      disabled={isLoading}
                    >
                      Recovery
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("riskScore")} 
                      className="p-0 h-8"
                      disabled={isLoading}
                    >
                      Risk Score
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  sortedNodes.map((node) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
