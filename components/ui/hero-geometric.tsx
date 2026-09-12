"use client"
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Badge } from "./badge";
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe, 
  BarChart3,
  Network,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

// Animated supply chain nodes
function SupplyChainNode({ 
  x, 
  y, 
  size = "md", 
  status = "normal",
  delay = 0,
  label,
  onClick
}: {
  x: string;
  y: string;
  size?: "sm" | "md" | "lg";
  status?: "normal" | "warning" | "critical" | "good";
  delay?: number;
  label?: string;
  onClick?: () => void;
}) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6"
  };

  const statusClasses = {
    normal: "bg-blue-500 shadow-blue-500/50",
    warning: "bg-amber-500 shadow-amber-500/50",
    critical: "bg-red-500 shadow-red-500/50 animate-pulse",
    good: "bg-green-500 shadow-green-500/50"
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="absolute cursor-pointer group"
      style={{ left: x, top: y }}
      onClick={onClick}
    >
      <div className={cn(
        "rounded-full border-2 border-white/20",
        sizeClasses[size],
        statusClasses[status],
        "shadow-lg backdrop-blur-sm",
        "hover:scale-125 transition-all duration-300"
      )} />
      {label && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-slate-900/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {label}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Animated connection lines
function ConnectionLine({ 
  x1, y1, x2, y2, delay = 0, status = "normal" 
}: { 
  x1: string; y1: string; x2: string; y2: string; delay?: number; status?: "normal" | "disrupted" 
}) {
  const pathLength = Math.sqrt(
    Math.pow(parseFloat(x2) - parseFloat(x1), 2) + 
    Math.pow(parseFloat(y2) - parseFloat(y1), 2)
  );

  return (
    <motion.svg
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay }}
    >
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={status === "disrupted" ? "#ef4444" : "#3b82f6"}
        strokeWidth="2"
        strokeDasharray={status === "disrupted" ? "5,5" : "none"}
        className="drop-shadow-sm"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: delay + 0.5 }}
      />
    </motion.svg>
  );
}

// Real-time metrics display
function MetricCard({ title, value, change, icon: Icon, delay = 0 }: {
  title: string;
  value: string;
  change: string;
  icon: any;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-blue-400" />
        <span className="text-xs text-green-400 font-medium">{change}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-300">{title}</div>
    </motion.div>
  );
}

