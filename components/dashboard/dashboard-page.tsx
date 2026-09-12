"use client"

import { RefreshCw } from "lucide-react"
import { NotificationFeed } from "@/components/dashboard/notification-feed"
import { useDashboardMetrics } from "@/components/dashboard/useDashboardMetrics"

export default function DashboardPage() {
  const m = useDashboardMetrics()
  
  // Calculate exposure pct (e.g. "7%" from metrics or default to "0%")
  const exposurePct = m.isLoading ? "…" : m.nodeExposurePct || "0%"
  const exposureFillWidth = m.isLoading ? "0%" : m.nodeExposurePct || "0%"

  return (
    <div className="relative min-h-full flex-1 bg-theme-bg-primary overflow-y-auto text-theme-text-primary">
      <style dangerouslySetInnerHTML={{__html: `
        /* TOP BAR */
        .topbar {
          height: 56px; background: #F6F3EE; border-bottom: 1px solid #E5DFD6;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; flex-shrink: 0;
        }
        @media (max-width: 640px) {
          .topbar { padding: 0 16px; }
        }
        .topbar-left { display: flex; flex-direction: column; }
        .topbar-title { font-size: 1.1rem; font-weight: 700; color: #18160F; letter-spacing: -0.02em; }
        .topbar-sub { font-size: 0.75rem; color: #9C9489; }
        @media (max-width: 480px) {
          .topbar-sub { display: none; }
        }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .live-pill { display: flex; align-items: center; gap: 6px; background: #EDFAF3; border: 1px solid rgba(26,127,75,0.2); border-radius: 100px; padding: 4px 12px; font-size: 0.7rem; font-weight: 700; color: #1A7F4B; }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #1A7F4B; animation: pulse-live 1.5s ease-in-out infinite; }
        @keyframes pulse-live { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }

        /* CONTENT AREA */
        .content { flex: 1; display: flex; flex-direction: column; gap: 20px; padding: 24px 28px; }
        @media (max-width: 767px) {
          .content { padding: 16px; }
        }

        /* STATS ROW */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 767px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .stats-row { grid-template-columns: 1fr; }
        }
        .stat-card {
          background: #EFEBE3; border: 1px solid #E5DFD6; border-radius: 10px;
          padding: 14px 16px; display: flex; flex-direction: column; gap: 4px;
        }
        .stat-card-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #9C9489; }
        .stat-card-val { font-size: 1.7rem; font-weight: 800; color: #18160F; letter-spacing: -0.04em; line-height: 1.1; }
        .stat-card-val.danger { color: #B91C1C; }
        .stat-card-meta { font-size: 0.7rem; color: #9C9489; }
        .stat-card-indicator { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .ind-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* BODY GRID */
        .body-grid { display: flex; flex-direction: column; gap: 16px; width: 100%; }

        /* ALERTS PANEL */
        .panel { background: #F6F3EE; border: 1px solid #E5DFD6; border-radius: 12px; overflow: hidden; }
        
        /* SIDEBAR PANELS */
        .side-panels { display: flex; flex-direction: column; gap: 16px; }
        .mini-panel { background: #F6F3EE; border: 1px solid #E5DFD6; border-radius: 12px; overflow: hidden; }
        .mini-panel-header { padding: 12px 14px; border-bottom: 1px solid #E5DFD6; font-size: 0.78rem; font-weight: 700; color: #18160F; }
        .node-health-list { padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; }
        .nh-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E5DFD6; }
        .nh-row:last-child { border-bottom: none; }
        .nh-left { display: flex; align-items: center; gap: 8px; }
        .nh-dot { width: 7px; height: 7px; border-radius: 50%; }
        .nh-label { font-size: 0.78rem; color: #18160F; font-weight: 500; }
        .nh-count { font-size: 0.72rem; font-weight: 700; color: #18160F; background: #EFEBE3; border: 1px solid #E5DFD6; border-radius: 100px; padding: 1px 8px; }

        /* SYSTEM STATUS */
        .sys-status-list { padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; }
        .sys-row { display: flex; flex-direction: column; gap: 4px; }
        .sys-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #9C9489; }
        .sys-val { font-size: 1.3rem; font-weight: 800; color: #18160F; letter-spacing: -0.03em; line-height: 1.1; }
        .sys-meta { font-size: 0.65rem; color: #9C9489; }
        .sys-divider { height: 1px; background: #E5DFD6; margin: 2px 0; }

        /* EXPOSURE BAR */
        .exposure-bar-wrap { padding: 10px 14px 14px; }
        .exp-label-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .exp-label { font-size: 0.65rem; color: #9C9489; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; }
        .exp-val { font-size: 0.75rem; font-weight: 700; color: #B91C1C; }
        .exp-bar { height: 6px; background: #E5DFD6; border-radius: 100px; overflow: hidden; }
        .exp-fill { height: 100%; background: #B91C1C; border-radius: 100px; transition: width 0.3s ease; }
        .exp-sub { font-size: 0.62rem; color: #9C9489; margin-top: 5px; }

        /* Dark Mode overrides */
        .dark .topbar { background: #111010; border-bottom-color: #2A2825; }
        .dark .topbar-title { color: #F0EDE7; }
        .dark .topbar-sub { color: #6B6560; }
        .dark .stat-card { background: #191817; border-color: #2A2825; }
        .dark .stat-card-label { color: #6B6560; }
        .dark .stat-card-val { color: #F0EDE7; }
        .dark .stat-card-val.danger { color: #ef4444; }
        .dark .stat-card-meta { color: #6B6560; }
        .dark .panel { background: #111010; border-color: #2A2825; }
        .dark .mini-panel { background: #111010; border-color: #2A2825; }
        .dark .mini-panel-header { border-bottom-color: #2A2825; color: #F0EDE7; }
        .dark .nh-row { border-bottom-color: #2A2825; }
        .dark .nh-label { color: #F0EDE7; }
        .dark .nh-count { background: #191817; border-color: #2A2825; color: #F0EDE7; }
        .dark .sys-label { color: #6B6560; }
        .dark .sys-val { color: #F0EDE7; }
        .dark .sys-meta { color: #6B6560; }
        .dark .sys-divider { background: #2A2825; }
        .dark .exp-label { color: #6B6560; }
        .dark .exp-val { color: #ef4444; }
        .dark .exp-bar { background: #2A2825; }
        .dark .exp-fill { background: #ef4444; }
        .dark .exp-sub { color: #6B6560; }
      `}} />

      <div className="flex flex-col min-w-0">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">Control Center</h1>
            <p className="topbar-sub">Operational intelligence overview</p>
          </div>
          <div className="topbar-right">
            {m.isLoading && (
              <RefreshCw className="w-4 h-4 text-theme-text-muted animate-spin mr-2" />
            )}
            <div className="live-pill">
              <div className="live-dot"></div>
              {m.isLoading ? "LOADING" : "LIVE"}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="content">
          {/* STATS ROW */}
          <div className="stats-row">
            {/* Card 1 */}
            <div className="stat-card">
              <div className="stat-card-label">Node Exposure</div>
              <div className="stat-card-val danger">{exposurePct}</div>
              <div className="stat-card-meta">{m.isLoading ? "…" : `${m.totalNodes} nodes total`}</div>
              <div className="stat-card-indicator">
                <div className="ind-dot" style={{ background: '#B91C1C' }}></div>
                <span className="text-theme-red font-semibold text-[0.62rem]">{m.activeFaults} at risk</span>
              </div>
            </div>
            {/* Card 2 */}
            <div className="stat-card">
              <div className="stat-card-label">Recovery Window</div>
              <div className="stat-card-val">{m.isLoading ? "…" : m.recoveryWindow}</div>
              <div className="stat-card-meta">estimated range</div>
              <div className="stat-card-indicator">
                <div className="ind-dot" style={{ background: '#B45309' }}></div>
                <span className="text-theme-amber font-semibold text-[0.62rem]">lead time</span>
              </div>
            </div>
            {/* Card 3 */}
            <div className="stat-card">
              <div className="stat-card-label">Fault Signals</div>
              <div className="stat-card-val">{m.isLoading ? "…" : String(m.activeFaults)}</div>
              <div className="stat-card-meta">nodes risk &gt; 75</div>
              <div className="stat-card-indicator">
                <div className="ind-dot" style={{ background: '#2748E8' }}></div>
                <span className="text-theme-blue font-semibold text-[0.62rem]">active faults</span>
              </div>
            </div>
            {/* Card 4 */}
            <div className="stat-card">
              <div className="stat-card-label">Supply Chains</div>
              <div className="stat-card-val">{m.isLoading ? "…" : String(m.totalSupplyChains)}</div>
              <div className="stat-card-meta">{m.isLoading ? "…" : `${m.totalEdges} connections`}</div>
              <div className="stat-card-indicator">
                <div className="ind-dot" style={{ background: '#1A7F4B' }}></div>
                <span className="text-theme-green font-semibold text-[0.62rem]">all synced</span>
              </div>
            </div>
          </div>

          {/* BODY GRID */}
          <div className="body-grid">
            {/* Full Width: Alerts Panel */}
            <div className="panel w-full">
              <NotificationFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
