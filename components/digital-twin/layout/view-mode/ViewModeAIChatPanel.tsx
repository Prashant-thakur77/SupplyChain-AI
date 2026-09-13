'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Node, Edge } from 'reactflow';
import { Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { StrandsChat } from '@/components/copilot/StrandsChat';

interface ViewModeAIChatPanelProps {
  nodes?: Node[];
  edges?: Edge[];
}

/** View-mode side panel: the Strands copilot bound to this saved twin (tools: blast radius, reroutes, impact, news, weather, memory). */
const ViewModeAIChatPanel: React.FC<ViewModeAIChatPanelProps> = ({ nodes = [], edges = [] }) => {
  const params = useParams<{ id: string }>();
  const supplyChainId = params?.id;
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center border-r border-theme-border-subtle bg-theme-bg-surface py-3">
        <button type="button" onClick={() => setCollapsed(false)} aria-label="Open copilot" className="rounded-theme-md p-2 text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary"><ChevronRight className="h-4 w-4" /></button>
        <Bot className="mt-3 h-4 w-4 text-theme-blue" />
      </div>
    );
  }

  return (
    <div className="flex w-[320px] shrink-0 flex-col border-r border-theme-border-subtle bg-theme-bg-surface">
      <div className="flex h-[52px] items-center gap-2 border-b border-theme-border-subtle px-3">
        <Bot className="h-4 w-4 text-theme-blue" />
        <span className="text-sm font-semibold text-theme-text-primary">Copilot</span>
        <span className="text-[10px] uppercase tracking-wide text-theme-text-muted">Strands</span>
        <button type="button" onClick={() => setCollapsed(true)} aria-label="Collapse copilot" className="ml-auto rounded-theme-md p-1.5 text-theme-text-secondary hover:bg-theme-bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 p-2">
        <StrandsChat
          supplyChainId={supplyChainId}
          nodes={nodes}
          edges={edges}
          className="h-full"
          placeholder="Ask about this twin…"
          suggestions={["Which node is our single point of failure?", "What if the Suez Canal is blocked?", "Any news affecting our ports this week?"]}
        />
      </div>
    </div>
  );
};

export default ViewModeAIChatPanel;
