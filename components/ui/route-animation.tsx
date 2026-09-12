"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowRight, CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RouteAnimationProps {
  routes: {
    from: string
    to: string
    status: "active" | "delayed" | "disrupted"
  }[]
}

export function RouteAnimation({ routes }: RouteAnimationProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500 dark:bg-emerald-600"
      case "delayed":
        return "bg-amber-500 dark:bg-amber-600"
      case "disrupted":
        return "bg-red-500 dark:bg-red-600"
      default:
        return "bg-blue-500 dark:bg-blue-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
      case "delayed":
        return <Clock className="h-3 w-3 text-amber-500 dark:text-amber-400" />
      case "disrupted":
        return <AlertTriangle className="h-3 w-3 text-red-500 dark:text-red-400" />
      default:
        return null
    }
  }

  return (
    <Card className="overflow-hidden border border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Global Supply Routes</span>
          <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 text-xs backdrop-blur-sm">
            Live Status
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
          {/* World Map Background with gradient overlay */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50/90 dark:from-transparent dark:via-slate-900/50 dark:to-slate-900/90 z-10"></div>
            <div className="h-full w-full opacity-[0.15] dark:opacity-[0.08] bg-[url('/globe.svg')] bg-center bg-no-repeat bg-contain"></div>
          </div>
          
          {/* Route container */}
          <div className="relative z-20 p-5">
            <div className="space-y-5">
              {routes.map((route, index) => (
                <div key={`${route.from}-${route.to}`} className="relative">
                  <div className="flex justify-between items-center relative">
                    {/* From location */}
                    <div className="flex-1">
                      <div className={`text-sm font-medium text-slate-900 dark:text-slate-200`}>
                        {route.from}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Origin</div>
                    </div>
                    
                    {/* Route line */}
                    <div className="flex-grow-0 flex-shrink-0 w-20 relative h-6 mx-3">
                      {/* Static line */}
                      <div className={`absolute top-1/2 left-0 right-0 h-[2px] bg-slate-200 dark:bg-slate-700 rounded`}></div>
                      
                      {/* Animated route progress */}
                      <motion.div 
                        className={`absolute top-1/2 left-0 h-[2px] rounded ${getStatusColor(route.status)}`}
                        style={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ 
                          duration: route.status === "disrupted" ? 4 : route.status === "delayed" ? 3 : 2,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Moving dot */}
                      <motion.div
                        className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ${getStatusColor(route.status)} shadow-md shadow-${route.status === "active" ? "emerald" : route.status === "delayed" ? "amber" : "red"}-500/20`}
                        initial={{ left: "0%" }}
                        animate={{ left: "100%" }}
                        transition={{ 
                          duration: route.status === "disrupted" ? 4 : route.status === "delayed" ? 3 : 2,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                    
                    {/* To location */}
                    <div className="flex-1 text-right">
                      <div className={`text-sm font-medium text-slate-900 dark:text-slate-200`}>
                        {route.to}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Destination</div>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className={`
                    flex items-center mt-1.5 ml-0.5 text-xs
                    ${route.status === "active" ? "text-emerald-600 dark:text-emerald-400" : 
                      route.status === "delayed" ? "text-amber-600 dark:text-amber-400" : 
                      "text-red-600 dark:text-red-400"}
                  `}>
                    {getStatusIcon(route.status)}
                    <span className="ml-1 capitalize">{route.status}</span>
                    {route.status === "delayed" && <span className="ml-1 text-slate-500 dark:text-slate-400">(+2 days)</span>}
                    {route.status === "disrupted" && <span className="ml-1 text-slate-500 dark:text-slate-400">(Port closure)</span>}
                  </div>
                  
                  {/* Separator line */}
                  {index < routes.length - 1 && (
                    <div className="absolute -bottom-3 left-0 right-0 h-px bg-slate-200/70 dark:bg-slate-700/30"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer with legend */}
        <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-600 mr-1.5" />
              <span>Active</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-600 mr-1.5" />
              <span>Delayed</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-600 mr-1.5" />
              <span>Disrupted</span>
            </div>
          </div>
          <div>
            <Badge variant="outline" className="text-xs bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="mr-1">View All</span>
              <ArrowRight className="h-3 w-3" />
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}