import React, { useState } from 'react';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';
import { useDisruptionSimulation } from './hooks/useDisruptionSimulation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ManualDisruptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
}

export default function ManualDisruptionDialog({ isOpen, onClose, nodeId }: ManualDisruptionDialogProps) {
  const [description, setDescription] = useState('');
  const { 
    nodes, 
    edges,
    setIsAnalyzingDisruption, 
    setDisruptionAnalysis 
  } = useDigitalTwinStore();
  const { simulateDisruption } = useDisruptionSimulation();

  const handleSimulate = async () => {
    if (!nodeId || !description) return;
    
    // Set UI state to loading
    setIsAnalyzingDisruption(true);
    // Trigger BFS to make UI red instantly
    simulateDisruption(nodeId);
    onClose();

    try {
      const response = await fetch('/api/agent/route-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId,
          description,
          nodes: nodes.map(n => ({ id: n.id, data: n.data, type: n.type })),
          edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, data: e.data }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to analyze disruption: ${errorData.error || response.status}`);
      }

      const data = await response.json();
      setDisruptionAnalysis(data);
    } catch (error) {
      console.error('Error analyzing disruption:', error);
      // Fallback data if API fails
      setDisruptionAnalysis({
        severity: "High",
        impactDescription: `Simulation of: "${description}". Immediate downstream delays expected.`,
        alternateRoutes: [
          "Wait for conditions to clear.",
          "Check secondary nodes for capacity."
        ]
      });
    } finally {
      setIsAnalyzingDisruption(false);
      setDescription('');
    }
  };

  const nodeName = nodes.find(n => n.id === nodeId)?.data?.label || nodeId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Simulate Disruption
          </DialogTitle>
          <DialogDescription>
            Describe the problem occurring at <strong>{nodeName}</strong>. The AI will analyze the impact and suggest alternate routes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., A massive storm has flooded the main access roads..."
            className="min-h-[100px] w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSimulate}
            disabled={!description}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Simulate & Analyze
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
