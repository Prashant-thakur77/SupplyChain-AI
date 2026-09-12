import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { ActionContext } from './types';
import { LayoutManager } from '@/lib/layout/layout-algorithms';

// This hook now only provides the `optimizeLayout` Copilot action.
export const useVisualPerformanceActions = ({ nodes, edges, panelId, props }: ActionContext) => {
  const { onUpdateMultipleNodes, onUpdateNodePositions } = props;
  
  // console.log("🔧 VISUAL PERFORMANCE ACTIONS INIT", {
  //   onUpdateMultipleNodesAvailable: !!onUpdateMultipleNodes,
  //   onUpdateNodePositionsAvailable: !!onUpdateNodePositions,
  //   onUpdateMultipleNodesType: typeof onUpdateMultipleNodes,
  //   propsKeys: Object.keys(props || {}),
  //   panelId
  // });

  // Intelligent layout optimization
  useCopilotAction({
    name: `optimizeLayout_${panelId}`,
    description:
      "Automatically select and apply the best layout algorithm based on network characteristics",
    parameters: [
      {
        name: "priority",
        type: "string",
        description: "Layout priority (clarity, performance, aesthetics)",
        required: false,
        default: "clarity",
      },
      {
        name: "preservePositions",
        type: "boolean",
        description: "Whether to preserve some existing positions",
        required: false,
        default: false,
      },
    ],
    handler: async ({ priority = "clarity", preservePositions = false }) => {
      console.log("🎯 LAYOUT OPTIMIZATION STARTED", {
        priority,
        preservePositions,
        nodesCount: nodes.length,
        edgesCount: edges.length,
        panelId,
        onUpdateNodePositionsAvailable: !!onUpdateNodePositions,
      });

      // Basic structural analysis of the current network
      const networkAnalysis = {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        density:
          edges.length /
          (nodes.length * (nodes.length - 1 === 0 ? 1 : nodes.length - 1) / 2),
        avgConnections: edges.length / (nodes.length || 1),
        hasHierarchy: nodes.some(
          (n) => n.data?.supplierTier || n.type?.includes("supplier")
        ),
      };

      console.log("📊 NETWORK ANALYSIS", networkAnalysis);

      let recommendedLayout: string = "force";
      let layoutReason = "";

      // Algorithm‐selection logic
      if (networkAnalysis.hasHierarchy && networkAnalysis.nodeCount < 200) {
        recommendedLayout = "dagre";
        layoutReason = "hierarchical structure detected";
      } else if (networkAnalysis.density > 0.3 && networkAnalysis.nodeCount < 100) {
        recommendedLayout = "elk";
        layoutReason = "dense network benefits from ELK layout";
      } else if (networkAnalysis.nodeCount > 500) {
        recommendedLayout = "force";
        layoutReason = "large network requires force-directed layout";
      } else if (priority === "performance") {
        recommendedLayout = "grid";
        layoutReason = "performance priority requires simple grid layout";
      } else {
        recommendedLayout = "hierarchical";
        layoutReason = "balanced clarity and performance";
      }

      console.log("🧮 LAYOUT ALGORITHM SELECTED", {
        recommendedLayout,
        layoutReason,
        algorithmSelectionCriteria: {
          hasHierarchy: networkAnalysis.hasHierarchy,
          nodeCount: networkAnalysis.nodeCount,
          density: networkAnalysis.density,
          priority,
        },
      });

      // Log current node positions before update
      console.log("📍 CURRENT NODE POSITIONS", 
        nodes.slice(0, 3).map(node => ({
          id: node.id,
          position: node.position,
          type: node.type,
          data: node.data
        }))
      );

      try {
        // Actually apply the layout algorithm to calculate new positions
        let layoutResult;
        
        if (recommendedLayout === "elk") {
          layoutResult = await LayoutManager.applyELKLayout(nodes, edges, {
            algorithm: 'elk',
            direction: 'TB',
            spacing: { node: 150, rank: 200 },
            animation: true
          });
        } else if (recommendedLayout === "dagre") {
          layoutResult = await LayoutManager.applyDagreLayout(nodes, edges, 'TB');
        } else if (recommendedLayout === "hierarchical") {
          layoutResult = await LayoutManager.applyHierarchicalLayout(nodes, edges);
        } else {
          // Fallback to dagre for unknown layouts
          layoutResult = await LayoutManager.applyDagreLayout(nodes, edges, 'TB');
          recommendedLayout = "dagre";
          layoutReason = "fallback to dagre layout";
        }

        console.log("🎨 LAYOUT CALCULATED", {
          algorithm: recommendedLayout,
          originalPositions: nodes.slice(0, 2).map(n => ({ id: n.id, pos: n.position })),
          newPositions: layoutResult.nodes.slice(0, 2).map(n => ({ id: n.id, pos: n.position })),
        });

        // Add layout metadata to the calculated nodes
        const nodesWithMetadata = layoutResult.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            lastLayoutAlgorithm: recommendedLayout,
            layoutOptimized: true,
            preservedPosition: preservePositions ? nodes.find(n => n.id === node.id)?.position : undefined,
            layoutPriority: priority,
          }
        }));

        // Apply the new positions using the new handler
        if (onUpdateNodePositions) {
          // Convert nodes array to the format expected by onUpdateNodePositions
          const nodePositions = nodesWithMetadata.reduce((acc, node) => {
            acc[node.id] = { x: node.position.x, y: node.position.y };
            return acc;
          }, {} as { [nodeId: string]: { x: number; y: number } });

          console.log("🔄 APPLYING POSITION UPDATES", {
            updateCount: Object.keys(nodePositions).length,
            samplePositions: Object.entries(nodePositions).slice(0, 2).map(([id, pos]) => ({ id, position: pos })),
          });

          onUpdateNodePositions(nodePositions);
          console.log("✅ onUpdateNodePositions CALLED SUCCESSFULLY");
          
          // Also update the metadata using onUpdateMultipleNodes
          if (onUpdateMultipleNodes) {
            const metadataUpdates = nodesWithMetadata.reduce((acc, node) => {
              acc[node.id] = {
                lastLayoutAlgorithm: recommendedLayout,
                layoutOptimized: true,
                preservedPosition: preservePositions ? nodes.find(n => n.id === node.id)?.position : undefined,
                layoutPriority: priority,
              };
              return acc;
            }, {} as Record<string, any>);
            
            onUpdateMultipleNodes(Object.keys(metadataUpdates), metadataUpdates);
            console.log("✅ Layout metadata also applied");
          }
        } else {
          console.error("❌ onUpdateNodePositions NOT AVAILABLE", {
            props,
            availableMethods: Object.keys(props || {}),
          });
        }

       

        // Debug context for developers
        console.log("🎯 LAYOUT OPTIMIZATION COMPLETED", {
          recommendedLayout,
          layoutReason,
          networkAnalysis,
          priority,
          preservePositions,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error("❌ LAYOUT OPTIMIZATION ERROR", error);
        toast.error(`Failed to apply layout: ${error}`);
      }
    },
  });
}; 