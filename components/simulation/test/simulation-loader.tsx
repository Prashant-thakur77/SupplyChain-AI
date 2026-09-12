"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Lottie from "lottie-react"
import searchingAnimation from "@/public/animations/searchin-animation.json"
import gradientGlobeAnimation from "@/public/animations/gradient-globe.json"

type Props = {
  progress: number
}

interface AnimationPhase {
  animation: any
  text: string
  subtext: string
}

const animationPhases: AnimationPhase[] = [
  {
    animation: searchingAnimation,
    text: "Analyzing Supply Chain",
    subtext: "Identifying critical pathways and dependencies..."
  },
  {
    animation: gradientGlobeAnimation,
    text: "Running Global Simulation",
    subtext: "Processing disruption scenarios across networks..."
  }
]

export function SimulationLoader({ progress }: Props) {
  const [currentPhase, setCurrentPhase] = useState(0)

  useEffect(() => {
    // Switch animation based on progress
    if (progress < 50) {
      setCurrentPhase(0) // First half: searching animation
    } else {
      setCurrentPhase(1) // Second half: globe animation
    }
  }, [progress])

  const fadeVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.9,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.9,
      y: -20,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  }

  const textVariants = {
    hidden: { 
      opacity: 0,
      y: 10
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3,
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  }

  const progressVariants = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: progress / 100,
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-start pt-0 min-h-full w-full dark:bg-transparent">
      <div className="w-full max-w-4xl flex flex-col items-center justify-start px-8">
        {/* Animation Container */}
        <div 
          className="relative w-[600px] h-[400px] pb-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase}
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
              <Lottie
                animationData={animationPhases[currentPhase].animation}
                className="w-full h-full"
                loop={true}
                autoplay={true}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center mb-6"
          >
            <h3 className="text-4xl font-semibold mb-3">
              {animationPhases[currentPhase].text}
            </h3>
            <p className="text-muted-foreground text-lg">
              {animationPhases[currentPhase].subtext}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="w-80 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-medium">Progress</span>
            <span className="text-lg text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              variants={progressVariants}
              initial="hidden"
              animate="visible"
              className="h-full bg-black dark:bg-white origin-left"
              style={{ transformOrigin: "left" }}
            />
          </div>
        </div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 text-lg text-muted-foreground"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-3 h-3 border-2 border-black dark:border-white border-t-transparent rounded-full"
          />
          <span>
            {progress < 50 ? "Analyzing data patterns..." : "Generating insights..."}
          </span>
        </motion.div>
      </div>
    </div>
  )
}