export function HeroGeometric() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const [activeDemo, setActiveDemo] = useState<"normal" | "disrupted" | "recovered">("normal");
  const [currentMetrics, setCurrentMetrics] = useState({
    riskScore: "23",
    efficiency: "94%",
    savings: "$2.4M"
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeDemo === "normal") {
        setCurrentMetrics({
          riskScore: (20 + Math.floor(Math.random() * 10)).toString(),
          efficiency: (92 + Math.floor(Math.random() * 5)).toString() + "%",
          savings: "$" + (2.2 + Math.random() * 0.6).toFixed(1) + "M"
        });
      } else if (activeDemo === "disrupted") {
        setCurrentMetrics({
          riskScore: (65 + Math.floor(Math.random() * 20)).toString(),
          efficiency: (75 + Math.floor(Math.random() * 10)).toString() + "%",
          savings: "$" + (1.1 + Math.random() * 0.4).toFixed(1) + "M"
        });
      } else {
        setCurrentMetrics({
          riskScore: (15 + Math.floor(Math.random() * 8)).toString(),
          efficiency: (96 + Math.floor(Math.random() * 3)).toString() + "%",
          savings: "$" + (2.8 + Math.random() * 0.4).toFixed(1) + "M"
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeDemo]);

  // Use state to track if component is mounted on client-side
  const [isMounted, setIsMounted] = useState(false);
  
  // Set isMounted to true when component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return (
    <div ref={ref} className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {isMounted && [...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              opacity: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10">
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Badge variant="outline" className="mb-6 bg-blue-500/10 border-blue-500/30 text-blue-300">
                  <Zap className="w-3 h-3 mr-1" />
                  AI-Powered Intelligence
                </Badge>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Supply Chain
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    Resilience
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Redefined
                  </span>
                </h1>

                <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                  Transform disruptions into opportunities with AI-driven insights, 
                  real-time monitoring, and predictive analytics that keep your supply chain resilient.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
                    <Link href="/dashboard" className="flex items-center">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                    <Link href="#demo">
                      Watch Demo
                    </Link>
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 pt-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">500+</div>
                    <div className="text-sm text-slate-400">Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">99.9%</div>
                    <div className="text-sm text-slate-400">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">$50M+</div>
                    <div className="text-sm text-slate-400">Saved</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Interactive Demo */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative bg-slate-800/30 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6"
              >
                {/* Demo Controls */}
                <div className="flex gap-2 mb-6">
                  <Button
                    size="sm"
                    variant={activeDemo === "normal" ? "default" : "ghost"}
                    onClick={() => setActiveDemo("normal")}
                    className="text-xs"
                  >
                    Normal Operations
                  </Button>
                  <Button
                    size="sm"
                    variant={activeDemo === "disrupted" ? "default" : "ghost"}
                    onClick={() => setActiveDemo("disrupted")}
                    className="text-xs"
                  >
                    Disruption Event
                  </Button>
                  <Button
                    size="sm"
                    variant={activeDemo === "recovered" ? "default" : "ghost"}
                    onClick={() => setActiveDemo("recovered")}
                    className="text-xs"
                  >
                    AI Recovery
                  </Button>
                </div>

                {/* Supply Chain Visualization */}
                <div className="relative h-64 bg-slate-900/50 rounded-lg mb-6 overflow-hidden">
                  {/* Supplier Nodes */}
                  <SupplyChainNode 
                    x="10%" y="20%" 
                    status={activeDemo === "disrupted" ? "critical" : activeDemo === "recovered" ? "good" : "normal"}
                    label="Supplier A"
                    delay={0.5}
                  />
                  <SupplyChainNode 
                    x="15%" y="60%" 
                    status={activeDemo === "disrupted" ? "warning" : "normal"}
                    label="Supplier B"
                    delay={0.7}
                  />
                  <SupplyChainNode 
                    x="20%" y="40%" 
                    status="normal"
                    label="Supplier C"
                    delay={0.9}
                  />

                  {/* Manufacturing */}
                  <SupplyChainNode 
                    x="50%" y="40%" 
                    size="lg"
                    status={activeDemo === "disrupted" ? "warning" : "normal"}
                    label="Manufacturing"
                    delay={1.1}
                  />

                  {/* Distribution */}
                  <SupplyChainNode 
                    x="80%" y="20%" 
                    status="normal"
                    label="Distribution A"
                    delay={1.3}
                  />
                  <SupplyChainNode 
                    x="85%" y="60%" 
                    status="normal"
                    label="Distribution B"
                    delay={1.5}
                  />

                  {/* Connection Lines */}
                  <ConnectionLine 
                    x1="10%" y1="20%" x2="50%" y2="40%" 
                    status={activeDemo === "disrupted" ? "disrupted" : "normal"}
                    delay={1.7}
                  />
                  <ConnectionLine 
                    x1="15%" y1="60%" x2="50%" y2="40%" 
                    status={activeDemo === "disrupted" ? "disrupted" : "normal"}
                    delay={1.9}
                  />
                  <ConnectionLine 
                    x1="20%" y1="40%" x2="50%" y2="40%" 
                    delay={2.1}
                  />
                  <ConnectionLine 
                    x1="50%" y1="40%" x2="80%" y2="20%" 
                    delay={2.3}
                  />
                  <ConnectionLine 
                    x1="50%" y1="40%" x2="85%" y2="60%" 
                    delay={2.5}
                  />

                  {/* Status overlay */}
                  {activeDemo === "disrupted" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-4 left-4 flex items-center gap-2 bg-red-900/80 text-red-200 px-3 py-2 rounded-lg text-sm"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Port Disruption Detected
                    </motion.div>
                  )}

                  {activeDemo === "recovered" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-4 left-4 flex items-center gap-2 bg-green-900/80 text-green-200 px-3 py-2 rounded-lg text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      AI Alternative Routes Active
                    </motion.div>
                  )}
                </div>

                {/* Real-time Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    title="Risk Score"
                    value={currentMetrics.riskScore}
                    change={activeDemo === "disrupted" ? "+45%" : activeDemo === "recovered" ? "-25%" : "+2%"}
                    icon={Shield}
                    delay={2.7}
                  />
                  <MetricCard
                    title="Efficiency"
                    value={currentMetrics.efficiency}
                    change={activeDemo === "disrupted" ? "-18%" : activeDemo === "recovered" ? "+8%" : "+1%"}
                    icon={TrendingUp}
                    delay={2.9}
                  />
                  <MetricCard
                    title="Cost Savings"
                    value={currentMetrics.savings}
                    change={activeDemo === "disrupted" ? "-52%" : activeDemo === "recovered" ? "+15%" : "+5%"}
                    icon={BarChart3}
                    delay={3.1}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}