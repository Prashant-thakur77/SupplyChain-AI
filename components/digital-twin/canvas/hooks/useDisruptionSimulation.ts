import { useDigitalTwinStore } from '@/lib/digitalTwinStore';
import { useCallback } from 'react';

export function useDisruptionSimulation() {
  const { nodes, edges, setDisruptedNodes, setDisruptedEdges, clearDisruptions } = useDigitalTwinStore();

  const simulateDisruption = useCallback((rootNodeId: string) => {
    const queue: string[] = [rootNodeId];
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();

    visitedNodes.add(rootNodeId);

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;

      // Find all outgoing edges from the current node
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);

      for (const edge of outgoingEdges) {
        if (!visitedEdges.has(edge.id)) {
          visitedEdges.add(edge.id);
        }

        if (!visitedNodes.has(edge.target)) {
          visitedNodes.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    setDisruptedNodes(Array.from(visitedNodes));
    setDisruptedEdges(Array.from(visitedEdges));
  }, [edges, setDisruptedNodes, setDisruptedEdges]);

  return {
    simulateDisruption,
    clearDisruptions
  };
}
