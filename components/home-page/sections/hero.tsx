'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { GlowyButton } from "../components/GlowyButton";

const FUIHeroWithGridSimple = () => {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP animations for Hero section elements on page load
    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll('.word-span');
      gsap.from(words, {
        y: 30,
        opacity: 0,
        stagger: 0.08,
        duration: 0.9,
        ease: "power3.out"
      });
    }

    if (subheadlineRef.current) {
      gsap.from(subheadlineRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: "power2.out"
      });
    }

    if (badgeRef.current) {
      gsap.from(badgeRef.current, {
        opacity: 0,
        duration: 0.8,
        delay: 0.1
      });
    }

    if (buttonsRef.current) {
      gsap.from(buttonsRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        ease: "power2.out"
      });
    }

    if (socialRef.current) {
      gsap.from(socialRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.7,
        ease: "power2.out"
      });
    }
  }, []);

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1000;
    let start: number | null = null;
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
    
    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeOutQuint(progress);
      
      window.scrollTo({ top: startPosition + (distance * easeProgress), behavior: 'auto' });
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };
    requestAnimationFrame(animation);
  };

  const titleText = "Know Every Risk Before It Becomes a Crisis";
  const words = titleText.split(" ");

  return (
    <section className="relative min-h-screen w-full pt-28 lg:pt-36 pb-20 overflow-hidden bg-theme-bg-primary flex items-center justify-center">
      {/* Radial Gradient Glow behind text */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(39,72,232,0.08) 0%, transparent 60%)' }}
        />
      </div>

      {/* Subtle Dot Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.2]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border-default) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          
          <div className="space-y-8 max-w-4xl flex flex-col items-center">
            {/* Pill Badge */}
            <div 
              ref={badgeRef}
              className="inline-flex items-center gap-2 py-[5px] px-[14px] rounded-theme-pill bg-theme-blue-soft border border-theme-blue/20 relative"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-theme-blue dot-pulse" />
              <span className="text-[0.68rem] font-[600] text-theme-blue uppercase tracking-[0.1em] font-mono">
                Powered by Multi-Agent AI
              </span>
            </div>

            {/* Headline H1 */}
            <h1 
              ref={headlineRef}
              className="text-[clamp(3rem,6vw,5.5rem)] font-[800] tracking-[-0.04em] leading-[1.0] text-theme-text-primary max-w-[900px] text-center"
            >
              {words.map((word, i) => (
                <span 
                  key={i} 
                  className={`word-span inline-block mr-[0.25em] ${word === "Every" || word === "Risk" ? "text-theme-blue" : ""}`}
                >
                  {word}
                </span>
              ))}
            </h1>

            {/* Subtext */}
            <p 
              ref={subheadlineRef}
              className="text-[1.05rem] font-normal text-theme-text-secondary leading-[1.7] max-w-[500px] mx-auto text-center"
            >
              We simulate your supply chain as a living digital twin and deploy autonomous AI agents to surface risks before they cascade into disruptions.
            </p>

            {/* Buttons */}
            <div 
              ref={buttonsRef}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full"
            >
              <GlowyButton href="/dashboard" className="w-full sm:w-auto">
                Get Started
              </GlowyButton>
              <GlowyButton 
                href="#how-it-works" 
                variant="ghost" 
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => smoothScroll(e, 'how-it-works')}
                className="w-full sm:w-auto text-theme-text-primary border-theme-border-default hover:bg-theme-bg-secondary"
              >
                See It In Action &rarr;
              </GlowyButton>
            </div>

            {/* Social Proof */}
            <div 
              ref={socialRef}
              className="flex flex-col items-center gap-3 pt-6"
            >
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {['US', 'UK', 'DE', 'SG', 'JP'].map((country, i) => (
                  <div 
                    key={i} 
                    className="h-[28px] flex items-center justify-center rounded-theme-sm bg-theme-bg-secondary border border-theme-border-subtle text-[0.72rem] font-[600] text-theme-text-secondary px-[10px] py-[4px] select-none"
                  >
                    {country}
                  </div>
                ))}
              </div>
              <p className="text-[0.8rem] text-theme-text-muted">
                Trusted by logistics teams across 40+ countries
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Section Divider */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <hr className="border-t border-[#E8E3DC]" />
      </div>
      
      {/* Inline styles for custom dot pulse */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dot-pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .dot-pulse {
          animation: dot-pulse 2s ease-in-out infinite;
        }
      `}} />
    </section>
  );
};

export default FUIHeroWithGridSimple;
