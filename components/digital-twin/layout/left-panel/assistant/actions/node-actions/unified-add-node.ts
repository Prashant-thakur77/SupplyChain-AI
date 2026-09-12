"use client"

import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

// Default values per node type
const NODE_DEFAULTS: Record<string, { capacity: number; leadTime: number; riskScore: number; color: string }> = {
  supplier:     { capacity: 1500, leadTime: 15, riskScore: 0.4, color: "#3B82F6" },
  manufacturer: { capacity: 1200, leadTime: 12, riskScore: 0.35, color: "#8B5CF6" },
  factory:      { capacity: 750,  leadTime: 10, riskScore: 0.3, color: "#EF4444" },
  warehouse:    { capacity: 2000, leadTime: 3,  riskScore: 0.2, color: "#F59E0B" },
  distributor:  { capacity: 1000, leadTime: 5,  riskScore: 0.35, color: "#10B981" },
  retailer:     { capacity: 500,  leadTime: 2,  riskScore: 0.25, color: "#EC4899" },
  customer:     { capacity: 300,  leadTime: 1,  riskScore: 0.15, color: "#6366F1" },
  "3pl":        { capacity: 1500, leadTime: 5,  riskScore: 0.3, color: "#14B8A6" },
  port:         { capacity: 5000, leadTime: 7,  riskScore: 0.5, color: "#0EA5E9" },
};

const VALID_TYPES = Object.keys(NODE_DEFAULTS).join(", ");

export const useUnifiedNodeActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `addNode_${panelId}`,
    description: `Add a node to the supply chain canvas. Supported nodeType values: ${VALID_TYPES}. Choose the type that best matches the user's intent.`,
    parameters: [
      {
        name: "nodeType",
        type: "string",
        description: `The type of node to add. Must be one of: ${VALID_TYPES}`,
        required: true
      },
      {
        name: "label",
        type: "string",
        description: "Display name/label for the node (e.g., 'Steel Supplier Inc', 'Tesla Gigafactory', 'Mumbai Port')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "What this node does or provides in the supply chain",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'Pittsburgh, PA, USA')",
        required: true
      },
      {
        name: "country",
        type: "string",
        description: "3-letter ISO 3166-1 alpha-3 country code (e.g., USA, GBR, CHN, IND)",
        required: true
      },
      {
        name: "capacity",
        type: "number",
        description: "Production/storage capacity in units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Lead time in days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9",
        required: false
      },
      {
        name: "latitude",
        type: "number",
        description: "Latitude coordinate matching the address",
        required: true
      },
      {
        name: "longitude",
        type: "number",
        description: "Longitude coordinate matching the address",
        required: true
      }
    ],
    handler: ({ nodeType, label, description, address, country, capacity, leadTime, riskScore, latitude, longitude }) => {
      if (!onAddNode) {
        return "Failed to add node: onAddNode function not available";
      }

      const type = nodeType.toLowerCase();
      const defaults = NODE_DEFAULTS[type] || NODE_DEFAULTS.supplier;

      const nodeData = {
        label,
        description,
        type,
        capacity: capacity ?? defaults.capacity,
        leadTime: leadTime ?? defaults.leadTime,
        riskScore: riskScore ?? defaults.riskScore,
        location: { lat: latitude, lng: longitude, country },
        address,
        nodeColor: defaults.color
      };

      onAddNode(type, label, nodeData);
      return `Successfully added ${type} node: ${label}`;
    }
  });
};
