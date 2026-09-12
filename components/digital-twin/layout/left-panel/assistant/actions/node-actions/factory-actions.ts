import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

export const useFactoryActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `addFactoryNode_${panelId}`,
    description: "Add a factory node to the supply chain canvas. Factories are large-scale production facilities that manufacture goods.",
    parameters: [
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the factory (e.g., 'Tesla Gigafactory', 'Automotive Assembly Plant')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Detailed description of what this factory produces (e.g., 'Large-scale automotive assembly and battery production facility')",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'Austin, TX, USA', 'Munich, Germany'). Choose realistic industrial locations.",
        required: true
      },
      {
        name: "country",
        type: "string",
        description: "The 3-letter ISO 3166-1 alpha-3 code for the country (e.g., USA, DEU, JPN)",
        required: true
      },
      {
        name: "capacity",
        type: "number",
        description: "Production capacity. Typical range for factories: 500-1000 units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Lead time in days. Typical range for factories: 7-14 days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9. Consider automation level, worker dependencies, and operational complexity.",
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
    handler: ({ label, description, address, capacity = 750, leadTime = 10, riskScore = 0.3, latitude, longitude, country }) => {
      if (onAddNode) {
        const nodeData = {
          label,
          description,
          type: "factory",
          capacity,
          leadTime,
          riskScore,
          location: { lat: latitude, lng: longitude, country },
          address,
          nodeColor: "#EF4444" // Red color for factories
        };

        onAddNode("factory", label, nodeData);
        return `Successfully added factory node: ${label}`;
      }
      return "Failed to add factory node: onAddNode function not available";
    }
  });
}; 