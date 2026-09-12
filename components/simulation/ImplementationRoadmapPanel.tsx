import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { X, TrendingUp, CheckCircle, Clock, Shield, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RoadmapStep {
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

interface ImplementationRoadmapPanelProps {
  steps: RoadmapStep[];
  open: boolean;
  onClose: () => void;
  isMobile?: boolean;
  finalizeOpen?: boolean;
}

export const ImplementationRoadmapPanel: React.FC<ImplementationRoadmapPanelProps> = ({
  steps,
  open,
  onClose,
  isMobile = false,
  finalizeOpen = false,
}) => {
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const stepAnimation = {
    hidden: { 
      opacity: 0, 
      x: -30,
      scale: 0.9
    },
    show: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const TimelineStep = ({ step, index, isLast }: { step: RoadmapStep; index: number; isLast: boolean }) => {
    const stepNumber = index + 1;
    const isCompleted = index < 2; // First 2 steps completed for demo
    const isActive = index === 2; // Third step is active
    const isPending = index > 2; // Rest are pending

    return (
      <motion.div
        variants={stepAnimation}
        className="relative flex items-start group"
      >
        {/* Timeline Line */}
        {!isLast && (
          <div className="absolute left-6 top-12 w-0.5 h-20 bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700" />
        )}

        {/* Timeline Node */}
        <div className="relative z-10 flex-shrink-0">
          <motion.div
            className={`
              w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-medium
              transition-all duration-300 shadow-sm
              ${isCompleted 
                ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400' 
                : isActive 
                ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400 animate-pulse' 
                : 'bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isCompleted ? (
              <CheckCircle className="w-5 h-5" />
            ) : isActive ? (
              <Clock className="w-5 h-5" />
            ) : (
              <span>{stepNumber}</span>
            )}
          </motion.div>

          {/* Status Badge */}
          <motion.div
            className="absolute -bottom-1 -right-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Badge
              variant={isCompleted ? "default" : isActive ? "secondary" : "outline"}
              className={`
                text-xs px-1.5 py-0.5 font-medium
                ${isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }
              `}
            >
              {isCompleted ? "Done" : isActive ? "Active" : "Pending"}
            </Badge>
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 ml-4 pb-8">
          <motion.div
            className={`
              rounded-lg border p-4 transition-all duration-300 hover:shadow-md
              ${isCompleted 
                ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800' 
                : isActive 
                ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800' 
                : 'bg-gray-50/50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-700'
              }
            `}
            whileHover={{ 
              y: -2,
              transition: { type: "spring", stiffness: 300 }
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className={`
                font-semibold text-sm leading-5
                ${isCompleted 
                  ? 'text-green-800 dark:text-green-300' 
                  : isActive 
                  ? 'text-blue-800 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300'
                }
              `}>
                {step.title}
              </h3>
              
              <div className={`
                p-1.5 rounded-md ml-2 flex-shrink-0
                ${isCompleted 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' 
                  : isActive 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }
              `}>
                {step.icon}
              </div>
            </div>

            <p className={`
              text-xs leading-4
              ${isCompleted 
                ? 'text-green-700 dark:text-green-400' 
                : isActive 
                ? 'text-blue-700 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400'
              }
            `}>
              {step.description}
            </p>

            {/* Progress Indicator */}
            {(isCompleted || isActive) && (
              <motion.div
                className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
              >
                <motion.div
                  className={`
                    h-full rounded-full
                    ${isCompleted 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
                    }
                  `}
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? "100%" : "60%" }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 1.2 }}
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  };

  const RoadmapContent = () => (
    <motion.div
      variants={containerAnimation}
      initial="hidden"
      animate="show"
      className="space-y-2"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Implementation Roadmap
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Strategic execution timeline with progress tracking
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {steps.filter((_, i) => i < 2).length} of {steps.length} Complete
          </Badge>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div className="space-y-0">
          {steps.map((step, index) => (
            <TimelineStep
              key={`${step.title}-${index}`}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Summary Footer */}
      <motion.div
        className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Risk Mitigation Progress
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Implementation is on track with 2 completed milestones. Next phase focuses on system integration and testing.
        </p>
      </motion.div>
    </motion.div>
  );

  // Panel content
  const content = (
    <motion.div
      initial={{ x: isMobile ? 0 : 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: isMobile ? 0 : 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full flex flex-col"
    >
      <Card className="border border-white/30 dark:border-slate-700/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/30 rounded-2xl h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-2 p-6 pb-4 border-b border-white/20 dark:border-slate-700/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Implementation Roadmap</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Strategic execution timeline with progress tracking
              </CardDescription>
            </div>
          </div>
          {!isMobile && (
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Close roadmap panel"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 p-6 overflow-y-auto">
          <RoadmapContent />
        </CardContent>
      </Card>
    </motion.div>
  );

  // Desktop: fixed side panel, Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <DrawerTitle className="text-lg font-semibold">Implementation Roadmap</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <button 
                className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Close roadmap drawer"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          <div className="p-6 overflow-y-auto">
            <RoadmapContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop side panel
  if (!open) return null;

  return (
    <div className={`fixed right-0 top-[80px] h-[calc(100vh-80px)] w-[400px] z-50 p-3 transition-transform duration-300 ease-in-out ${
      finalizeOpen ? 'translate-x-[-450px]' : ''
    }`}>
      {content}
    </div>
  );
};

export default ImplementationRoadmapPanel; 