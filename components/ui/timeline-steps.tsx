"use client";
import { motion } from "framer-motion";

const TIMELINE_STEPS = [
  {
    title: "Build Digital Twin",
    description: "Map your supply chain with an interactive drag-and-drop editor.",
    color: "from-blue-600 to-blue-400",
  },
  {
    title: "Simulate Disruption",
    description: "Run AI-powered scenarios for natural disasters, supplier failures, and more.",
    color: "from-rose-500 to-pink-400",
  },
  {
    title: "Assess Impact",
    description: "Visualize cost, delay, and inventory effects in real time.",
    color: "from-violet-600 to-indigo-400",
  },
  {
    title: "Get Recommendations",
    description: "Receive smart, cost-effective mitigation strategies and ROI analysis.",
    color: "from-amber-500 to-yellow-400",
  },
];

export function TimelineSteps() {
  return (
    <section className="w-full max-w-5xl mx-auto py-12 md:py-20">
      <h2 className="text-2xl md:text-4xl font-bold text-center mb-10 bg-gradient-to-r from-blue-700 via-blue-400 to-rose-400 bg-clip-text text-transparent">
        How It Works
      </h2>
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
        {TIMELINE_STEPS.map((step, idx) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: idx * 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center md:w-1/4 px-2"
          >
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
              <span className="text-2xl font-bold text-white">{idx + 1}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-200">{step.title}</h3>
            <p className="text-muted-foreground text-sm md:text-base">{step.description}</p>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div className="hidden md:block absolute right-0 top-1/2 w-24 h-1 bg-gradient-to-r from-blue-200 to-rose-200 opacity-60" style={{ left: '100%' }} />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}