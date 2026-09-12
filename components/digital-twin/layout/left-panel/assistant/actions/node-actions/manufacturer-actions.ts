import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

export const useManufacturerActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `addManufacturerNode_${panelId}`,
    description: "Add a manufacturer node to the supply chain canvas. Manufacturers transform raw materials into finished products or components.",
    parameters: [
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the manufacturer (e.g., 'Auto Parts Manufacturing', 'Electronics Assembly Co')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Detailed description of what this manufacturer produces (e.g., 'Assembles electronic components into consumer devices')",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'Detroit, MI, USA', 'Shenzhen, China'). Choose realistic manufacturing hubs.",
        required: true
      },
      {
        name: "country",
        type: "string",
        description: "The 3-letter ISO 3166-1 alpha-3 code for the country (e.g., USA, CHN, DEU)",
        required: true
      },
      {
        name: "capacity",
        type: "number",
        description: "Production capacity. Typical range for manufacturers: 800-1500 units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Lead time in days. Typical range for manufacturers: 7-14 days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9. Consider production complexity, technology dependence, and location factors.",
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
    handler: ({ label, description, address, capacity = 1200, leadTime = 10, riskScore = 0.5, latitude, longitude, country }) => {
      if (onAddNode) {
        const nodeData = {
          label,
          description,
          type: "manufacturer",
          capacity,
          leadTime,
          riskScore,
          location: { lat: latitude, lng: longitude, country },
          address,
          nodeColor: "#EF4444" // Red color for manufacturers
        };

        onAddNode("manufacturer", label, nodeData);
        return `Successfully added manufacturer node: ${label}`;
      }
      return "Failed to add manufacturer node: onAddNode function not available";
    }
  });
}; 