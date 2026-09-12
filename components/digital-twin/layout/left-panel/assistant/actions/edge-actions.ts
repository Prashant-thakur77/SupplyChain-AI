    import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { Edge } from 'reactflow';
import { ActionContext } from './types';

export const useEdgeActions = ({ edges, panelId, props }: ActionContext) => {
  const { onUpdateEdge, onFindAndSelectEdges } = props;
  // console.log("onFindAndSelectEdges", onFindAndSelectEdges)

  // Update edge properties
  useCopilotAction({
    name: `updateEdgeProperties_${panelId}`,
    description: "Update properties of a specific connection/edge.",
    parameters: [
      { name: "edgeId", type: "string", description: "The ID of the edge.", required: false },
      { name: "sourceNodeId", type: "string", description: "The ID of the source node.", required: false },
      { name: "targetNodeId", type: "string", description: "The ID of the target node.", required: false },
      { name: "properties", type: "object", description: "Properties to update.", required: true },
    ],
    handler: ({ edgeId, sourceNodeId, targetNodeId, properties }) => {
      console.log("Attempting to update edge properties with received arguments:", { edgeId, sourceNodeId, targetNodeId, properties });
      if (onUpdateEdge) {
        let targetEdgeId = edgeId;
        if (!targetEdgeId && sourceNodeId && targetNodeId) {
          console.log("No edgeId provided, attempting to find edge via source and target nodes.");
          const foundEdge = edges.find(e => e.source === sourceNodeId && e.target === targetNodeId);
          if (foundEdge) {
            targetEdgeId = foundEdge.id;
            console.log(`Found edge with ID: ${targetEdgeId}`);
          } else {
            toast.error(`Edge between ${sourceNodeId} and ${targetNodeId} not found.`);
            return;
          }
        }

        if (targetEdgeId) {
          console.log(`Updating edge ${targetEdgeId} with properties:`, properties);
          onUpdateEdge(targetEdgeId, properties);
          toast.success(`Updated properties for edge ${targetEdgeId}.`);
          return `Successfully updated edge ${targetEdgeId}`;
        } else {
          toast.error("Please provide either an edge ID or source/target node IDs.");
          return "Failed to update edge: Invalid ID or nodes";
        }
      }
      return "Failed to update edge: onUpdateEdge function not available";
    },
  });

  // Calculate risk score for edges
  const calculateRiskScore = (edge: Edge): number => {
    const {
        riskMultiplier = 1,
        avgDelayDays = 0,
        frequencyOfDisruptions = 0,
        transitTime = 0
    } = edge.data || {};
    return (riskMultiplier * 5) + (avgDelayDays * 2) + (frequencyOfDisruptions * 3) + (transitTime * 1);
  };

  // Find riskiest connections
  useCopilotAction({
    name: `findRiskiestConnections_${panelId}`,
    description: "Identifies and highlights the connections with the highest risk.",
    parameters: [
      { name: "topN", type: "number", description: "The number of riskiest connections to find.", required: false, default: 5 },
    ],
    handler: ({ topN = 5 }) => {
      if (onFindAndSelectEdges && edges.length > 0) {
        const sortedEdges = [...edges]
            .map(edge => ({ ...edge, riskScore: calculateRiskScore(edge) }))
            .sort((a, b) => b.riskScore - a.riskScore);

        const riskiestEdges = sortedEdges.slice(0, topN);
        onFindAndSelectEdges(riskiestEdges.map(e => e.id));
        toast.success(`Highlighted the top ${riskiestEdges.length} riskiest connections.`);
        return `Successfully highlighted ${riskiestEdges.length} riskiest connections`;
      } else {
        toast.info("No connections to analyze.");
        return "No connections to analyze";
      }
    },
  });
}; 