"use client";

import { useEffect } from "react";
import Link from "next/link";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import animationData from "@/public/animations/404-animation.json";

export default function NotFound() {
  useEffect(() => {
    // Update document title for accessibility
    document.title = "Page Not Found - SupplyChain AI";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-5xl w-full">
        {/* Animated Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16"
        >
          {/* Lottie Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full md:w-1/2 max-w-md mx-auto shadow-lg rounded-2xl overflow-hidden bg-card"
          >
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              style={{ width: "100%", height: "auto" }}
              className="p-8"
            />
          </motion.div>

          {/* Content */}
          <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Page Not Found
              </h1>
              <p className="text-lg text-muted-foreground max-w-md md:mx-0 mx-auto leading-relaxed">
                The page you're looking for doesn't exist or has been moved. 
                Let's get you back to your supply chain dashboard.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center"
            >
              <Button asChild size="lg" className="shadow-md">
                <Link href="/" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="pt-8 border-t border-border/50"
            >
              <p className="text-sm text-muted-foreground">
                Need help? Contact our support team or explore our{" "}
                <Link 
                  href="/digital-twin" 
                  className="text-primary hover:underline font-medium"
                >
                  Digital Twin
                </Link>{" "}
                and{" "}
                <Link 
                  href="/simulation" 
                  className="text-primary hover:underline font-medium"
                >
                  Simulation
                </Link>{" "}
                features.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 