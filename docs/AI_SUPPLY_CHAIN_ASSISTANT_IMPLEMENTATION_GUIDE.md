# AI Supply Chain Assistant Implementation Guide

## Overview

This guide provides a detailed implementation plan for integrating an AI-powered Supply Chain Assistant into the LeftPanel component using CopilotKit. The assistant will help users build supply chains through natural language prompts, leveraging context from the creation form and automatically building nodes and edges in the digital twin canvas.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Integration](#frontend-integration)
6. [Context Management](#context-management)
7. [Action Implementation](#action-implementation)
8. [UI Components](#ui-components)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Considerations](#deployment-considerations)

## Architecture Overview

### System Components

The AI Supply Chain Assistant will consist of:

1. **CopilotKit Provider** - Wraps the application and provides AI context
2. **AI Assistant UI** - Chat interface embedded in the LeftPanel
3. **Context Providers** - Supply current canvas state and form data to the AI
4. **Action Handlers** - Execute supply chain building operations
5. **Backend API** - Handles AI model communication

### Data Flow

```
User Prompt → CopilotKit → Gemini API → Action Parser → Supply Chain Builder → Canvas Update
     ↑                                                                              ↓
Form Context ←------ Context Providers ←------ Canvas State ←------ State Update
```

## Prerequisites

### Technical Requirements

- Next.js 13+ with App Router
- React 18+
- TypeScript
- Google Gemini API Key
- Existing supply chain canvas implementation

### Important Note on Gemini Support

CopilotKit supports Google Gemini through the `GoogleGenerativeAIAdapter`. However, there are some known issues with the current implementation (as of CopilotKit v1.9.x). If you encounter validation errors or issues, consider:

1. Using the latest CopilotKit version
2. Trying alternative model names like `gemini-1.5-pro` or `gemini-1.5-flash`
3. Checking the CopilotKit GitHub issues for updates on Gemini support

### Dependencies to Install

```bash
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime @google/generative-ai
```

### Alternative: Using LangChain for Better Gemini Support

If you encounter issues with the direct GoogleGenerativeAIAdapter, you can use LangChain as an alternative:

```bash
npm install @langchain/google-genai @copilotkit/runtime
```

### Environment Variables

```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

## Installation & Setup

### Step 1: Install CopilotKit Dependencies

```bash
pnpm add @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime @google/generative-ai
```

### Step 2: Create Backend API Route

Create `app/api/copilotkit/route.ts`:

```typescript
import { copilotRuntimeNextJSAppRouterEndpoint, CopilotRuntime } from '@copilotkit/runtime';
import { GoogleGenerativeAIAdapter } from '@copilotkit/runtime';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const copilotRuntime = new CopilotRuntime();
  
  const serviceAdapter = new GoogleGenerativeAIAdapter({
    model: 'gemini-flash-lite-latest', // Using compatible Gemini model
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: copilotRuntime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
}
```

### Step 3: Environment Configuration

Update `.env.local`:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

## Backend Configuration

### API Route Structure

The backend will handle AI model communication and provide streaming responses for real-time interaction.

```typescript
// app/api/copilotkit/route.ts
import { copilotRuntimeNextJSAppRouterEndpoint, CopilotRuntime } from '@copilotkit/runtime';
import { GoogleGenerativeAIAdapter } from '@copilotkit/runtime';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const copilotRuntime = new CopilotRuntime({
    // Configure custom instructions for supply chain domain
    instructions: `
      You are an expert supply chain consultant helping users build digital twin representations 
      of their supply chains. You understand:
      - Supply chain nodes (suppliers, manufacturers, warehouses, retailers)
      - Transportation modes and logistics
      - Risk factors and mitigation strategies
      - Industry-specific supply chain patterns
      - Geographic considerations
      
      When users describe their supply chain needs, help them by:
      1. Understanding their industry and product characteristics
      2. Suggesting appropriate node types and connections
      3. Recommending optimal layouts and configurations
      4. Identifying potential risks and bottlenecks
      5. Building the supply chain automatically when requested
    `
  });
  
  const serviceAdapter = new GoogleGenerativeAIAdapter({
    model: 'gemini-flash-lite-latest',
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: copilotRuntime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
}
```

## Frontend Integration

### Step 1: Wrap Application with CopilotKit Provider

Update your main layout or the digital twin page layout:

```typescript
// app/(main)/digital-twin/layout.tsx
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function DigitalTwinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CopilotKit 
      runtimeUrl="/api/copilotkit"
      showDevConsole={process.env.NODE_ENV === 'development'}
    >
      {children}
    </CopilotKit>
  );
}
```

### Step 2: Create AI Assistant Component

Create `components/digital-twin/ai-assistant/SupplyChainAssistant.tsx`:

```typescript
"use client";

import { useState } from 'react';
import { CopilotChat } from "@copilotkit/react-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, X, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SupplyChainAssistantProps {
  isCollapsed: boolean;
}

export function SupplyChainAssistant({ isCollapsed }: SupplyChainAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isCollapsed) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 hover:bg-muted transition-colors group flex items-center justify-center border-t border-border"
        title="Open AI Assistant"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </motion.button>
    );
  }

  return (
    <>
      {/* AI Assistant Toggle Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full gap-2"
          variant="outline"
        >
          <Bot className="h-4 w-4" />
          AI Supply Chain Assistant
        </Button>
      </div>

      {/* AI Assistant Modal/Popup */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Assistant Panel */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`fixed left-4 top-4 bottom-4 z-50 ${
                isMinimized ? 'w-80' : 'w-96'
              } transition-all duration-300`}
            >
              <Card className="h-full flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    AI Supply Chain Assistant
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <div className={`h-full ${isMinimized ? 'h-20' : ''}`}>
                    <CopilotChat
                      instructions="You are an expert supply chain consultant. Help users build their digital twin supply chains by understanding their needs and automatically creating the appropriate nodes and connections."
                      labels={{
                        title: "Supply Chain Assistant",
                        initial: "Hello! I'm here to help you build your supply chain. Describe your business, products, or supply chain needs, and I'll help you create the perfect digital twin representation.",
                      }}
                      className="h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

## Context Management

### Step 1: Create Supply Chain Context Provider

Create `components/digital-twin/ai-assistant/SupplyChainContext.tsx`:

```typescript
"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useEffect } from "react";
import { Node, Edge } from "reactflow";

interface SupplyChainContextProviderProps {
  nodes: Node[];
  edges: Edge[];
  formData?: any;
  children: React.ReactNode;
}

export function SupplyChainContextProvider({
  nodes,
  edges,
  formData,
  children
}: SupplyChainContextProviderProps) {
  
  // Provide current canvas state to the AI
  useCopilotReadable({
    description: "Current supply chain canvas nodes and their configurations",
    value: {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        label: node.data.label,
        position: node.position,
        data: {
          description: node.data.description,
          capacity: node.data.capacity,
          leadTime: node.data.leadTime,
          riskScore: node.data.riskScore,
          location: node.data.location,
          address: node.data.address
        }
      })),
      totalNodes: nodes.length,
      nodeTypes: [...new Set(nodes.map(n => n.type))],
      hasConnections: edges.length > 0
    }
  });

  // Provide edge/connection information
  useCopilotReadable({
    description: "Current supply chain connections and transportation routes",
    value: {
      connections: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        transportMode: edge.data?.mode || 'road',
        cost: edge.data?.cost || 0,
        transitTime: edge.data?.transitTime || 0,
        riskMultiplier: edge.data?.riskMultiplier || 1
      })),
      totalConnections: edges.length
    }
  });

  // Provide form data context if available
  useCopilotReadable({
    description: "User's supply chain requirements and business context from the creation form",
    value: formData ? {
      industry: formData.industry,
      customIndustry: formData.customIndustry,
      productCharacteristics: formData.productCharacteristics,
      supplierTiers: formData.supplierTiers,
      operationsLocation: formData.operationsLocation,
      country: formData.country,
      currency: formData.currency,
      shippingMethods: formData.shippingMethods,
      annualVolumeType: formData.annualVolumeType,
      annualVolumeValue: formData.annualVolumeValue,
      risks: formData.risks
    } : {
      message: "No form data available - user hasn't filled out the creation form yet"
    }
  });

  // Provide available templates and node types
  useCopilotReadable({
    description: "Available supply chain templates and node types that can be used",
    value: {
      availableNodeTypes: [
        "supplier", "manufacturer", "warehouse", "distributor", 
        "retailer", "customer", "3pl", "port"
      ],
      availableTemplates: [
        "Automotive Supply Chain", "Electronics Manufacturing", 
        "Food & Beverage", "Pharmaceutical", "Fashion & Apparel"
      ],
      transportModes: ["road", "rail", "air", "sea", "pipeline"]
    }
  });

  return <>{children}</>;
}
```

### Step 2: Extract Form Data from URL/LocalStorage

Create `hooks/useFormDataContext.ts`:

```typescript
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function useFormDataContext() {
  const [formData, setFormData] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Try to get form data from URL parameters first
    const urlFormData = {
      industry: searchParams.get('industry'),
      customIndustry: searchParams.get('customIndustry'),
      productCharacteristics: searchParams.get('productCharacteristics')?.split(',') || [],
      supplierTiers: searchParams.get('supplierTiers'),
      operationsLocation: searchParams.get('operationsLocation')?.split(',') || [],
      country: searchParams.get('country'),
      currency: searchParams.get('currency'),
      shippingMethods: searchParams.get('shippingMethods')?.split(',') || [],
      annualVolumeType: searchParams.get('annualVolumeType'),
      annualVolumeValue: searchParams.get('annualVolumeValue') ? 
        parseInt(searchParams.get('annualVolumeValue')!) : null,
      risks: searchParams.get('risks')?.split(',') || []
    };

    // Check if we have meaningful URL data
    const hasUrlData = Object.values(urlFormData).some(value => 
      value !== null && value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    );

    if (hasUrlData) {
      setFormData(urlFormData);
    } else {
      // Fall back to localStorage
      try {
        const storedData = localStorage.getItem('supplyChain-default-chain');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setFormData(parsedData);
        }
      } catch (error) {
        console.error('Error parsing localStorage form data:', error);
      }
    }
  }, [searchParams]);

  return formData;
}
```

## Action Implementation

### Step 1: Core Supply Chain Building Actions

Create `components/digital-twin/ai-assistant/SupplyChainActions.tsx`:

```typescript
"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { Node, Edge } from "reactflow";
import { toast } from "sonner";

interface SupplyChainActionsProps {
  onAddNode: (nodeType: string) => void;
  onAddMultipleNodes: (nodes: Partial<Node>[]) => void;
  onAddEdges: (edges: Partial<Edge>[]) => void;
  onLoadTemplate: (templateId: string) => void;
  onClearCanvas: () => void;
  nodes: Node[];
  edges: Edge[];
}

export function SupplyChainActions({
  onAddNode,
  onAddMultipleNodes,
  onAddEdges,
  onLoadTemplate,
  onClearCanvas,
  nodes,
  edges
}: SupplyChainActionsProps) {

  // Action to add a single node
  useCopilotAction({
    name: "addSupplyChainNode",
    description: "Add a single node to the supply chain canvas",
    parameters: [
      {
        name: "nodeType",
        type: "string",
        description: "Type of node to add (supplier, manufacturer, warehouse, distributor, retailer, customer, 3pl, port)",
        required: true
      },
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the node",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Description of what this node represents"
      },
      {
        name: "location",
        type: "object",
        description: "Geographic location of the node",
        attributes: [
          { name: "country", type: "string", description: "Country where node is located" },
          { name: "city", type: "string", description: "City where node is located" },
          { name: "address", type: "string", description: "Full address" }
        ]
      },
      {
        name: "capacity",
        type: "number",
        description: "Production or storage capacity"
      },
      {
        name: "leadTime",
        type: "number", 
        description: "Lead time in days"
      }
    ],
    handler: ({ nodeType, label, description, location, capacity, leadTime }) => {
      const nodeData = {
        type: `${nodeType.toLowerCase()}Node`,
        data: {
          label,
          description: description || `${nodeType} node`,
          type: nodeType,
          capacity: capacity || 500,
          leadTime: leadTime || 7,
          riskScore: 0.3,
          location: location || { lat: 0, lng: 0 },
          address: location?.address || `${location?.city || ''}, ${location?.country || ''}`
        }
      };
      
      onAddNode(nodeType);
      toast.success(`Added ${label} to the supply chain`);
    }
  });

  // Action to build complete supply chain from description
  useCopilotAction({
    name: "buildSupplyChain",
    description: "Build a complete supply chain based on user requirements",
    parameters: [
      {
        name: "nodes",
        type: "object[]",
        description: "Array of nodes to create",
        attributes: [
          { name: "id", type: "string", description: "Unique identifier for the node" },
          { name: "type", type: "string", description: "Node type (supplier, manufacturer, etc.)" },
          { name: "label", type: "string", description: "Display name" },
          { name: "description", type: "string", description: "Node description" },
          { name: "position", type: "object", attributes: [
            { name: "x", type: "number", description: "X coordinate" },
            { name: "y", type: "number", description: "Y coordinate" }
          ]},
          { name: "capacity", type: "number", description: "Capacity" },
          { name: "leadTime", type: "number", description: "Lead time in days" },
          { name: "location", type: "object", attributes: [
            { name: "country", type: "string" },
            { name: "city", type: "string" },
            { name: "address", type: "string" }
          ]}
        ]
      },
      {
        name: "connections",
        type: "object[]",
        description: "Array of connections between nodes",
        attributes: [
          { name: "sourceId", type: "string", description: "Source node ID" },
          { name: "targetId", type: "string", description: "Target node ID" },
          { name: "transportMode", type: "string", description: "Transportation mode (road, rail, air, sea)" },
          { name: "cost", type: "number", description: "Transportation cost" },
          { name: "transitTime", type: "number", description: "Transit time in days" }
        ]
      },
      {
        name: "clearExisting",
        type: "boolean",
        description: "Whether to clear existing nodes before adding new ones"
      }
    ],
    handler: ({ nodes: newNodes, connections, clearExisting }) => {
      if (clearExisting) {
        onClearCanvas();
      }

      // Add nodes
      const nodesToAdd = newNodes.map((node: any, index: number) => ({
        id: node.id || `${node.type}-${Date.now()}-${index}`,
        type: `${node.type.toLowerCase()}Node`,
        data: {
          label: node.label,
          description: node.description || `${node.type} node`,
          type: node.type,
          capacity: node.capacity || 500,
          leadTime: node.leadTime || 7,
          riskScore: 0.3,
          location: node.location || { lat: 0, lng: 0 },
          address: node.location?.address || `${node.location?.city || ''}, ${node.location?.country || ''}`
        },
        position: node.position || {
          x: 200 + (index % 3) * 300,
          y: 200 + Math.floor(index / 3) * 200
        }
      }));

      onAddMultipleNodes(nodesToAdd);

      // Add connections
      if (connections && connections.length > 0) {
        const edgesToAdd = connections.map((conn: any, index: number) => ({
          id: `edge-${Date.now()}-${index}`,
          source: conn.sourceId,
          target: conn.targetId,
          type: 'transportEdge',
          data: {
            mode: conn.transportMode || 'road',
            cost: conn.cost || 100,
            transitTime: conn.transitTime || 1,
            riskMultiplier: 1.0
          }
        }));

        onAddEdges(edgesToAdd);
      }

      toast.success(`Built supply chain with ${newNodes.length} nodes and ${connections?.length || 0} connections`);
    }
  });

  // Action to suggest supply chain improvements
  useCopilotAction({
    name: "analyzeSupplyChain",
    description: "Analyze the current supply chain and provide improvement suggestions",
    parameters: [],
    handler: () => {
      const analysis = {
        nodeCount: nodes.length,
        connectionCount: edges.length,
        nodeTypes: [...new Set(nodes.map(n => n.type))],
        avgConnections: nodes.length > 0 ? edges.length / nodes.length : 0
      };

      toast.info("Supply chain analysis complete - check chat for detailed insights");
      
      return `Current supply chain analysis:
        - ${analysis.nodeCount} nodes
        - ${analysis.connectionCount} connections  
        - Node types: ${analysis.nodeTypes.join(', ')}
        - Average connections per node: ${analysis.avgConnections.toFixed(2)}
        
        Recommendations will be provided based on industry best practices.`;
    }
  });

  // Action to load predefined templates
  useCopilotAction({
    name: "loadSupplyChainTemplate",
    description: "Load a predefined supply chain template",
    parameters: [
      {
        name: "templateName",
        type: "string",
        description: "Name of template to load (automotive, electronics, food-beverage, pharma, fashion)",
        required: true
      }
    ],
    handler: ({ templateName }) => {
      const templateMap: Record<string, string> = {
        'automotive': 'industry-automotive',
        'electronics': 'industry-electronics', 
        'food-beverage': 'industry-food-beverage',
        'pharma': 'industry-pharma',
        'fashion': 'industry-fashion'
      };

      const templateId = templateMap[templateName.toLowerCase()];
      if (templateId) {
        onLoadTemplate(templateId);
        toast.success(`Loaded ${templateName} supply chain template`);
      } else {
        toast.error(`Template "${templateName}" not found`);
      }
    }
  });

  return null; // This component only provides actions, no UI
}
```

### Step 2: Advanced Actions for Risk and Optimization

Create `components/digital-twin/ai-assistant/AdvancedActions.tsx`:

```typescript
"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { Node, Edge } from "reactflow";

interface AdvancedActionsProps {
  nodes: Node[];
  edges: Edge[];
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
  onUpdateEdge: (edgeId: string, updates: Partial<Edge>) => void;
}

export function AdvancedActions({
  nodes,
  edges,
  onUpdateNode,
  onUpdateEdge
}: AdvancedActionsProps) {

  // Action to assess and update risk scores
  useCopilotAction({
    name: "assessSupplyChainRisks",
    description: "Assess and update risk scores for nodes based on various factors",
    parameters: [
      {
        name: "riskFactors",
        type: "object[]",
        description: "Risk factors to consider",
        attributes: [
          { name: "nodeId", type: "string", description: "Node to update" },
          { name: "riskScore", type: "number", description: "Risk score between 0 and 1" },
          { name: "riskReasons", type: "string[]", description: "Reasons for the risk assessment" }
        ]
      }
    ],
    handler: ({ riskFactors }) => {
      riskFactors.forEach((risk: any) => {
        const node = nodes.find(n => n.id === risk.nodeId);
        if (node) {
          onUpdateNode(risk.nodeId, {
            ...node,
            data: {
              ...node.data,
              riskScore: risk.riskScore,
              riskReasons: risk.riskReasons
            }
          });
        }
      });
    }
  });

  // Action to optimize transportation routes
  useCopilotAction({
    name: "optimizeTransportation",
    description: "Optimize transportation modes and routes between nodes",
    parameters: [
      {
        name: "optimizations",
        type: "object[]",
        description: "Transportation optimizations to apply",
        attributes: [
          { name: "edgeId", type: "string", description: "Edge to optimize" },
          { name: "newMode", type: "string", description: "Optimized transport mode" },
          { name: "newCost", type: "number", description: "Optimized cost" },
          { name: "newTransitTime", type: "number", description: "Optimized transit time" },
          { name: "reasoning", type: "string", description: "Reason for optimization" }
        ]
      }
    ],
    handler: ({ optimizations }) => {
      optimizations.forEach((opt: any) => {
        const edge = edges.find(e => e.id === opt.edgeId);
        if (edge) {
          onUpdateEdge(opt.edgeId, {
            ...edge,
            data: {
              ...edge.data,
              mode: opt.newMode,
              cost: opt.newCost,
              transitTime: opt.newTransitTime,
              optimizationReason: opt.reasoning
            }
          });
        }
      });
    }
  });

  return null;
}
```

## UI Components

### Step 1: Update LeftPanel Integration

Update `components/digital-twin/layout/LeftPanel.tsx`:

```typescript
// Add these imports at the top
import { SupplyChainAssistant } from '../ai-assistant/SupplyChainAssistant';

// Add this prop to the LeftPanelProps interface
interface LeftPanelProps {
  // ... existing props
  showAIAssistant?: boolean;
}

// Add the AI Assistant to the bottom of the LeftPanel component
const LeftPanel: FC<LeftPanelProps> = ({ 
  // ... existing props
  showAIAssistant = true 
}) => {
  // ... existing code

  return (
    <motion.div className="h-full border-r border-border bg-background/50 backdrop-blur-sm flex flex-col">
      {/* ... existing content */}
      
      {/* AI Assistant Integration */}
      {showAIAssistant && (
        <SupplyChainAssistant isCollapsed={isCollapsed} />
      )}
    </motion.div>
  );
};
```

### Step 2: Update Canvas Component

Update `components/digital-twin/canvas/digital-twin-canvas.tsx`:

```typescript
// Add these imports
import { SupplyChainContextProvider } from '../ai-assistant/SupplyChainContext';
import { SupplyChainActions } from '../ai-assistant/SupplyChainActions';
import { AdvancedActions } from '../ai-assistant/AdvancedActions';
import { useFormDataContext } from '@/hooks/useFormDataContext';

// Add inside the DigitalTwinCanvas component
export default function DigitalTwinCanvas({
  initialNodes = [],
  initialEdges = []
}: DigitalTwinCanvasProps) {
  // ... existing state and hooks
  
  const formData = useFormDataContext();

  // New handler for adding multiple nodes
  const handleAddMultipleNodes = useCallback((newNodes: Partial<Node>[]) => {
    const fullNodes = newNodes.map((nodeData, index) => ({
      id: nodeData.id || `node-${Date.now()}-${index}`,
      type: nodeData.type || 'supplierNode',
      data: {
        label: 'New Node',
        description: 'AI Generated Node',
        type: 'supplier',
        capacity: 500,
        leadTime: 7,
        riskScore: 0.3,
        location: { lat: 0, lng: 0 },
        address: 'Auto-generated',
        ...nodeData.data
      },
      position: nodeData.position || {
        x: 300 + Math.random() * 100,
        y: 300 + Math.random() * 100
      },
      ...nodeData
    }));
    
    setNodes(currentNodes => [...currentNodes, ...fullNodes]);
  }, [setNodes]);

  // New handler for adding multiple edges
  const handleAddEdges = useCallback((newEdges: Partial<Edge>[]) => {
    const fullEdges = newEdges.map((edgeData, index) => ({
      id: edgeData.id || `edge-${Date.now()}-${index}`,
      type: 'transportEdge',
      data: {
        mode: 'road',
        cost: 100,
        transitTime: 1,
        riskMultiplier: 1.0,
        ...edgeData.data
      },
      ...edgeData
    }));
    
    setEdges(currentEdges => [...currentEdges, ...fullEdges]);
  }, [setEdges]);

  // Handler for updating individual nodes
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes(currentNodes =>
      currentNodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  }, [setNodes]);

  // Handler for updating individual edges  
  const handleUpdateEdge = useCallback((edgeId: string, updates: Partial<Edge>) => {
    setEdges(currentEdges =>
      currentEdges.map(edge =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      )
    );
  }, [setEdges]);

  // ... rest of existing code

  return (
    <SupplyChainContextProvider 
      nodes={nodes} 
      edges={edges} 
      formData={formData}
    >
      {/* Invisible action providers */}
      <SupplyChainActions
        onAddNode={handleAddNode}
        onAddMultipleNodes={handleAddMultipleNodes}
        onAddEdges={handleAddEdges}
        onLoadTemplate={handleLoadTemplate}
        onClearCanvas={handleClearAllNodes}
        nodes={nodes}
        edges={edges}
      />
      
      <AdvancedActions
        nodes={nodes}
        edges={edges}
        onUpdateNode={handleUpdateNode}
        onUpdateEdge={handleUpdateEdge}
      />

      {/* ... existing JSX */}
    </SupplyChainContextProvider>
  );
}
```

## Testing Strategy

### Step 1: Unit Tests

Create `__tests__/ai-assistant/SupplyChainActions.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { SupplyChainActions } from '@/components/digital-twin/ai-assistant/SupplyChainActions';

describe('SupplyChainActions', () => {
  const mockProps = {
    onAddNode: jest.fn(),
    onAddMultipleNodes: jest.fn(),
    onAddEdges: jest.fn(),
    onLoadTemplate: jest.fn(),
    onClearCanvas: jest.fn(),
    nodes: [],
    edges: []
  };

  it('should provide supply chain building actions', () => {
    render(<SupplyChainActions {...mockProps} />);
    // Test that actions are properly registered
  });
});
```

### Step 2: Integration Tests

Create test scenarios for:

1. **Basic Node Creation**: Test adding single nodes via AI commands
2. **Complete Supply Chain Building**: Test building full supply chains from descriptions
3. **Template Loading**: Test loading predefined templates via AI
4. **Context Understanding**: Test that AI understands current canvas state
5. **Form Data Integration**: Test that form data context is properly utilized

### Step 3: E2E Tests

```typescript
// cypress/e2e/ai-assistant.cy.ts
describe('AI Supply Chain Assistant', () => {
  it('should build a supply chain from natural language', () => {
    cy.visit('/digital-twin');
    cy.get('[data-testid="ai-assistant-button"]').click();
    cy.get('[data-testid="chat-input"]').type('Build a simple automotive supply chain with 3 suppliers, 1 manufacturer, and 2 distributors');
    cy.get('[data-testid="send-button"]').click();
    
    // Wait for AI response and verify nodes are created
    cy.get('[data-testid="canvas-node"]').should('have.length.gte', 6);
  });
});
```

## Deployment Considerations

### Environment Variables

Ensure these are set in production:

```env
OPENAI_API_KEY=your_production_openai_key
NODE_ENV=production
```

### Performance Optimization

1. **Lazy Loading**: Load AI components only when needed
2. **Debouncing**: Debounce context updates to prevent excessive API calls
3. **Caching**: Cache AI responses for common queries
4. **Error Handling**: Implement robust error handling for API failures

### Security Considerations

1. **API Key Protection**: Never expose OpenAI API key in frontend
2. **Input Validation**: Validate all AI-generated parameters before execution
3. **Rate Limiting**: Implement rate limiting for AI requests
4. **User Permissions**: Ensure users can only modify their own supply chains

### Monitoring

Implement logging for:

1. AI assistant usage patterns
2. Action execution success/failure rates
3. Performance metrics (response times, token usage)
4. Error rates and types

## Usage Examples

### Example Prompts for Testing

1. **Basic Supply Chain Creation**:
   - "Create a simple supply chain for electronics manufacturing"
   - "I need a food distribution network with suppliers in California and customers on the East Coast"

2. **Industry-Specific Requests**:
   - "Build an automotive supply chain with tier 1, 2, and 3 suppliers"
   - "Create a pharmaceutical supply chain with cold storage requirements"

3. **Optimization Requests**:
   - "Analyze my current supply chain and suggest improvements"
   - "Optimize transportation costs between my warehouses and distributors"

4. **Risk Assessment**:
   - "Identify potential risks in my supply chain"
   - "Add backup suppliers for high-risk nodes"

### Expected AI Behaviors

1. **Context Awareness**: AI should understand current canvas state and form data
2. **Industry Knowledge**: AI should suggest appropriate configurations based on industry
3. **Best Practices**: AI should recommend supply chain best practices
4. **Error Recovery**: AI should handle invalid requests gracefully

## Conclusion

This implementation guide provides a comprehensive framework for integrating an AI-powered Supply Chain Assistant into your digital twin application. The assistant will leverage CopilotKit's powerful capabilities to understand user needs, access current application state, and execute complex supply chain building operations through natural language interaction.

Key benefits of this implementation:

- **Natural Language Interface**: Users can build supply chains through conversational AI
- **Context-Aware Assistance**: AI understands current canvas state and user requirements
- **Automated Building**: Complex supply chain structures can be created automatically
- **Industry Expertise**: AI provides domain-specific knowledge and best practices
- **Seamless Integration**: Works within existing application architecture

The modular design ensures maintainability and allows for easy extension of AI capabilities as requirements evolve. 