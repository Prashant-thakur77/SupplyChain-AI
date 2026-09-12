import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { ActionContext } from './types';

export const useCanvasActions = ({ nodes, edges, panelId, props }: ActionContext) => {
  const { onHighlightNodes, onClearCanvas, onUpdateNodePositions } = props;

  // Highlight nodes by property
  useCopilotAction({
    name: `highlightNodesByProperty_${panelId}`,
    description: "Highlights all nodes that match certain criteria.",
    parameters: [
      { name: "filter", type: "object", description: "Filter to highlight nodes (e.g., { \"data.country\": \"USA\" } or { \"data.riskScore\": { \">\": 0.7 } }).", required: true },
    ],
    handler: ({ filter }) => {
      if (onHighlightNodes) {
        const getProperty = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);

        const highlightedNodes = nodes.filter(node => {
          return Object.entries(filter).every(([path, condition]) => {
            const nodeValue = getProperty(node, path);
            if (typeof condition === 'object' && condition !== null) {
              return Object.entries(condition).every(([operator, value]) => {
                switch (operator) {
                  case '>': return nodeValue > (value as any);
                  case '<': return nodeValue < (value as any);
                  case '>=': return nodeValue >= (value as any);
                  case '<=': return nodeValue <= (value as any);
                  case '===': return nodeValue === value;
                  case '!==': return nodeValue !== value;
                  default: return false;
                }
              });
            }
            return nodeValue === condition;
          });
        });

        if (highlightedNodes.length > 0) {
          onHighlightNodes(highlightedNodes.map(n => n.id));
          toast.success(`Highlighted ${highlightedNodes.length} nodes.`);
          return `Successfully highlighted ${highlightedNodes.length} nodes`;
        } else {
          toast.info("No nodes matched the highlighting criteria.");
          return "No nodes matched the highlighting criteria";
        }
      }
      return "Failed to highlight nodes: onHighlightNodes function not available";
    },
  });

  // Clear canvas
  useCopilotAction({
    name: `clearCanvas_${panelId}`,
    description: "Clear all nodes and edges from the canvas",
    parameters: [],
    handler: () => {
      if (onClearCanvas) {
        // Check if there are any nodes or edges to clear
        if (nodes.length === 0 && edges.length === 0) {
          toast.info("Canvas is already empty - nothing to clear.");
          return "Canvas is already empty";
        }
        
        onClearCanvas();
        toast.success("Cleared the canvas. You can now start building a new supply chain.");
        return "Successfully cleared the canvas";
      }
      return "Failed to clear canvas: onClearCanvas function not available";
    }
  });
}; 