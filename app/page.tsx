"use client"

import { useEffect, useRef, useState } from "react"
import Link from 'next/link'
import { Inter } from 'next/font/google'
import { User, Menu, X } from "lucide-react"
import { Footer } from "@/components/home-page"

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const header = document.querySelector('.nav');
    const headerHeight = header ? (header as HTMLElement).offsetHeight : 0;
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
    <div ref={pageRef} className={`${inter.className} min-h-screen flex flex-col`} style={{ background: '#F6F3EE', color: '#18160F', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{__html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { overflow-x: hidden; position: relative; width: 100%; }
        
        .nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 48px; height: 56px;
          background: rgba(246,243,238,0.92);
          border-bottom: 1px solid #E5DFD6;
          position: sticky; top: 0; z-index: 50;
        }
        @media (max-width: 767px) {
          .nav { padding: 0 20px; }
        }
        .nav-logo { font-weight: 800; font-size: 1rem; letter-spacing: -0.03em; color: #18160F; }
        .nav-links { display: flex; gap: 28px; }
        @media (max-width: 767px) {
          .nav-links { display: none; }
        }
        .nav-links a { font-size: 0.8rem; font-weight: 500; color: #5C5850; text-decoration: none; transition: color 0.15s; }
        .nav-links a:hover { color: #18160F; }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .btn-primary { background: #2748E8; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 0.8rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 0.15s; display: inline-flex; align-items: center; justify-content: center; }
        .btn-primary:hover { background: #1A36D4; }
        .user-circle { width: 32px; height: 32px; border-radius: 50%; background: #EFEBE3; border: 1px solid #E5DFD6; display: flex; align-items: center; justify-content: center; }

        .hero {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 48px; align-items: center;
          padding: 80px 48px 80px;
          max-width: 1200px; margin: 0 auto;
          min-height: calc(100vh - 56px);
        }
        .hero > * { min-width: 0; }
        @media (max-width: 1023px) {
          .hero {
            grid-template-columns: 1fr;
            padding: 40px 24px;
            gap: 32px;
          }
          .dashboard-preview {
            transform: none !important;
          }
          .dashboard-preview:hover {
            transform: none !important;
          }
        }
        .hero-left { display: flex; flex-direction: column; gap: 24px; }

        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: #EEF0FD; color: #2748E8;
          border: 1px solid rgba(39,72,232,0.18);
          border-radius: 100px; padding: 5px 14px;
          font-size: 0.67rem; font-weight: 600; letter-spacing: 0.08em;
          width: fit-content;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #2748E8;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }

        .hero-headline {
          font-size: 3.6rem; font-weight: 800; letter-spacing: -0.04em;
          line-height: 1.0; color: #18160F;
        }
        @media (max-width: 640px) {
          .hero-headline { font-size: 2.5rem; }
        }
        .hero-headline span { color: #2748E8; }
        .hero-sub {
          font-size: 1rem; color: #5C5850; line-height: 1.72; max-width: 400px;
        }
        .cta-row { display: flex; gap: 12px; align-items: center; }
        .btn-hero { background: #2748E8; color: #fff; border: none; border-radius: 8px; padding: 13px 26px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.18s; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
        .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(39,72,232,0.28); }
        .btn-outline { background: transparent; border: 1.5px solid #D6CFC4; color: #18160F; border-radius: 8px; padding: 13px 26px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.18s; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
        .btn-outline:hover { background: #EFEBE3; }

        .trust-row { display: flex; flex-direction: column; gap: 8px; }
        .flag-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .flag-pill { background: #EFEBE3; border: 1px solid #E5DFD6; border-radius: 6px; padding: 4px 10px; font-size: 0.72rem; font-weight: 600; color: #5C5850; }
        .trust-label { font-size: 0.77rem; color: #9C9489; }

        .hero-right { position: relative; }
        .dashboard-preview {
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 24px 80px rgba(24,22,15,0.14);
          transform: perspective(1200px) rotateY(-5deg) rotateX(2deg);
          border: 1px solid #E5DFD6;
          transition: transform 0.3s ease;
        }
        .dashboard-preview:hover {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg);
        }
        .preview-chrome {
          background: #1E1D1B; padding: 10px 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .d-red { background: #FF5F56; } .d-yellow { background: #FFBD2E; } .d-green { background: #27C93F; }
        .preview-title { font-size: 0.72rem; color: rgba(255,255,255,0.5); margin-left: 8px; font-weight: 500; }

        .preview-body { background: #F6F3EE; padding: 16px; }
        .preview-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .preview-h { font-size: 0.9rem; font-weight: 700; color: #18160F; }
        .preview-sub { font-size: 0.65rem; color: #9C9489; }
        .live-badge { background: #EDFAF3; color: #1A7F4B; border-radius: 100px; padding: 3px 8px; font-size: 0.62rem; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .live-dot { width: 5px; height: 5px; border-radius: 50%; background: #1A7F4B; animation: pulse-dot 1.5s infinite; }

        .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); border: 1px solid #E5DFD6; border-radius: 10px; overflow: hidden; background: #F6F3EE; margin-bottom: 10px; }
        .stat-cell { padding: 10px 12px; border-right: 1px solid #E5DFD6; border-bottom: none; }
        .stat-cell:last-child { border-right: none; }
        @media (max-width: 540px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-cell { border-right: 1px solid #E5DFD6; border-bottom: 1px solid #E5DFD6; }
          .stat-cell:nth-child(2n) { border-right: none; }
          .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none; }
        }
        .stat-label { font-size: 0.55rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #9C9489; margin-bottom: 2px; }
        .stat-val { font-size: 1.1rem; font-weight: 700; color: #18160F; letter-spacing: -0.02em; }
        .stat-meta { font-size: 0.55rem; color: #9C9489; }

        .notif-card { background: #F6F3EE; border: 1px solid #E5DFD6; border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; position: relative; overflow: hidden; }
        .notif-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #2748E8; border-radius: 0; }
        .notif-title { font-size: 0.7rem; font-weight: 600; color: #18160F; line-height: 1.3; margin-bottom: 4px; }
        .notif-meta { font-size: 0.6rem; color: #9C9489; }
        .news-pill { display: inline-block; background: #EEF0FD; color: #2748E8; border-radius: 100px; padding: 1px 6px; font-size: 0.55rem; font-weight: 700; }

        .floating-card {
          position: absolute; top: -16px; left: -20px;
          background: #F6F3EE; border: 1px solid #E5DFD6; border-radius: 10px;
          padding: 8px 12px; box-shadow: 0 4px 16px rgba(24,22,15,0.1);
          display: flex; align-items: center; gap: 6px;
          animation: float-card 4s ease-in-out infinite;
          z-index: 20;
        }
        .floating-card2 {
          position: absolute; bottom: -12px; right: -16px;
          background: #EEF0FD; border: 1px solid rgba(39,72,232,0.2); border-radius: 100px;
          padding: 6px 12px; box-shadow: 0 4px 16px rgba(24,22,15,0.08);
          display: flex; align-items: center; gap: 6px;
          animation: float-card 4s ease-in-out infinite 1s;
          z-index: 20;
        }
        @keyframes float-card { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .fc-icon { font-size: 14px; }
        .fc-text { font-size: 0.68rem; font-weight: 600; color: #18160F; }
        .fc-text2 { font-size: 0.68rem; font-weight: 600; color: #2748E8; }
        .fc-dot { width: 5px; height: 5px; border-radius: 50%; background: #B91C1C; animation: pulse-dot 1.2s infinite; }
        .fc-dot-g { width: 5px; height: 5px; border-radius: 50%; background: #1A7F4B; animation: pulse-dot 1.5s infinite; }

        .marquee-section { background: #EFEBE3; padding: 18px 0; border-top: 1px solid #E5DFD6; border-bottom: 1px solid #E5DFD6; overflow: hidden; }
        .marquee-label { text-align: center; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #9C9489; margin-bottom: 12px; }
        .marquee-track { display: flex; gap: 40px; animation: marquee 20s linear infinite; white-space: nowrap; width: max-content; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-item { font-size: 0.88rem; font-weight: 600; color: #9C9489; }
        .marquee-sep { color: #D6CFC4; }

        .problem-section {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 0; background: #F6F3EE;
          border-bottom: 1px solid #E5DFD6;
        }
        .problem-section > * { min-width: 0; }
        @media (max-width: 767px) {
          .problem-section {
            grid-template-columns: 1fr;
          }
        }
        .problem-left {
          padding: 80px 48px; border-right: 1px solid #E5DFD6;
        }
        @media (max-width: 767px) {
          .problem-left {
            border-right: none;
            border-bottom: 1px solid #E5DFD6;
            padding: 40px 24px;
          }
        }
        .problem-right {
          padding: 80px 48px;
        }
        @media (max-width: 767px) {
          .problem-right {
            padding: 40px 24px;
          }
        }
        .eyebrow { font-size: 0.67rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #9C9489; margin-bottom: 16px; }
        .big-stat { font-size: 5rem; font-weight: 800; color: #B91C1C; letter-spacing: -0.04em; line-height: 1; }
        .big-stat-label { font-size: 0.95rem; color: #5C5850; line-height: 1.5; max-width: 300px; margin-top: 8px; margin-bottom: 24px; }
        .pain-list { display: flex; flex-direction: column; gap: 10px; }
        .pain-item { display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: #5C5850; }
        .pain-x { color: #B91C1C; font-weight: 700; font-size: 0.9rem; margin-top: 1px; }
        .check-item { display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: #5C5850; }
        .check-v { color: #1A7F4B; font-weight: 700; font-size: 0.9rem; margin-top: 1px; }
        .solution-heading { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.025em; color: #18160F; line-height: 1.3; margin-bottom: 20px; }

        .stats-dark { background: #18160F; padding: 60px 48px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); max-width: 1200px; margin: 0 auto; }
        @media (max-width: 1023px) {
          .stats-grid {
            grid-template-columns: repeat(2,1fr);
            gap: 24px;
          }
          .stats-dark { padding: 40px 24px; }
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        .stat-dark-cell { padding: 0 32px; border-right: 1px solid rgba(255,255,255,0.08); text-align: center; }
        .stat-dark-cell:first-child { padding-left: 0; }
        .stat-dark-cell:last-child { border-right: none; padding-right: 0; }
        @media (max-width: 1023px) {
          .stat-dark-cell {
            border-right: none;
            padding: 0 8px;
          }
        }
        .stat-big { font-size: 3rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; }
        .stat-dark-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-top: 4px; }

        .feature-section { padding: 80px 48px; max-width: 1200px; margin: 0 auto; }
        .feature-section.alt { background: #EFEBE3; max-width: 100%; padding: 80px 48px; }
        @media (max-width: 767px) {
          .feature-section, .feature-section.alt { padding: 40px 24px; }
        }
        .feature-inner { max-width: 1200px; margin: 0 auto; }
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .feature-grid > * { min-width: 0; }
        @media (max-width: 767px) {
          .feature-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        .feature-grid.rev { direction: rtl; }
        .feature-grid.rev > * { direction: ltr; }
        .feature-text { display: flex; flex-direction: column; gap: 16px; }
        .feature-heading { font-size: 2rem; font-weight: 700; letter-spacing: -0.025em; color: #18160F; line-height: 1.2; }
        .feature-body { font-size: 0.9rem; color: #5C5850; line-height: 1.72; }
        .tag-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .tag { background: #EFEBE3; border: 1px solid #E5DFD6; border-radius: 100px; padding: 5px 12px; font-size: 0.72rem; font-weight: 600; color: #5C5850; }
        .feature-visual { background: #F6F3EE; border: 1px solid #E5DFD6; border-radius: 14px; padding: 24px; min-height: 200px; }

        .agent-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
        @media (max-width: 640px) {
          .agent-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 480px) {
          .agent-grid { grid-template-columns: 1fr; }
        }

        .canvas-mock { background: #F0EDE6; border-radius: 10px; padding: 16px; position: relative; overflow-x: auto; min-height: 180px; -webkit-overflow-scrolling: touch; }
        .canvas-dots { position: absolute; inset: 0; background-image: radial-gradient(circle, #D6CFC4 1px, transparent 1px); background-size: 20px 20px; }
        .node-row { display: flex; align-items: center; gap: 8px; position: relative; z-index: 1; margin-bottom: 12px; min-width: 500px; }
        .node { background: #F6F3EE; border: 1.5px solid #D6CFC4; border-radius: 8px; padding: 6px 12px; }
        .node-label-s { font-size: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9C9489; }
        .node-name { font-size: 0.7rem; font-weight: 600; color: #18160F; }
        .edge { flex: 1; height: 1.5px; background: #D6CFC4; }

        .cta-section { background: #F6F3EE; padding: 100px 48px; text-align: center; border-top: 1px solid #E5DFD6; }
        .cta-heading { font-size: 2.8rem; font-weight: 700; letter-spacing: -0.035em; color: #18160F; max-width: 600px; margin: 0 auto 24px; line-height: 1.15; }
        @media (max-width: 640px) {
          .cta-heading { font-size: 2rem; }
          .cta-section { padding: 60px 24px; }
        }
        .cta-sub { font-size: 0.82rem; color: #9C9489; margin-top: 16px; }

        /* Mobile Nav & Floating Cards Responsive */
        .nav-toggle { display: none; background: none; border: none; cursor: pointer; color: #18160F; align-items: center; justify-content: center; }
        @media (max-width: 767px) {
          .nav-toggle { display: flex; }
          .nav-right .btn-primary { display: none; }
          .nav-right { gap: 10px; }
        }

        .mobile-menu {
          display: flex; flex-direction: column; gap: 20px;
          position: fixed; top: 56px; left: 0; right: 0; bottom: 0;
          background: #F6F3EE; padding: 32px 24px; z-index: 45;
          border-top: 1px solid #E5DFD6;
          transform: translateY(-100%); transition: transform 0.3s ease-in-out;
          opacity: 0; visibility: hidden;
        }
        .mobile-menu.open {
          transform: translateY(0); opacity: 1; visibility: visible;
        }
        .mobile-menu a {
          font-size: 1.2rem; font-weight: 600; color: #18160F; text-decoration: none;
          padding-bottom: 12px; border-bottom: 1px solid #E5DFD6;
        }
        .mobile-menu .btn-mobile {
          margin-top: 20px;
          display: inline-flex !important;
        }

        @media (max-width: 1023px) {
          .floating-card { left: 4px !important; top: -8px !important; }
          .floating-card2 { right: 4px !important; bottom: -8px !important; }
          .hero-right { margin-top: 20px; width: 100%; }
        }
      `}} />

      {/* 1. Navbar */}
      <nav className="nav" id="top">
        <div className="nav-logo">SupplyChain AI</div>
        <div className="nav-links">
          <a href="#how-it-works" onClick={(e) => smoothScroll(e, 'how-it-works')}>How It Works</a>
          <a href="#analytics" onClick={(e) => smoothScroll(e, 'analytics')}>Analytics</a>
          <a href="https://github.com/Prashant-thakur77/SupplyChain-AI" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div className="nav-right">
          <Link href="/demo" className="btn-primary">Live demo</Link>
          <div className="user-circle">
            <User size={14} style={{color: '#5C5850'}} />
          </div>
          <button className="nav-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#how-it-works" onClick={(e) => { setMobileMenuOpen(false); smoothScroll(e, 'how-it-works'); }}>How It Works</a>
        <a href="#analytics" onClick={(e) => { setMobileMenuOpen(false); smoothScroll(e, 'analytics'); }}>Analytics</a>
        <a href="https://github.com/Prashant-thakur77/SupplyChain-AI" target="_blank" rel="noreferrer">GitHub</a>
        <Link href="/demo" className="btn-primary btn-mobile" onClick={() => setMobileMenuOpen(false)}>Live demo</Link>
      </div>

      <main style={{ flex: 1 }}>
        {/* 2. Hero Section */}
        <section style={{ background: '#F6F3EE', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '600px', background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(39,72,232,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div className="hero">
            <div className="hero-left">
              <div className="badge">
                <div className="badge-dot" />
                BUILT WITH STRANDS AGENTS · RUNS IN THE BACKGROUND
              </div>
              <h1 className="hero-headline">
                Your supply chain,<br /><span>watched 24/7.</span><br />You only get the decision.
              </h1>
              <p className="hero-sub">
                An autonomous agent watches your ports, suppliers and lanes. When something breaks it computes the blast radius, finds the cheapest viable reroute, drafts the mitigation — and pings you with one ranked decision to approve.
              </p>
              <div className="cta-row">
                <Link href="/demo" className="btn-hero">Try the live demo</Link>
                <Link href="/signin" className="btn-outline">Sign in →</Link>
              </div>
              <div className="trust-row">
                <div className="flag-pills">
                  <span className="flag-pill">US</span>
                  <span className="flag-pill">UK</span>
                  <span className="flag-pill">DE</span>
                  <span className="flag-pill">SG</span>
                  <span className="flag-pill">JP</span>
                </div>
                <span className="trust-label">Trusted by logistics teams across 40+ countries</span>
              </div>
            </div>
            <div className="hero-right">
              <div className="floating-card">
                <div className="fc-dot" />
                <span className="fc-text">Risk Detected · Port Mumbai</span>
              </div>
              <div className="dashboard-preview">
                <div className="preview-chrome">
                  <div className="dot d-red" />
                  <div className="dot d-yellow" />
                  <div className="dot d-green" />
                  <span className="preview-title">SupplyChain AI — Control Center</span>
                </div>
                <div className="preview-body">
                  <div className="preview-header">
                    <div>
                      <div className="preview-h">Control Center</div>
                      <div className="preview-sub">Operational intelligence overview</div>
                    </div>
                    <div className="live-badge">
                      <div className="live-dot" />
                      LIVE
                    </div>
                  </div>
                  <div className="stat-grid">
                    <div className="stat-cell">
                      <div className="stat-label">Node Exposure</div>
                      <div className="stat-val" style={{ color: '#B91C1C' }}>7%</div>
                      <div className="stat-meta">43 nodes total</div>
                    </div>
                    <div className="stat-cell">
                      <div className="stat-label">Recovery Window</div>
                      <div className="stat-val">10–15d</div>
                      <div className="stat-meta">estimated range</div>
                    </div>
                    <div className="stat-cell">
                      <div className="stat-label">Fault Signals</div>
                      <div className="stat-val">2</div>
                      <div className="stat-meta">risk &gt; 75</div>
                    </div>
                    <div className="stat-cell">
                      <div className="stat-label">Supply Chains</div>
                      <div className="stat-val">6</div>
                      <div className="stat-meta">39 connections</div>
                    </div>
                  </div>
                  <div className="notif-card">
                    <div className="notif-accent" />
                    <div className="notif-title" style={{ paddingLeft: '10px' }}>
                      Port congestion detected · Shenzhen <span className="news-pill">LIVE NEWS</span>
                    </div>
                    <div className="notif-meta" style={{ paddingLeft: '10px' }}>about 2 hours ago · 1 source · 1 entity</div>
                  </div>
                  <div className="notif-card">
                    <div className="notif-accent" style={{ background: '#B45309' }} />
                    <div className="notif-title" style={{ paddingLeft: '10px' }}>
                      Supplier financial instability · Tier-2 region <span className="news-pill">LIVE NEWS</span>
                    </div>
                    <div className="notif-meta" style={{ paddingLeft: '10px' }}>about 6 hours ago · 1 source · 1 entity</div>
                  </div>
                </div>
              </div>
              <div className="floating-card2">
                <div className="fc-dot-g" />
                <span className="fc-text2">6 Agents Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Marquee Section */}
        <div className="marquee-section">
          <div className="marquee-label">Trusted by enterprise logistics teams worldwide</div>
          <div style={{ display: 'flex', overflow: 'hidden' }}>
            <div className="marquee-track">
              {['Maersk', 'DHL', 'Flexport', 'Kuehne+Nagel', 'DB Schenker', 'DSV', 'Rhenus'].map((name, i) => (
                <span key={i}>
                  <span className="marquee-item">{name}</span>
                  <span className="marquee-sep"> · </span>
                </span>
              ))}
              {['Maersk', 'DHL', 'Flexport', 'Kuehne+Nagel', 'DB Schenker', 'DSV', 'Rhenus'].map((name, i) => (
                <span key={`dup-${i}`}>
                  <span className="marquee-item">{name}</span>
                  <span className="marquee-sep"> · </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Problem Section */}
        <div className="problem-section" id="how-it-works">
          <div className="problem-left">
            <div className="eyebrow">The Problem</div>
            <div className="big-stat">73%</div>
            <p className="big-stat-label">of supply chain disruptions are identified after the damage is already done</p>
            <div className="pain-list">
              <div className="pain-item"><span className="pain-x">✗</span><span>No real-time visibility into live network health</span></div>
              <div className="pain-item"><span className="pain-x">✗</span><span>Reactive crisis management, not proactive prevention</span></div>
              <div className="pain-item"><span className="pain-x">✗</span><span>Fragmented tools with no unified intelligence layer</span></div>
            </div>
          </div>
          <div className="problem-right">
            <div className="eyebrow">SupplyChain AI Changes This</div>
            <h2 className="solution-heading">From reactive damage control to proactive prevention</h2>
            <div className="pain-list" style={{ marginBottom: '24px' }}>
              <div className="check-item"><span className="check-v">✓</span><span>Live Digital Twin with real-time node status changes</span></div>
              <div className="check-item"><span className="check-v">✓</span><span>Eight Strands agents: Sentinel finds it, Analyst grades it, Router ranks exact reroutes</span></div>
              <div className="check-item"><span className="check-v">✓</span><span>Deterministic routing engine — Dijkstra, not guesses — so every cost and day is exact</span></div>
              <div className="check-item"><span className="check-v">✓</span><span>A Decision Inbox: approve, reject or snooze — the agent handles the rest and remembers</span></div>
            </div>
            <Link href="/demo" className="btn-hero">Break a port in the demo →</Link>
          </div>
        </div>

        {/* 5. Stats Dark Section */}
        <div className="stats-dark">
          <div className="stats-grid">
            <div className="stat-dark-cell">
              <div className="stat-big">0.885</div>
              <div className="stat-dark-label">ROC-AUC Model Accuracy</div>
            </div>
            <div className="stat-dark-cell">
              <div className="stat-big">&lt;1ms</div>
              <div className="stat-dark-label">ML Inference Speed</div>
            </div>
            <div className="stat-dark-cell">
              <div className="stat-big">180K</div>
              <div className="stat-dark-label">Orders Trained On</div>
            </div>
            <div className="stat-dark-cell">
              <div className="stat-big">6</div>
              <div className="stat-dark-label">Specialized AI Agents</div>
            </div>
          </div>
        </div>

        {/* 6. Feature Section 1 - Digital Twin */}
        <section className="feature-section" id="analytics">
          <div className="feature-grid">
            <div className="feature-text">
              <div className="eyebrow">Digital Twin</div>
              <h2 className="feature-heading">Build your supply chain as a living network</h2>
              <p className="feature-body">
                Drag-and-drop nodes onto a real-time canvas. Every connection, port, warehouse, and supplier is mapped — and changes state dynamically when intelligence arrives.
              </p>
              <div className="tag-row">
                <span className="tag">43 Nodes</span>
                <span className="tag">39 Connections</span>
                <span className="tag">Real-time Status</span>
                <span className="tag">Leaflet Maps</span>
              </div>
            </div>
            <div className="feature-visual">
              <div className="canvas-mock">
                <div className="canvas-dots" />
                <div className="node-row">
                  <div className="node">
                    <div className="node-label-s">SUPPLIER</div>
                    <div className="node-name">Steel Supplier</div>
                  </div>
                  <div className="edge" />
                  <div className="node">
                    <div className="node-label-s">PORT</div>
                    <div className="node-name">Port of Shenzhen</div>
                  </div>
                  <div className="edge" />
                  <div className="node">
                    <div className="node-label-s">FACTORY</div>
                    <div className="node-name">Assembly Plant</div>
                  </div>
                </div>
                <div className="node-row" style={{ marginLeft: '32px' }}>
                  <div className="node">
                    <div className="node-label-s">WAREHOUSE</div>
                    <div className="node-name">Parts Staging</div>
                  </div>
                  <div className="edge" />
                  <div className="node">
                    <div className="node-label-s">DIST.</div>
                    <div className="node-name">US West Coast</div>
                  </div>
                  <div className="edge" />
                  <div className="node" style={{ borderColor: '#B91C1C' }}>
                    <div className="node-label-s" style={{ color: '#B91C1C' }}>RISK · 78%</div>
                    <div className="node-name">National Retail</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Feature Section 2 - Multi-Agent AI */}
        <div style={{ background: '#EFEBE3', padding: '80px 48px', borderTop: '1px solid #E5DFD6', borderBottom: '1px solid #E5DFD6' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="feature-grid rev">
              <div className="feature-text">
                <div className="eyebrow">Strands Agents SDK</div>
                <h2 className="feature-heading">Eight specialised agents. One incident graph.</h2>
                <p className="feature-body">
                  Built on the Strands Agents SDK: Sentinel → Analyst → routing engine → Router ∥ Impact → Strategist → Decision, wired as a Strands Graph with typed outputs at every node. Model-agnostic — Gemini today, Amazon Bedrock with one environment variable.
                </p>
                <a href="https://github.com/Prashant-thakur77/SupplyChain-AI#how-strands-is-used" target="_blank" rel="noreferrer" className="btn-hero" style={{ width: 'fit-content' }}>
                  Read the architecture →
                </a>
              </div>
              <div className="feature-visual">
                <div className="agent-grid">
                  <div className="agent-card">
                    <div className="agent-dot" style={{ background: '#2748E8' }} />
                    <div className="agent-name">Sentinel</div>
                    <div className="agent-role">Watches news & weather</div>
                  </div>
                  <div className="agent-card">
                    <div className="agent-dot" style={{ background: '#7C3AED' }} />
                    <div className="agent-name">Analyst</div>
                    <div className="agent-role">Severity, confidence, blast radius</div>
                  </div>
                  <div className="agent-card">
                    <div className="agent-dot" style={{ background: '#1A7F4B' }} />
                    <div className="agent-name">Router</div>
                    <div className="agent-role">Ranks exact reroutes</div>
                  </div>
                  <div className="agent-card">
                    <div className="agent-dot" style={{ background: '#B45309' }} />
                    <div className="agent-name">Impact</div>
                    <div className="agent-role">Revenue at risk, delay</div>
                  </div>
                  <div className="agent-card">
                    <div className="agent-dot" style={{ background: '#B91C1C' }} />
                    <div className="agent-name">Strategist</div>
                    <div className="agent-role">Executable mitigation</div>
                  </div>
                  <div className="agent-card">
                    <div className="agent-dot" style={{ background: '#5C5850' }} />
                    <div className="agent-name">Forecaster · Scenario · Copilot</div>
                    <div className="agent-role">Forward risk, what-ifs, chat</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Feature Section 3 - Chaos Simulation */}
        <section className="feature-section">
          <div className="feature-grid">
            <div className="feature-text">
              <div className="eyebrow">Chaos Simulation</div>
              <h2 className="feature-heading">Stress-test before reality does</h2>
              <p className="feature-body">
                Inject artificial disruptions — port delays, supplier collapses, price spikes — and run 1,000 Monte Carlo simulations to see exactly how your network responds before it happens.
              </p>
              <div className="tag-row">
                <span className="tag">1,000 Monte Carlo runs</span>
                <span className="tag">Cascade modeling</span>
                <span className="tag">AI forecast scenarios</span>
              </div>
            </div>
            <div className="feature-visual" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#FEF2F2', border: '1px solid rgba(185,28,28,0.15)', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#18160F' }}>Imminent Port Congestion</div>
                  <span style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid rgba(185,28,28,0.25)', borderRadius: '100px', padding: '2px 8px', fontSize: '0.6rem', fontWeight: 700 }}>
                    HIGH ALERT
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9C9489', margin: '4px 0 8px' }}>AI-generated based on risk patterns</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ background: '#FEF3C7', color: '#B45309', borderRadius: '100px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600 }}>65% severity</span>
                  <span style={{ background: '#EFEBE3', color: '#5C5850', borderRadius: '100px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600 }}>14 days</span>
                  <span style={{ background: '#EFEBE3', color: '#5C5850', borderRadius: '100px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600 }}>Disruption</span>
                </div>
              </div>
              <div style={{ background: '#F6F3EE', border: '1px solid #E5DFD6', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#18160F' }}>Supplier Financial Instability</div>
                  <span style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid rgba(185,28,28,0.25)', borderRadius: '100px', padding: '2px 8px', fontSize: '0.6rem', fontWeight: 700 }}>
                    HIGH ALERT
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9C9489', margin: '4px 0 8px' }}>AI-generated based on risk patterns</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ background: '#FEF9C3', color: '#854D0E', borderRadius: '100px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600 }}>40% severity</span>
                  <span style={{ background: '#EFEBE3', color: '#5C5850', borderRadius: '100px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600 }}>30 days</span>
                  <span style={{ background: '#EFEBE3', color: '#5C5850', borderRadius: '100px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600 }}>Political</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. CTA Section */}
        <div className="cta-section">
          <h2 className="cta-heading">Stop finding out from the news.</h2>
          <Link href="/demo" className="btn-hero" style={{ padding: '16px 40px', fontSize: '1rem' }}>
            Request Access →
          </Link>
          <p className="cta-sub">No credit card required · Enterprise-ready · Backed by Google ADK</p>
        </div>
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  )
}