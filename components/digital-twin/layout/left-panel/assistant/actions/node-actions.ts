import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { ActionContext } from './types';
import { useUnifiedNodeActions } from './node-actions/unified-add-node';

type NodeDataWithLocation = {
  label: string;
  location?: Record<string, any>;
  [key: string]: any;
};

export const useNodeActions = ({ nodes, edges, panelId, props }: ActionContext) => {
  const {  onUpdateNode, onUpdateMultipleNodes, onFindAndSelectNode, onAddMultipleEdges, onDeleteNode } = props;
  
  // Single unified addNode action replaces 9 per-type actions (saves ~80% tokens per request)
  useUnifiedNodeActions({ panelId, props });

  // Update single node properties
  useCopilotAction({
    name: `updateNodeProperties_${panelId}`,
    description: "Update properties of a specific node on the canvas.",
    parameters: [
      { name: "nodeId", type: "string", description: "The ID of the node to update.", required: true },
      { name: "nodeLabel", type: "string", description: "The label of the node to update.", required: true },
      { name: "properties", type: "object", description: "An object with properties to update.", required: true },
    ],
    handler: ({ nodeId, nodeLabel, properties }) => {
      console.log("🔍 Starting node update handler with:", { nodeId, nodeLabel, properties });
      console.log(onUpdateNode)
      if (onUpdateNode) {

        console.log("on update node properties")
        let targetNodeId = nodeId;
        let targetNode = null;

        if (nodeId) {
          console.log("🔍 Looking for node with ID:", nodeId);
          targetNode = nodes.find(n => n.id === nodeId);
          if (targetNode) {
            targetNodeId = targetNode.id;
            console.log("✅ Found node by ID:", targetNode);
          } else {
            console.log("❌ No node found with ID:", nodeId);
          }
        }
        
        if (!targetNode && nodeLabel) {
          targetNode = nodes.find(n => n.data?.label === nodeLabel);
          if (targetNode) {
            targetNodeId = targetNode.id;
          }
        }

        if (targetNode && targetNodeId) {
          console.log("--- Debug: updateNodeProperties ---");
          console.log("Received arguments:", { nodeId, nodeLabel, properties });
          console.log("Found target node:", targetNode);
          
          const processedProperties: Record<string, any> = { ...properties };
          const data = targetNode.data as NodeDataWithLocation;
          const newLocation = { ...(data.location || {}) };
          let locationUpdated = false;

          console.log("Initial data for processing:", { processedProperties, newLocation });

          if ('country' in processedProperties) {
            newLocation.country = processedProperties.country;
            delete processedProperties.country;
            locationUpdated = true;
            console.log("`country` property found. newLocation is now:", newLocation);
          }

          if ('countryName' in processedProperties) {
            newLocation.countryName = processedProperties.countryName;
            delete processedProperties.countryName;
            locationUpdated = true;
            console.log("`countryName` property found. newLocation is now:", newLocation);
          }

          if ('latitude' in processedProperties) {
            newLocation.lat = processedProperties.latitude;
            delete processedProperties.latitude;
            locationUpdated = true;
            console.log("`latitude` property found. newLocation is now:", newLocation);
          }

          if ('longitude' in processedProperties) {
            newLocation.lng = processedProperties.longitude;
            delete processedProperties.longitude;
            locationUpdated = true;
            console.log("`longitude` property found. newLocation is now:", newLocation);
          }
          
          if (locationUpdated) {
            processedProperties.location = newLocation;
            console.log("Location was updated. Final `processedProperties` to be sent:", processedProperties);
          } else {
            console.log("No location properties were updated. Final `processedProperties`:", processedProperties);
          }

          onUpdateNode(targetNodeId, processedProperties);
          // toast.success(`Updated properties for node ${data.label}.`);
          return `Successfully updated node ${targetNodeId} properties`;
        } else {
          toast.error("Please provide a valid node ID or label.");
          console.error("--- Debug: updateNodeProperties ---");
          console.error("Could not find target node with:", { nodeId, nodeLabel });
          return "Failed to update node: Invalid node ID or label provided";
        }
      }
      return "Failed to update node: onUpdateNode function not available";
    },
  });

  // Update multiple nodes
  useCopilotAction({
    name: `updateMultipleNodeProperties_${panelId}`,
    description: "Update properties for multiple nodes at once based on a filter.",
    parameters: [
      { name: "filter", type: "object", description: "Filter to select nodes (e.g., { \"type\": \"supplierNode\", \"data.country\": \"CN\" }).", required: true },
      { name: "properties", type: "object", description: "Properties to update.", required: true },
    ],
    handler: ({ filter, properties }) => {
      if (onUpdateMultipleNodes) {
        const getProperty = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);
        
        const filteredNodes = nodes.filter(node => {
          return Object.entries(filter).every(([path, value]) => {
            const nodeValue = getProperty(node, path);
            return nodeValue === value;
          });
        });

        if (filteredNodes.length > 0) {
          const nodeIds = filteredNodes.map(n => n.id);
          onUpdateMultipleNodes(nodeIds, properties);
          // toast.success(`Updated ${nodeIds.length} nodes.`);
          return `Successfully updated ${nodeIds.length} nodes`;
        } else {
          toast.info("No nodes matched the filter criteria.");
          return "No nodes matched the filter criteria.";
        }
      }
      return "Failed to update nodes: onUpdateMultipleNodes function not available";
    },
  });

  // Find and select node
  useCopilotAction({
    name: `findAndSelectNode_${panelId}`,
    description: "Finds and selects a node on the canvas by its ID.",
    parameters: [
      { name: "nodeId", type: "string", description: "The ID of the node to find and select.", required: true },
    ],
    handler: ({ nodeId }) => {
      console.log("🔍 === FIND AND SELECT NODE BY ID DEBUG ===");
      console.log("📋 Input nodeId:", nodeId);
      console.log("🔧 Panel ID:", panelId);
      console.log("📊 Total nodes available:", nodes.length);
      console.log("🎯 onFindAndSelectNode function available:", !!onFindAndSelectNode);
      
      if (!onFindAndSelectNode) {
        console.error("❌ onFindAndSelectNode function is not available!");
        toast.error("Node selection function is not available.");
        return;
      }

      if (!nodeId || typeof nodeId !== 'string') {
        console.error("❌ Invalid nodeId:", nodeId);
        toast.error("Please provide a valid node ID.");
        return;
      }
      
      // Log all available node IDs for debugging
      console.log("📝 Available node IDs:");
      nodes.forEach((node, index) => {
        console.log(`  ${index + 1}. ID: "${node.id}", Type: "${node.type}", Label: "${node.data?.label || 'No label'}"`);
      });

      try {
        console.log(`🔎 Searching for node with ID: "${nodeId}"`);
        
        const foundNode = nodes.find(n => n.id === nodeId);

        if (foundNode) {
          console.log("✅ Found matching node:", {
            id: foundNode.id,
            type: foundNode.type,
            label: foundNode.data?.label,
            position: foundNode.position,
            data: foundNode.data
          });
          
          console.log("🎯 Calling onFindAndSelectNode with ID:", foundNode.id);
          onFindAndSelectNode(foundNode.id);
          toast.success(`Found and selected node: ${foundNode.data?.label || foundNode.id}`);
          
          console.log("✅ Node selection completed successfully");
          return `Successfully selected node: ${foundNode.id}`;
        } else {
          console.log("❌ No node found with ID:", nodeId);
          console.log("💡 Available node IDs are:", nodes.map(n => n.id));
          
          toast.error(`Could not find a node with ID "${nodeId}".`);
        }
      } catch (error) {
        console.error("💥 Error during node search:", error);
        toast.error("An error occurred while searching for the node.");
      }
      
      console.log("🏁 === END FIND AND SELECT NODE BY ID DEBUG ===");
    },
  });

  // Connect two nodes by creating an edge
  useCopilotAction({
    name: `connectNodes_${panelId}`,
    description: "Connect two nodes by creating a new edge/connection between them. This creates a transportation route or supply flow between the nodes.",
    parameters: [
      {
        name: "sourceNodeId",
        type: "string",
        description: "The ID of the source node (where the connection starts from)",
        required: false
      },
      {
        name: "targetNodeId", 
        type: "string",
        description: "The ID of the target node (where the connection goes to)",
        required: false
      },
      {
        name: "sourceNodeLabel",
        type: "string",
        description: "The label of the source node (alternative to sourceNodeId)",
        required: false
      },
      {
        name: "targetNodeLabel",
        type: "string", 
        description: "The label of the target node (alternative to targetNodeId)",
        required: false
      },
      {
        name: "mode",
        type: "string",
        description: "Transportation mode for the connection (road, sea, air, rail). Default is 'road'",
        required: false
      },
      {
        name: "cost",
        type: "number",
        description: "Transportation cost for this route. Generate realistic values based on distance and mode",
        required: false
      },
      {
        name: "transitTime",
        type: "number", 
        description: "Transit time in days for this route. Generate realistic values based on distance and mode",
        required: false
      },
      {
        name: "riskMultiplier",
        type: "number",
        description: "Risk multiplier for this route (1.0 = normal risk, higher = more risky). Default is 1.0",
        required: false
      }
    ],
    handler: ({ sourceNodeId, targetNodeId, sourceNodeLabel, targetNodeLabel, mode = "road", cost, transitTime, riskMultiplier = 1.0 }) => {
      if (!onAddMultipleEdges) {
        toast.error("Edge creation is not available.");
        return;
      }

      // Find source node
      let sourceNode = null;
      if (sourceNodeId) {
        sourceNode = nodes.find(n => n.id === sourceNodeId);
      } else if (sourceNodeLabel) {
        sourceNode = nodes.find(n => n.data?.label?.toLowerCase() === sourceNodeLabel.toLowerCase());
      }

      // Find target node  
      let targetNode = null;
      if (targetNodeId) {
        targetNode = nodes.find(n => n.id === targetNodeId);
      } else if (targetNodeLabel) {
        targetNode = nodes.find(n => n.data?.label?.toLowerCase() === targetNodeLabel.toLowerCase());
      }

      // Validate nodes exist
      if (!sourceNode) {
        toast.error(`Source node not found. Please provide a valid sourceNodeId or sourceNodeLabel.`);
        return;
      }

      if (!targetNode) {
        toast.error(`Target node not found. Please provide a valid targetNodeId or targetNodeLabel.`);
        return;
      }

      // Check if connection already exists
      const existingConnection = nodes.find(edge => 
        (edge as any).source === sourceNode!.id && (edge as any).target === targetNode!.id
      );

      if (existingConnection) {
        toast.warning(`A connection already exists between "${sourceNode.data?.label}" and "${targetNode.data?.label}".`);
        return;
      }

      // Generate realistic values if not provided
      const finalCost = cost || generateRealisticCost(mode, sourceNode, targetNode);
      const finalTransitTime = transitTime || generateRealisticTransitTime(mode, sourceNode, targetNode);

      // Create new edge
      const newEdge = {
        id: `edge-${sourceNode.id}-${targetNode.id}-${Date.now()}`,
        source: sourceNode.id,
        target: targetNode.id,
        type: 'customEdge',
        data: {
          mode,
          cost: finalCost,
          transitTime: finalTransitTime,
          riskMultiplier,
          label: `${sourceNode.data?.label} → ${targetNode.data?.label}`,
          // Additional default properties
          avgDelayDays: mode === 'sea' ? 2 : mode === 'air' ? 0.5 : 1,
          frequencyOfDisruptions: riskMultiplier > 1.5 ? 3 : riskMultiplier > 1.2 ? 2 : 1,
          hasAltRoute: false,
          passesThroughChokepoint: mode === 'sea' ? true : false
        }
      };

      // Add the edge
      onAddMultipleEdges([newEdge]);
      toast.success(`Connected "${sourceNode.data?.label}" to "${targetNode.data?.label}" via ${mode}.`);
      return `Successfully connected ${sourceNode.data?.label} to ${targetNode.data?.label}`;
    }
  });

  // Delete a node
  useCopilotAction({
    name: `deleteNode_${panelId}`,
    description: "Deletes a specific node from the canvas.",
    parameters: [
      { name: "nodeId", type: "string", description: "The ID of the node to delete.", required: false },
      { name: "nodeLabel", type: "string", description: "The label of the node to delete.", required: false },
    ],
    handler: ({ nodeId, nodeLabel }) => {
      if (!onDeleteNode) {
        toast.error("Node deletion is not available.");
        return;
      }
      if (!nodeId && !nodeLabel) {
        toast.error("Please provide a node ID or label to delete.");
        return;
      }

      let nodeToDelete = null;
      if (nodeId) {
        nodeToDelete = nodes.find(n => n.id === nodeId);
      } else if (nodeLabel) {
        nodeToDelete = nodes.find(n => n.data?.label?.toLowerCase() === nodeLabel.toLowerCase());
      }

      if (nodeToDelete) {
        onDeleteNode(nodeToDelete.id);
        toast.success(`Node "${nodeToDelete.data?.label || nodeToDelete.id}" has been deleted.`);
        return `Successfully deleted node: ${nodeToDelete.id}`;
      } else {
        toast.error(`Could not find node with ${nodeId ? `ID "${nodeId}"` : `label "${nodeLabel}"`}.`);
      }
    },
  });
};

