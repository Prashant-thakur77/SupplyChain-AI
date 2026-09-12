"use client";
import React from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

import SimulationToolbar from '../layout/digital-twin-toolbar';
import { LeftPanel } from '../layout/left-panel';
import RightPanel from '../layout/RightPanel';
import ValidationDialog from '../forms/ValidationDialog';
import { nodeTypes } from "./CustomNodes";
import { edgeTypes } from "./CustomEdges";
import { useDigitalTwinManager, DigitalTwinManagerProps } from './hooks/useDigitalTwinManager';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';
import NodeContextMenu from './NodeContextMenu';
import ControlTowerPanel from '../layout/ControlTowerPanel';
import ManualDisruptionDialog from './ManualDisruptionDialog';
import { useCopilotAction } from '@copilotkit/react-core';
import { useDisruptionSimulation } from './hooks/useDisruptionSimulation';

// Add nodes and edges to the props for SimulationToolbar
interface CustomSimulationToolbarProps extends Omit<React.ComponentProps<typeof SimulationToolbar>, 'nodes' | 'edges'> {
  nodes: Node[];
  edges: Edge[];
}

export default function DigitalTwinCanvas({ initialNodes, initialEdges, viewOnly = false }: DigitalTwinManagerProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{ id: string; top: number; left: number } | null>(null);
  const [disruptionModalNodeId, setDisruptionModalNodeId] = React.useState<string | null>(null);
  const { isControlTowerMode, setControlTowerMode, disruptedNodes } = useDigitalTwinStore();
  const { simulateDisruption, clearDisruptions } = useDisruptionSimulation();

  useCopilotAction({
    name: "simulateDisruption",
    description: "Simulate a disruption at a specific supply chain node to visualize cascading downstream impacts in Control Tower Mode. Use this when the user asks to block, disrupt, or simulate an issue at a node.",
    parameters: [
      {
        name: "nodeId",
        type: "string",
        description: "The ID of the node to simulate a disruption at.",
        required: true,
      }
    ],
    handler: async ({ nodeId }) => {
      setControlTowerMode(true);
      simulateDisruption(nodeId);
      return "Disruption simulation triggered successfully on the Digital Twin canvas.";
    },
  });

  useCopilotAction({
    name: "clearDisruptions",
    description: "Clear all active disruptions and alternate routes from the Digital Twin canvas.",
    handler: async () => {
      clearDisruptions();
      return "All disruptions have been cleared from the canvas.";
    },
  });
  
  // Close context menu on any click or drag
  const closeContextMenu = React.useCallback(() => setContextMenu(null), []);
  
  const {
    nodes,
    edges,
    handleNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    reactFlowInstance,
    onNodeDoubleClick,
    isHydrated,
    validationIssues,
    showValidationDialog,
    setShowValidationDialog,
    handleFocusElement,
    performSave,
    isSaving,
    simulationToolbarProps,
    leftPanelProps,
    rightPanelProps,
    handleAIFixRequest,
    selectedElement,
    handleDeleteNode
  } = useDigitalTwinManager({ initialNodes, initialEdges, viewOnly });

  // Add keyboard event listener for Delete key and Ctrl+S
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip all keyboard mutations in viewOnly mode or Control Tower mode
      if (viewOnly || isControlTowerMode) {
        return;
      }
      // Check if we're typing in an input field, textarea, or contenteditable element
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.contentEditable === 'true';

      // Handle Ctrl+S for save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // Prevent browser's default save
        
        // Don't trigger save if we're in simulation mode
        if (simulationToolbarProps.simulationMode) {
          return;
        }
        
        // Trigger the save function
        simulationToolbarProps.onSave();
        return;
      }

      // Only process other shortcuts if we're not typing
      if (isTyping) {
        return;
      }

      // Check if Delete or Backspace key is pressed
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement) {
        // Prevent deletion in simulation mode
        if (simulationToolbarProps.simulationMode) {
          return;
        }
        
        // Only delete nodes (not edges through keyboard for safety)
        if ('position' in selectedElement && selectedElement.type !== 'group') {
          event.preventDefault();
          handleDeleteNode(selectedElement.id);
        }
      }
    };

    // Add event listener to window for global keyboard handling
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, handleDeleteNode, simulationToolbarProps.simulationMode, simulationToolbarProps.onSave, viewOnly, isControlTowerMode]);

  const onDragOver = (event: React.DragEvent) => {
    if (viewOnly || isControlTowerMode) return; // disable drag interactions
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    if (viewOnly || isControlTowerMode) return;
    // Only set to false if we're actually leaving the drop zone
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const onDrop = (event: React.DragEvent) => {
    if (viewOnly || isControlTowerMode) return; // disable drop
    event.preventDefault();
    setIsDragOver(false);

    const nodeType = event.dataTransfer.getData('application/reactflow');
    const templateId = event.dataTransfer.getData('application/reactflow-template');

    // Get the position where the element was dropped
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };
    
    // check if node type is valid
    if (typeof nodeType !== 'undefined' && nodeType) {
      // Convert screen position to flow position
      if (reactFlowInstance.current) {
        const flowPosition = reactFlowInstance.current.project(position);
        leftPanelProps.onAddNodeAtPosition?.(nodeType, flowPosition, `New ${nodeType}`);
      } else {
        // Fallback if reactFlowInstance is not available
        leftPanelProps.onAddNodeAtPosition?.(nodeType, position, `New ${nodeType}`);
      }
      return;
    }

    if (typeof templateId !== 'undefined' && templateId) {
      if (reactFlowInstance.current) {
        const flowPosition = reactFlowInstance.current.project(position);
        leftPanelProps.onLoadTemplateAtPosition?.(templateId, flowPosition);
      } else {
        leftPanelProps.onLoadTemplateAtPosition?.(templateId, position);
      }
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-full flex-1">
        <div className="text-gray-500">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Only show SimulationToolbar in edit mode */}
      {!viewOnly && <SimulationToolbar {...simulationToolbarProps} />}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Only show LeftPanel in edit mode */}
        {!viewOnly && !isControlTowerMode && <LeftPanel {...leftPanelProps} />}
        
        <ControlTowerPanel />

        <div 
          className={`flex-1 h-full ${viewOnly ? '' : 'border-l'} transition-all duration-200 relative ${
            isDragOver 
              ? 'border-theme-blue bg-theme-bg-secondary/80' 
              : viewOnly ? '' : 'border-theme-border-subtle bg-theme-bg-secondary'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Canvas overlay (top-left): pill badges showing node count + edge count + risk count */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border border-theme-border-subtle bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm text-theme-text-primary shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A7F4B]" />
              <span>{nodes.filter(n => n.type !== 'group').length} nodes</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border border-theme-border-subtle bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm text-theme-text-primary shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2748E8]" />
              <span>{edges.length} edges</span>
            </div>
            {(() => {
              const riskCount = nodes.filter(n => {
                if (n.type === 'group') return false;
                const isDisrupted = disruptedNodes.includes(n.id);
                const isHighRisk = n.data?.riskScore >= 0.7 || 
                                   n.data?.riskLevel === 'High' || 
                                   n.data?.riskLevel === 'HIGH' || 
                                   (n.type === 'retailerNode' && isDisrupted);
                return isHighRisk || isDisrupted;
              }).length;
              
              return (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-sm shadow-sm transition-colors duration-200 ${
                  riskCount > 0 
                    ? 'border-[#B91C1C] bg-[#FEF2F2]/95 dark:bg-[#2A1515]/95 text-[#B91C1C]'
                    : 'border-theme-border-subtle bg-white/95 dark:bg-zinc-900/95 text-theme-text-primary'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${riskCount > 0 ? 'bg-[#B91C1C] animate-pulse' : 'bg-zinc-400'}`} />
                  <span>{riskCount} at risk</span>
                </div>
              );
            })()}
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            .react-flow__controls {
              box-shadow: none !important;
              display: flex !important;
              flex-direction: column !important;
              gap: 4px !important;
              left: 16px !important;
              bottom: 16px !important;
            }
            .react-flow__controls-button {
              background: white !important;
              color: #18160F !important;
              border: 1px solid #E5DFD6 !important;
              border-radius: 6px !important;
              width: 32px !important;
              height: 32px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
            }
            .dark .react-flow__controls-button {
              background: #1E1D1B !important;
              color: #F0EDE7 !important;
              border-color: #353330 !important;
            }
            .react-flow__controls-button:hover {
              background: #FAFAF7 !important;
            }
            .dark .react-flow__controls-button:hover {
              background: #2A2825 !important;
            }
          `}} />

          {isDragOver && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-4 border-2 border-dashed border-theme-blue rounded-theme-lg bg-theme-bg-secondary/90 flex items-center justify-center">
                <div className="text-theme-blue text-sm font-semibold bg-theme-bg-surface px-4 py-2 rounded-theme-md shadow-sm border border-theme-border-subtle">
                  Drop here to add node
                </div>
              </div>
            </div>
          )}
          
          {contextMenu && (
            <NodeContextMenu
              id={contextMenu.id}
              top={contextMenu.top}
              left={contextMenu.left}
              onClose={closeContextMenu}
              onSimulateClick={() => {
                setDisruptionModalNodeId(contextMenu.id);
                closeContextMenu();
              }}
            />
          )}

          <ManualDisruptionDialog 
            isOpen={!!disruptionModalNodeId} 
            onClose={() => setDisruptionModalNodeId(null)} 
            nodeId={disruptionModalNodeId} 
          />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onInit={(instance) => {
              if(reactFlowInstance) {
                reactFlowInstance.current = instance;
              }
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            preventScrolling={false}
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick={false}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeContextMenu={(event, node) => {
              // Prevent native context menu
              event.preventDefault();
              if (isControlTowerMode) {
                // Calculate position relative to the container
                const pane = (event.currentTarget as Element).getBoundingClientRect();
                setContextMenu({
                  id: node.id,
                  top: event.clientY - pane.top,
                  left: event.clientX - pane.left,
                });
              }
            }}
            onPaneClick={closeContextMenu}
            onMove={closeContextMenu}
            deleteKeyCode={null} // Disable default delete handling, we'll handle it ourselves
            nodesDraggable={!viewOnly && !isControlTowerMode}
            nodesConnectable={!viewOnly && !isControlTowerMode}
          >
            <Controls showInteractive={false} className="bg-theme-bg-surface border-theme-border-subtle text-theme-text-primary" />
            <MiniMap className="bg-theme-bg-surface border-theme-border-subtle" nodeColor="var(--accent-blue)" maskColor="var(--bg-glass)" />
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--border-default)" className="bg-theme-bg-primary" />
          </ReactFlow>
        </div>

        {/* Only show RightPanel in edit mode */}
        {!viewOnly && <RightPanel {...rightPanelProps} />}
      </div>

      <ValidationDialog
        isOpen={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        issues={validationIssues}
        onFocusElement={handleFocusElement}
        onSaveWithWarnings={performSave}
        onFixWithAI={handleAIFixRequest}
        isLoading={isSaving}
      />
    </div>
  );
}
