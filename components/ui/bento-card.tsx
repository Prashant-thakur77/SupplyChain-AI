"use client"

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BentoCardProps {
  title: string
  value: string
  subtitle: string
  icon?: React.ReactNode
  colors: string[]
  delay?: number
  className?: string
}

export function BentoCard({
  title,
  value,
  subtitle,
  icon,
  colors,
  delay = 0,
  className,
}: BentoCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className={cn("w-full", className)}
    >
      <Card className="relative overflow-hidden h-full">
        <CardContent className="p-6">
          <div className="absolute top-0 right-0 p-4">
            <div className="p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-sm">
              {icon}
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
          <div className="text-3xl font-bold mb-1">{value}</div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          
          {/* Animated gradient background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            {colors.map((color, index) => (
              <motion.div
                key={index}
                className="absolute rounded-full opacity-20"
                style={{
                  background: color,
                  width: '40%',
                  height: '40%',
                  top: `${30 + (index * 10)}%`,
                  left: `${70 - (index * 15)}%`,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  x: [0, 10, 0],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}