'use client';

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GitBranch, Zap, BarChart2 } from "lucide-react";
import { GlowyButton } from "../components/GlowyButton";

gsap.registerPlugin(ScrollTrigger);

export function TimelineSteps() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      // Scroll reveal for header
      const header = sectionRef.current.querySelector(".section-header");
      if (header) {
        gsap.from(header, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: header,
            start: "top 85%"
          }
        });
      }

      // Scroll reveal for cards with stagger
      const cards = sectionRef.current.querySelectorAll(".feature-card");
      if (cards.length > 0) {
        gsap.from(cards, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cards[0],
            start: "top 85%"
          }
        });
      }
    }
  }, []);

  return (
    <section 
      id="how-it-works" 
      ref={sectionRef} 
      className="w-full py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-theme-bg-secondary"
    >
      <div className="max-w-[1120px] mx-auto">
        {/* Header Section */}
        <div className="section-header text-center mb-24">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-theme-pill bg-theme-blue-soft border border-theme-blue/20">
            <span className="eyebrow-label text-theme-blue">
              PLATFORM OVERVIEW
            </span>
          </div>
          
          <h2 className="text-[44px] md:text-[48px] font-[700] tracking-[-0.025em] text-theme-text-primary mb-6 leading-tight">
            Precision-Grade Network Intelligence
          </h2>
          
          <p className="text-[1.05rem] font-normal text-theme-text-secondary leading-[1.68] max-w-3xl mx-auto">
            Map, stress-test, and harden your operational networks with a unified platform engineered for proactive resilience — not reactive damage control.
          </p>
        </div>

        {/* Feature Cards 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          
          {/* Card 1 */}
          <div className="feature-card flex flex-col p-[28px] rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-md hover:border-theme-border-default group">
            <div className="w-10 h-10 rounded-theme-md flex items-center justify-center mb-6 bg-theme-blue-soft transition-all duration-300 group-hover:scale-105 shrink-0">
              <GitBranch className="w-5 h-5 text-theme-blue" />
            </div>
            <h3 className="text-[0.95rem] font-[600] text-theme-text-primary mb-3">Network Graph Construction</h3>
            <p className="text-[0.85rem] font-normal text-theme-text-secondary leading-[1.65]">
              Model your entire operational network as a live, interactive graph capturing supplier tiers and logistics routes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card flex flex-col p-[28px] rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-md hover:border-theme-border-default group">
            <div className="w-10 h-10 rounded-theme-md flex items-center justify-center mb-6 bg-theme-blue-soft transition-all duration-300 group-hover:scale-105 shrink-0">
              <Zap className="w-5 h-5 text-theme-blue" />
            </div>
            <h3 className="text-[0.95rem] font-[600] text-theme-text-primary mb-3">Fault Injection Probes</h3>
            <p className="text-[0.85rem] font-normal text-theme-text-secondary leading-[1.65]">
              Inject targeted fault vectors, like port closures or demand spikes, to see real-time propagation across your network.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card flex flex-col p-[28px] rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-md hover:border-theme-border-default group">
            <div className="w-10 h-10 rounded-theme-md flex items-center justify-center mb-6 bg-theme-blue-soft transition-all duration-300 group-hover:scale-105 shrink-0">
              <BarChart2 className="w-5 h-5 text-theme-blue" />
            </div>
            <h3 className="text-[0.95rem] font-[600] text-theme-text-primary mb-3">Cascade Impact Analysis</h3>
            <p className="text-[0.85rem] font-normal text-theme-text-secondary leading-[1.65]">
              Quantify financial exposure and operational slowdowns in real time before shipping decisions are made.
            </p>
          </div>

        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <GlowyButton href="/dashboard" className="px-10 py-4 text-base">
            Launch the Platform &rarr;
          </GlowyButton>
        </div>
      </div>
    </section>
  );
}

export default TimelineSteps;