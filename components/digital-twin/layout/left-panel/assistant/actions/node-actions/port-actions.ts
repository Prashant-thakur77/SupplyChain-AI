import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

export const usePortActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `addPortNode_${panelId}`,
    description: "Add a port node to the supply chain canvas. Ports handle international shipping and cargo operations.",
    parameters: [
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the port (e.g., 'Port of Los Angeles', 'Port of Rotterdam', 'Shanghai Port')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Detailed description of port operations (e.g., 'Major international shipping port handling container cargo and bulk goods')",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'Los Angeles, CA, USA', 'Rotterdam, Netherlands'). Use actual major port locations.",
        required: true
      },
      {
        name: "country",
        type: "string",
        description: "The 3-letter ISO 3166-1 alpha-3 code for the country (e.g., USA, NLD, CHN)",
        required: true
      },
      {
        name: "capacity",
        type: "number",
        description: "Cargo handling capacity. Typical range for ports: 3000-5000 units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Cargo processing time in days. Typical range for ports: 5-10 days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9. Consider congestion, weather, and geopolitical factors.",
        required: false
      },
      {
        name: "latitude",
        type: "number",
        description: "Latitude coordinate for the location. Should match the provided address.",
        required: true
      },
      {
        name: "longitude",
        type: "number",
        description: "Longitude coordinate for the location. Should match the provided address.",
        required: true
      }
    ],
    handler: ({ label, description, address, capacity = 4000, leadTime = 7, riskScore = 0.4, latitude, longitude, country }) => {
      if (onAddNode) {
        const nodeData = {
          label,
          description,
          type: "port",
          capacity,
          leadTime,
          riskScore,
          location: { lat: latitude, lng: longitude, country },
          address,
          nodeColor: "#06B6D4" // Cyan color for ports
        };

        onAddNode("port", label, nodeData);
        return `Successfully added port node: ${label}`;
      }
      return "Failed to add port node: onAddNode function not available";
    }
  });
}; 