"use client"

import Link from "next/link"

export function Footer() {
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

  return (
    <footer className="w-full bg-background py-16 border-t border-border/40">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] md:pr-16 gap-12 md:gap-24">
          
          {}
          <div>
            <div className="flex items-center gap-2.5 mb-4 group">
              <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 shadow-[0_2px_12px_rgba(11,79,255,0.05)]">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h2 className="text-[22px] font-[700] text-foreground tracking-tight">SupplyChain AI 
                (PRODUCT ROUTE INTELLIGENCE AND SUPPLY MAPPING)
              </h2>
            </div>
            <p className="text-[14px] font-[400] text-muted-foreground max-w-xs leading-relaxed">
              Empowering global supply chains with autonomous AI and digital twin resilience for risk mitigation and supply chain optimization.
            </p>
          </div>

          <div className="flex gap-16 md:gap-32 md:ml-auto flex-wrap">
            {}
            <div>
              <h3 className="text-[15px] font-[600] text-foreground mb-6">Resources</h3>
              <ul className="space-y-3.5">
                <li><Link href="/docs" className="text-[14px] text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="/privacy" className="text-[14px] text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-[14px] text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {}
            <div>
              <h3 className="text-[15px] font-[600] text-foreground mb-6">Platform</h3>
              <ul className="space-y-3.5">
                <li><a href="#top" onClick={(e) => smoothScroll(e, 'top')} className="text-[14px] text-muted-foreground hover:text-primary transition-colors">Home</a></li>
                <li><a href="#how-it-works" onClick={(e) => smoothScroll(e, 'how-it-works')} className="text-[14px] text-muted-foreground hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#benefits" onClick={(e) => smoothScroll(e, 'benefits')} className="text-[14px] text-muted-foreground hover:text-primary transition-colors">Analytics</a></li>
                <li><a href="#features" onClick={(e) => smoothScroll(e, 'features')} className="text-[14px] text-muted-foreground hover:text-primary transition-colors">Features</a></li>
              </ul>
            </div>
          </div>
        </div>

        {}
        <div className="mt-20 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[14px] text-muted-foreground">© {new Date().getFullYear()} SupplyChain AI Systems. All rights reserved.</p>
          <p className="text-[14px] text-muted-foreground">Developed by <span className="font-medium text-foreground">STACK OVERFLOWED</span></p>
        </div>
      </div>
    </footer>
  )
}