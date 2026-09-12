import React, { useState } from 'react';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { IncidentEvent } from '@/types/agent';

interface ManualDisruptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  /** Provided by the canvas: starts the Strands incident graph for the event. */
  onSimulate: (event: IncidentEvent) => void;
}

const PRESETS = [
  'Port closed for 3 weeks after a terminal fire',
  'Labour strike halts all operations for 10 days',
  'Typhoon: facility flooded, 2 weeks to recover',
  'Sanctions block all shipments through this hub',
];

export default function ManualDisruptionDialog({ isOpen, onClose, nodeId, onSimulate }: ManualDisruptionDialogProps) {
  const [description, setDescription] = useState('');
  const { nodes } = useDigitalTwinStore();
  const node = nodes.find((n) => n.id === nodeId);
  const nodeName = node?.data?.label || nodeId;

  const handleSimulate = () => {
    if (!nodeId || !description) return;
    onSimulate({
      id: `manual-${nodeId}-${Date.now()}`, kind: 'manual', title: `${nodeName}: ${description}`, description,
      location: node?.data?.country ?? node?.data?.location ?? undefined, failed_node_ids: [nodeId], failed_edge_ids: [], sources: [],
    });
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-theme-red" />
            Simulate disruption at {nodeName}
          </DialogTitle>
          <DialogDescription>
            The Strands incident graph will grade it, compute the blast radius and exact reroutes, and only create a decision if it matters.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <textarea
            className="min-h-[90px] w-full rounded-theme-md border border-theme-border-default bg-theme-bg-secondary p-3 text-sm text-theme-text-primary outline-none focus:ring-2 focus:ring-theme-blue"
            placeholder="What happened? e.g. Port closed for 3 weeks after a terminal fire"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setDescription(p)} className="rounded-full border border-theme-border-subtle bg-theme-bg-surface px-2 py-0.5 text-[11px] text-theme-text-secondary hover:border-theme-blue hover:text-theme-blue">{p}</button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <button type="button" onClick={onClose} className="rounded-theme-md px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-secondary">Cancel</button>
          <button type="button" onClick={handleSimulate} disabled={!description} className="rounded-theme-md bg-theme-red px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Run incident graph</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
