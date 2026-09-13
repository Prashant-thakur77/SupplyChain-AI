'use client';

import { FC, useState } from 'react';
import { AlertCircle, FileText, Loader2, Radar, ShieldAlert, Plug, Search, Ship, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';
import type { IncidentEvent } from '@/types/agent';
import { ResilienceDialog } from '@/components/resilience/ResilienceDialog';
import { WarRoomDialog } from '@/components/warroom/WarRoomDialog';
import { FlowsDialog } from '@/components/digital-twin/forms/FlowsDialog';
import { QuotesDialog } from '@/components/digital-twin/forms/QuotesDialog';
import { ShipmentsDialog } from '@/components/digital-twin/forms/ShipmentsDialog';
import { ConnectorsDialog } from '@/components/digital-twin/forms/ConnectorsDialog';
import { useUser } from '@/lib/stores/user';

interface Props {
  /** Starts the Strands incident graph for a live-detected event. */
  onIncident?: (event: IncidentEvent) => void;
}

/** Left-side Control Tower: live-intel scan + current disruption summary. Route options live in the Incident panel. */
const ControlTowerPanel: FC<Props> = ({ onIncident }) => {
  const { isControlTowerMode, disruptedNodes, nodes, clearDisruptions, incident, isAnalyzingDisruption, updateNode } = useDigitalTwinStore();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{ description: string; max: number } | null>(null);
  const [flowsOpen, setFlowsOpen] = useState(false);
  const [quotesOpen, setQuotesOpen] = useState(false);
  const [shipmentsOpen, setShipmentsOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const { userData } = useUser();
  const selectedSupplyChain = useDigitalTwinStore((s) => s.selectedSupplyChain);

  if (!isControlTowerMode) return null;

  const failed = nodes.filter((n) => incident?.assessment.failed_node_ids.includes(n.id) || (!incident && disruptedNodes[0] === n.id));
  const downstream = incident ? incident.assessment.affected_node_ids.length : Math.max(0, disruptedNodes.length - 1);

  const scan = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/agent/live-intelligence', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: nodes.filter((n) => n.type !== 'group').map((n) => ({ id: n.id, data: n.data, type: n.type })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? result.error ?? 'scan failed');
      (result.nodeRisks ?? []).forEach((nr: any) => updateNode(nr.nodeId, { riskScore: nr.riskScore, riskReason: nr.reason }));
      const worst = [...(result.nodeRisks ?? [])].sort((a: any, b: any) => b.riskScore - a.riskScore)[0];
      setLastScan({ description: result.description, max: worst?.riskScore ?? 0 });
      if (result.disruptionsFound && worst && worst.riskScore > 0.8 && onIncident) {
        const node = nodes.find((n) => n.id === worst.nodeId);
        toast.warning(`Live threat at ${node?.data?.label ?? worst.nodeId} — running incident graph`);
        onIncident({
          id: `live-${worst.nodeId}-${Date.now()}`, kind: 'news', title: `${node?.data?.label ?? worst.nodeId}: ${worst.reason?.slice(0, 80) ?? 'live disruption'}`,
          description: worst.reason ?? result.description, failed_node_ids: [worst.nodeId], failed_edge_ids: [],
          sources: (result.sources ?? []).slice(0, 3),
        });
      } else {
        toast.info(`Scan complete — highest node risk ${Math.round((worst?.riskScore ?? 0) * 100)}%. No disruption above the alert threshold.`);
      }
    } catch (err) {
      toast.error(`Live intelligence scan failed: ${(err as Error).message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="absolute top-24 left-4 z-40 w-80 rounded-theme-lg border border-theme-border-default bg-theme-bg-surface/90 p-4 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-left-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-theme-text-primary"><ShieldAlert className="h-4 w-4 text-theme-red" /> Control Tower</h3>
        {(disruptedNodes.length > 0 || incident) && <button onClick={clearDisruptions} className="text-xs text-theme-text-muted hover:text-theme-text-primary">Clear</button>}
      </div>

      {disruptedNodes.length === 0 && !incident ? (
        <div className="space-y-3 text-sm text-theme-text-secondary">
          <p className="text-center">Right-click any node to simulate a disruption, or scan live feeds.</p>
          <button onClick={scan} disabled={isScanning || nodes.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-theme-md border border-theme-blue/30 bg-theme-blue-soft py-2 text-sm font-medium text-theme-blue transition-colors hover:bg-theme-blue/15 disabled:cursor-not-allowed disabled:opacity-50">
            {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
            {nodes.length === 0 ? 'Add nodes to scan' : isScanning ? 'Scanning global feeds…' : 'Scan live intelligence'}
          </button>
          {lastScan && <p className="text-xs leading-relaxed text-theme-text-muted">{lastScan.description}</p>}
          {userData?.id && selectedSupplyChain && selectedSupplyChain !== 'default-chain' && (
            <>
              <button onClick={() => setFlowsOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface px-3 py-2 text-sm font-medium text-theme-text-primary hover:border-theme-blue hover:text-theme-blue"><Truck className="h-4 w-4" /> Flows (value at risk)</button>
              <FlowsDialog isOpen={flowsOpen} onClose={() => setFlowsOpen(false)} supplyChainId={selectedSupplyChain} userId={userData.id} />
              <button onClick={() => setQuotesOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface px-3 py-2 text-sm font-medium text-theme-text-primary hover:border-theme-blue hover:text-theme-blue"><FileText className="h-4 w-4" /> Carrier quotes</button>
              <QuotesDialog isOpen={quotesOpen} onClose={() => setQuotesOpen(false)} supplyChainId={selectedSupplyChain} userId={userData.id} />
              <button onClick={() => setShipmentsOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface px-3 py-2 text-sm font-medium text-theme-text-primary hover:border-theme-blue hover:text-theme-blue"><Ship className="h-4 w-4" /> Shipments in flight</button>
              <ShipmentsDialog isOpen={shipmentsOpen} onClose={() => setShipmentsOpen(false)} supplyChainId={selectedSupplyChain} userId={userData.id} />
              <button onClick={() => setConnectorsOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface px-3 py-2 text-sm font-medium text-theme-text-primary hover:border-theme-blue hover:text-theme-blue"><Plug className="h-4 w-4" /> Integrations (ERP / TMS)</button>
              <ConnectorsDialog isOpen={connectorsOpen} onClose={() => setConnectorsOpen(false)} supplyChainId={selectedSupplyChain} userId={userData.id} />
            </>
          )}
          <WarRoomDialog endpoint="/api/agent/warroom" onFail={onIncident} />
          <ResilienceDialog fetchReport={async () => { const st = useDigitalTwinStore.getState(); const r = await fetch("/api/agent/resilience", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ supplyChainId: st.selectedSupplyChain, nodes: st.nodes, edges: st.edges }) }); const j = await r.json(); if (!r.ok) throw new Error(j.detail ?? j.error); return j }} onFail={onIncident} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-theme-md border border-theme-red/30 bg-theme-red-soft p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-theme-red"><AlertCircle className="h-4 w-4" /> Active disruption</div>
            <div className="text-sm text-theme-text-primary">{failed.map((n) => n.data?.label ?? n.id).join(', ') || nodes.find((n) => n.id === disruptedNodes[0])?.data?.label || '—'}</div>
            {incident && <div className="mt-1 text-xs text-theme-text-secondary">{incident.assessment.summary}</div>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-theme-md border border-theme-amber/30 bg-theme-amber-soft p-3"><div className="text-2xl font-bold text-theme-amber">{downstream}</div><div className="text-xs text-theme-text-secondary">Nodes downstream</div></div>
            <div className="rounded-theme-md border border-theme-green/30 bg-theme-green-soft p-3"><div className="text-2xl font-bold text-theme-green">{incident?.plan?.feasible_count ?? (isAnalyzingDisruption ? '…' : 0)}</div><div className="text-xs text-theme-text-secondary">Lanes reroutable</div></div>
          </div>
          {isAnalyzingDisruption && <div className="flex items-center gap-2 text-xs text-theme-text-secondary"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Incident graph running — see the panel on the right.</div>}
          {incident?.impact && <div className="text-xs text-theme-text-secondary">Revenue at risk ≈ <strong className="text-theme-text-primary">${Math.round(incident.impact.revenue_at_risk_usd).toLocaleString()}</strong> · {Math.round(incident.impact.delay_days)} day delay</div>}
          <button onClick={scan} disabled={isScanning} className="flex w-full items-center justify-center gap-2 rounded-theme-md border border-theme-border-subtle py-1.5 text-xs text-theme-text-secondary hover:text-theme-text-primary"><Search className="h-3.5 w-3.5" /> {isScanning ? 'Scanning…' : 'Re-scan live feeds'}</button>
        </div>
      )}
    </div>
  );
};

export default ControlTowerPanel;
