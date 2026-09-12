"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface OrderStateProps {
  states: {
    status: string
    icon: React.ReactNode
    description: string
    isActive: boolean
  }[]
  className?: string
}

export function OrderState({ states, className }: OrderStateProps) {
  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <div className="flex flex-col md:flex-row items-start justify-between gap-8 md:gap-2 relative">
        {states.map((state, index) => (
          <div
            key={state.status}
            className="flex flex-col items-center text-center w-full md:w-1/5"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                state.isActive
                  ? "bg-blue-700 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {state.icon}
            </motion.div>
            <h3 className="text-sm font-medium mb-1">{state.status}</h3>
            <p className="text-xs text-muted-foreground">{state.description}</p>
            
            {index < states.length - 1 && (
              <div className="hidden md:block h-[2px] w-full bg-muted absolute top-5 left-0 transform translate-x-1/2" style={{
                left: `${(index + 0.5) * 20}%`,
                width: '20%'
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}