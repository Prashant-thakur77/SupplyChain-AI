"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, Repeat2, Network, Zap, BarChart3, Target } from "lucide-react";
import { useState } from "react";

interface AnimatedFeatureCardProps {
  title: string;
  description: string;
  className?: string;
  stepIndex?: number;
}

const AnimatedFeatureCard: React.FC<AnimatedFeatureCardProps> = ({
  title,
  description,
  className,
  stepIndex = 0
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Customize content based on step
  const getCardContent = (step: number) => {
    switch (step) {
      case 0:
        return {
          title: "Digital Twin Mapping",
          subtitle: "Build interactive supply chain networks",
          description: "Create comprehensive digital representations of your supply chain network with real-time visibility and risk monitoring capabilities.",
          features: ["Real-time Monitoring", "Network Visualization", "Risk Detection", "Interactive Dashboard"],
          icon: Network
        };
      case 1:
        return {
          title: "Disruption Simulation", 
          subtitle: "AI-powered scenario modeling",
          description: "Run advanced Monte Carlo simulations for natural disasters, supplier failures, and market disruptions with predictive analytics and risk assessment.",
          features: ["Monte Carlo Analysis", "Risk Scenarios", "Impact Prediction", "Failure Modeling"],
          icon: Zap
        };
      case 2:
        return {
          title: "Impact Assessment",
          subtitle: "Real-time analytics and insights", 
          description: "Visualize cost implications, delivery delays, and cascading effects across your entire network with dynamic analytics and performance tracking.",
          features: ["Cost Analysis", "Delay Tracking", "Performance KPIs", "Cascading Effects"],
          icon: BarChart3
        };
      case 3:
        return {
          title: "Smart Strategies",
          subtitle: "AI-generated recommendations",
          description: "Receive AI-generated recommendations for cost-effective mitigation strategies, alternative routing, and ROI-optimized planning solutions.",
          features: ["AI Recommendations", "ROI Optimization", "Alternative Routes", "Risk Mitigation"],
          icon: Target
        };
      default:
        return {
          title: title,
          subtitle: "Explore the fundamentals",
          description: description,
          features: ["Advanced Analytics", "Real-time Data", "Smart Insights", "Automated Actions"],
          icon: Network
        };
    }
  };

  const cardContent = getCardContent(stepIndex);

  // Unified blue color scheme for all cards
  const colors = {
    iconColor: "text-blue-400",
    gradientHover: "hover:from-blue-500/8 hover:via-blue-500/4 hover:to-transparent dark:hover:from-blue-500/12 dark:hover:via-blue-500/6 dark:hover:to-transparent",
    hoverColor: "group-hover/start:text-blue-300 dark:group-hover/start:text-blue-300 group-hover/start:text-blue-600",
    shadowColor: "shadow-[0_0_25px_rgba(59,130,246,0.4)]",
    iconBg: "bg-gradient-to-br from-blue-500/15 via-blue-500/8 to-transparent",
    centerIconColor: "text-blue-300 dark:text-blue-300 text-blue-600"
  };

  const IconComponent = cardContent.icon;

  return (
    <div
      className={cn(
        "relative w-full max-w-[280px] h-[340px] group [perspective:2000px]",
        className
      )}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative w-full h-full",
          "[transform-style:preserve-3d]",
          "transition-all duration-700",
          isFlipped
            ? "[transform:rotateY(180deg)]"
            : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full",
            "[backface-visibility:hidden] [transform:rotateY(0deg)]",
            "overflow-hidden rounded-2xl",
            // Light mode styling
            "bg-gradient-to-br from-white via-blue-50/50 to-blue-100/30",
            "border border-blue-200/60",
            "shadow-lg shadow-blue-900/10",
            // Dark mode styling (unchanged)
            "dark:bg-gradient-to-br dark:from-blue-950/90 dark:via-slate-900/95 dark:to-blue-950/90",
            "dark:border-blue-800/30",
            "dark:shadow-lg dark:shadow-blue-900/20",
            "transition-all duration-700",
            // Hover effects for both modes
            "group-hover:shadow-xl group-hover:shadow-blue-900/20 dark:group-hover:shadow-blue-800/30",
            "backdrop-blur-sm",
            isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="relative h-full overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-blue-600/3 to-blue-700/8 dark:from-blue-900/20 dark:via-slate-900/40 dark:to-blue-900/30" />
            
            {/* Particle animation area */}
            <div className="absolute inset-0 flex items-start justify-center pt-16">
              <div className="relative w-[200px] h-[140px] flex items-center justify-center">
                {/* Central icon */}
                <div className="relative z-20 w-16 h-16 rounded-full bg-blue-100/80 border border-blue-300/60 dark:bg-blue-500/20 dark:border-blue-400/30 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                  <IconComponent className={cn("w-8 h-8", colors.centerIconColor)} />
                </div>
                
                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute w-[35px] h-[35px]",
                      "rounded-full",
                      "animate-[scale_3s_linear_infinite]",
                      "opacity-0",
                      "bg-blue-200/40 border border-blue-300/60 dark:bg-blue-400/20 dark:border-blue-400/40",
                      colors.shadowColor,
                      "group-hover:animate-[scale_2.5s_linear_infinite]"
                    )}
                    style={{
                      animationDelay: `${i * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-3 dark:opacity-5" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59,130,246,0.15) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white leading-snug tracking-tighter transition-all duration-500 ease-out-expo group-hover:translate-y-[-4px]">
                  {cardContent.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-blue-200 tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-4px] delay-[50ms]">
                  {cardContent.subtitle}
                </p>
              </div>
              <div className="relative group/icon flex-shrink-0">
                <div
                  className={cn(
                    "absolute inset-[-8px] rounded-lg transition-opacity duration-300",
                    colors.iconBg
                  )}
                />
                <Repeat2 className={cn(
                  "relative z-10 w-4 h-4 transition-transform duration-300 group-hover/icon:scale-110 group-hover/icon:-rotate-12",
                  colors.iconColor
                )} />
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            "p-6 rounded-2xl",
            // Light mode styling
            "bg-gradient-to-br from-white via-blue-50/50 to-blue-100/30",
            "border border-blue-200/60",
            "shadow-lg shadow-blue-900/10",
            // Dark mode styling (unchanged)
            "dark:bg-gradient-to-br dark:from-blue-950/90 dark:via-slate-900/95 dark:to-blue-950/90",
            "dark:border-blue-800/30",
            "dark:shadow-lg dark:shadow-blue-900/20",
            "flex flex-col",
            "transition-all duration-700",
            // Hover effects for both modes
            "group-hover:shadow-xl group-hover:shadow-blue-900/20 dark:group-hover:shadow-blue-800/30",
            "backdrop-blur-sm",
            !isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-blue-600/3 to-blue-700/8 dark:from-blue-900/20 dark:via-slate-900/40 dark:to-blue-900/30 rounded-2xl" />
          
          <div className="relative z-10 flex-1 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white leading-snug tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-2px]">
                {cardContent.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-blue-100 tracking-tight leading-relaxed transition-all duration-500 ease-out-expo group-hover:translate-y-[-2px]">
                {cardContent.description}
              </p>
            </div>

            <div className="space-y-2">
              {cardContent.features.map((feature, index) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-blue-200 transition-all duration-500"
                  style={{
                    transform: isFlipped
                      ? "translateX(0)"
                      : "translateX(-10px)",
                    opacity: isFlipped ? 1 : 0,
                    transitionDelay: `${index * 100 + 200}ms`,
                  }}
                >
                  <ArrowRight className={cn("w-3 h-3", colors.iconColor)} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-blue-200/50 dark:border-blue-700/30">
            <div
              className={cn(
                "group/start relative",
                "flex items-center justify-between",
                "p-3 -m-3 rounded-xl",
                "transition-all duration-300",
                "bg-gradient-to-r from-blue-50/50 via-blue-100/30 to-blue-50/50 dark:from-blue-900/30 dark:via-blue-900/20 dark:to-blue-900/30",
                colors.gradientHover,
                "hover:scale-[1.02] hover:cursor-pointer"
              )}
            >
              <span className={cn(
                "text-sm font-medium text-slate-700 dark:text-white transition-colors duration-300",
                colors.hoverColor
              )}>
                Learn more
              </span>
              <div className="relative group/icon">
                <div
                  className={cn(
                    "absolute inset-[-6px] rounded-lg transition-all duration-300",
                    colors.iconBg,
                    "opacity-0 group-hover/start:opacity-100 scale-90 group-hover/start:scale-100"
                  )}
                />
                <ArrowRight className={cn(
                  "relative z-10 w-4 h-4 transition-all duration-300 group-hover/start:translate-x-0.5 group-hover/start:scale-110",
                  colors.iconColor
                )} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale {
          0% {
            transform: scale(2);
            opacity: 0;
          }
          50% {
            transform: translate(0px, -5px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(0px, 5px) scale(0.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedFeatureCard; 