import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { ActionContext } from './types';

export const useRiskActions = ({ nodes, edges, panelId, props }: ActionContext) => {
  const { onHighlightNodes } = props;

  // Identify single points of failure
  useCopilotAction({
    name: `identifySinglePointsOfFailure_${panelId}`,
    description: "Analyzes the supply chain to identify nodes that are single points of failure.",
    parameters: [],
    handler: () => {
      if (onHighlightNodes && nodes.length > 0) {
        const adj: { [key: string]: string[] } = {};
        for (const edge of edges) {
          if (!adj[edge.source]) adj[edge.source] = [];
          if (!adj[edge.target]) adj[edge.target] = [];
          adj[edge.source].push(edge.target);
          adj[edge.target].push(edge.source);
        }

        const countConnectedComponents = (excludedNodeId?: string): number => {
          const visited = new Set<string>();
          let count = 0;
          for (const node of nodes) {
            if (node.id !== excludedNodeId && !visited.has(node.id)) {
              count++;
              const stack = [node.id];
              visited.add(node.id);
              while (stack.length > 0) {
                const u = stack.pop()!;
                for (const v of adj[u] || []) {
                  if (v !== excludedNodeId && !visited.has(v)) {
                    visited.add(v);
                    stack.push(v);
                  }
                }
              }
            }
          }
          return count;
        };

        const initialComponents = countConnectedComponents();
        const spof_nodes = nodes.filter(node => {
          return countConnectedComponents(node.id) > initialComponents;
        });

        if (spof_nodes.length > 0) {
          onHighlightNodes(spof_nodes.map(n => n.id));
          toast.warning(`Identified and highlighted ${spof_nodes.length} single point(s) of failure.`);
          return `Identified ${spof_nodes.length} single points of failure.`;
        } else {
          toast.success("No single points of failure found. Your supply chain is resilient.");
          return "No single points of failure found.";
        }
      } else {
        toast.info("Not enough nodes to perform analysis.");
        return "Not enough nodes.";
      }
    }
  });
}; 