// Helper functions to generate realistic values
function generateRealisticCost(mode: string, sourceNode: any, targetNode: any): number {
  const baseCosts = {
    road: 500,
    sea: 1200, 
    air: 2500,
    rail: 800
  };
  
  const baseCost = baseCosts[mode as keyof typeof baseCosts] || baseCosts.road;
  
  // Add some randomness and factor in risk
  const sourceRisk = sourceNode.data?.riskScore || 0.5;
  const targetRisk = targetNode.data?.riskScore || 0.5;
  const riskFactor = 1 + (sourceRisk + targetRisk) * 0.3;
  
  return Math.round(baseCost * riskFactor * (0.8 + Math.random() * 0.4));
}

function generateRealisticTransitTime(mode: string, sourceNode: any, targetNode: any): number {
  const baseTimes = {
    road: 3,
    sea: 14,
    air: 1, 
    rail: 5
  };
  
  const baseTime = baseTimes[mode as keyof typeof baseTimes] || baseTimes.road;
  
  // Factor in locations if available
  const sourceCountry = sourceNode.data?.location?.country || sourceNode.data?.country;
  const targetCountry = targetNode.data?.location?.country || targetNode.data?.country;
  
  let distanceFactor = 1;
  if (sourceCountry && targetCountry && sourceCountry !== targetCountry) {
    distanceFactor = 1.5; // International routes take longer
  }
  
  return Math.round(baseTime * distanceFactor * (0.7 + Math.random() * 0.6));
} 