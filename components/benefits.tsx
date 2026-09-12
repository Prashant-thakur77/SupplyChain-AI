"use client"

import { motion } from "framer-motion"
import { 
  AlertTriangle, 
  BarChart3, 
  Brain, 
  Clock, 
  DollarSign, 
  LineChart, 
  PieChart,
  Zap
} from "lucide-react"

const BENEFITS = [
  {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "Proactive Risk Management",
    description: "Identify potential disruptions before they occur and implement mitigation strategies."
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: "AI-Driven Recommendations",
    description: "Get intelligent, data-backed suggestions for supply chain optimization."
  },
  {
    icon: <LineChart className="h-6 w-6" />,
    title: "Enhanced Visibility",
    description: "Gain complete transparency across your entire supply chain network."
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Cost Reduction",
    description: "Minimize disruption costs and optimize inventory management."
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Faster Recovery",
    description: "Reduce time-to-recovery with pre-planned alternative strategies."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Real-Time Alerting",
    description: "Receive instant notifications about emerging risks and disruptions."
  },
]

export function Benefits() {
  return (
    <section id="benefits" className="py-16 md:py-24 w-full">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose SupplyChain AI</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform transforms how organizations manage supply chain risk, providing tangible 
            benefits that directly impact your bottom line.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
            >
              <div className="p-3 bg-primary/10 rounded-lg inline-block mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}