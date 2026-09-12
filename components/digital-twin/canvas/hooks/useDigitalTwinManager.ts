"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Node, Edge, ReactFlowInstance } from 'reactflow';
import { useQueryState } from 'nuqs';

import { useDigitalTwinState } from './useDigitalTwinState';
import { useInteraction } from './useInteraction';
import { useNodeEdgeActions } from './useNodeEdgeActions';
import { useTemplateManager } from './useTemplateManager';
import { useSaveAndValidate } from './useSaveAndValidate';
import { useCanvasView } from './useCanvasView';
import { ValidationIssue } from '@/lib/validation/supply-chain-validator';
import { generateAIFixPrompt } from '../../forms/ValidationDialog';

export interface DigitalTwinManagerProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  /**
   * When true the canvas operates in read-only mode (no mutations, no save UI).
   */
  viewOnly?: boolean;
}

export function useDigitalTwinManager({
  initialNodes = [],
  initialEdges = [],
  viewOnly = false,
}: DigitalTwinManagerProps) {
  
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    onNodesChange,
    onEdgesChange,
    isHydrated,
  } = useDigitalTwinState(initialNodes, initialEdges);

  const [twinIdParam] = useQueryState('twinId');
  const [selectedSupplyChain, setSelectedSupplyChain] = useState(twinIdParam || "default-chain");
  const [supplyChainName, setSupplyChainName] = useState("Default Supply Chain");
  const [description, setDescription] = useState("");

  // Keep selectedSupplyChain in sync with URL if it changes
  useEffect(() => {
    if (twinIdParam && twinIdParam !== selectedSupplyChain) {
      setSelectedSupplyChain(twinIdParam);
    }
  }, [twinIdParam]);

  const [simulationMode, setSimulationMode] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Chat mode state for AI integration
  const [chatMode, setChatMode] = useQueryState('chat');
  const [pendingAIMessage, setPendingAIMessage] = useState<string | null>(null);

  const {
    handleSave,
    performSave,
    isSaving,
    validationIssues,
    showValidationDialog,
    setShowValidationDialog,
    handleValidateSupplyChain,
  } = useSaveAndValidate({
    nodes,
    edges,
    supplyChainName,
    description,
    selectedSupplyChain,
  });

  const { handleUngroupTemplate, handleLoadTemplate, handleLoadTemplateAtPosition } = useTemplateManager({
      nodes,
      setNodes,
      setEdges,
      setSelectedElement: () => {}, // temp
      reactFlowInstance,
  });

  const {
    selectedElement,
    setSelectedElement,
    onSelectionChange,
    onNodeDoubleClick,
  } = useInteraction(handleUngroupTemplate);

  const nodeEdgeActions = useNodeEdgeActions({
    nodes,
    setNodes,
    setEdges,
    setSelectedElement,
    viewOnly,
  });

  const canvasViewActions = useCanvasView({
    nodes,
    edges,
    setNodes,
    setEdges,
    setSelectedElement,
    setShowValidationDialog,
    reactFlowInstance,
  });

  const onUpdate = useCallback((updatedElement: any) => {
    if ('source' in updatedElement) {
      setEdges(eds => eds.map(edge => edge.id === updatedElement.id ? updatedElement : edge));
    } else {
      setNodes(nds => nds.map(node => node.id === updatedElement.id ? updatedElement : node));
    }
    setSelectedElement(updatedElement);
  }, [setEdges, setNodes, setSelectedElement]);

  const finalTemplateManager = useTemplateManager({
      nodes,
      setNodes,
      setEdges,
      setSelectedElement,
      reactFlowInstance,
  });

  // Handle AI fix requests from ValidationDialog
  const handleAIFixRequest = useCallback((issue: ValidationIssue) => {
    const aiPrompt = generateAIFixPrompt(issue);
    
    // Switch to immersive chat mode
    setChatMode('immersive');
    setIsLeftPanelCollapsed(false);
    
    // Store the message to be sent to AI
    setPendingAIMessage(aiPrompt);
    
    // Close validation dialog
    setShowValidationDialog(false);
  }, [setChatMode, setShowValidationDialog]);

  // Handle AI analysis request from Right Panel
  const handleAnalyzeNode = useCallback((nodeId: string, nodeLabel: string) => {
    const aiPrompt = `Analyze the node "${nodeLabel}" (ID: ${nodeId}). What role does it play in this supply chain, what is its current health/risk status, and are there any critical dependencies or vulnerabilities I should be aware of?`;
    
    // Switch to immersive chat mode
    setChatMode('immersive');
    setIsLeftPanelCollapsed(false);
    
    // Store the message to be sent to AI
    setPendingAIMessage(aiPrompt);
  }, [setChatMode]);

  return {
    nodes,
    edges,
    handleNodesChange: onNodesChange,
    onEdgesChange,
    onConnect: nodeEdgeActions.onConnect,
    onSelectionChange,
    reactFlowInstance,
    onNodeDoubleClick,
    selectedElement,
    setSelectedElement,
    handleDeleteNode: nodeEdgeActions.handleDeleteNode,
    handleUngroupTemplate: finalTemplateManager.handleUngroupTemplate,
    handleSave,
    performSave,
    isSaving,
    validationIssues,
    showValidationDialog,
    setShowValidationDialog,
    handleFocusElement: canvasViewActions.handleFocusElement,
    isHydrated,
    simulationToolbarProps: {
      selectedSupplyChain,
      setSelectedSupplyChain,
      onSave: handleSave,
      simulationMode,
      setSimulationMode,
      supplyChainName,
      setSupplyChainName,
      description,
      setDescription,
      nodes,
      edges,
      viewOnly,
    },
    leftPanelProps: {
      supplyChainName,
      selectedSupplyChain,
      setSelectedSupplyChain,
      onAddNode: nodeEdgeActions.handleAddNode,
      onAddNodeAtPosition: nodeEdgeActions.handleAddNodeAtPosition,
      onClearAllNodes: nodeEdgeActions.handleClearAllNodes,
      onLoadTemplate: finalTemplateManager.handleLoadTemplate,
      onLoadTemplateAtPosition: finalTemplateManager.handleLoadTemplateAtPosition,
      simulationMode,
      isCollapsed: isLeftPanelCollapsed,
      setIsCollapsed: setIsLeftPanelCollapsed,
      nodes,
      edges,
      onAddMultipleNodes: nodeEdgeActions.handleAddMultipleNodes,
      onAddMultipleEdges: nodeEdgeActions.handleAddMultipleEdges,
      onAddEdges: nodeEdgeActions.handleAddEdges,
      onUpdateNode: nodeEdgeActions.handleUpdateNode,
      onDeleteNode: nodeEdgeActions.handleDeleteNode,
      onUpdateMultipleNodes: nodeEdgeActions.handleUpdateMultipleNodes,
      onUpdateNodePositions: canvasViewActions.handleUpdateNodePositions,
      onUpdateEdge: nodeEdgeActions.handleUpdateEdge,
      onValidateSupplyChain: handleValidateSupplyChain,
      onFindAndSelectNode: canvasViewActions.handleFindAndSelectNode,
      onFindAndSelectEdges: canvasViewActions.handleFindAndSelectEdges,
      onHighlightNodes: canvasViewActions.handleHighlightNodes,
      onFocusNode: canvasViewActions.handleFocusNode,
      onZoomToNodes: canvasViewActions.handleZoomToNodes,
      onGetNodeConnections: canvasViewActions.handleGetNodeConnections,
      onAnalyzeNetworkPaths: canvasViewActions.handleAnalyzeNetworkPaths,
      onBulkUpdateEdges: canvasViewActions.handleBulkUpdateEdges,
      onCreateNodeGroup: canvasViewActions.handleCreateNodeGroup,
      onExportSubgraph: canvasViewActions.handleExportSubgraph,
      pendingAIMessage,
      setPendingAIMessage,
    },
    rightPanelProps: {
      selectedElement,
      nodes,
      onUpdate,
      onDelete: nodeEdgeActions.handleDeleteNode,
      onUngroup: finalTemplateManager.handleUngroupTemplate,
      onSave: async () => { await handleSave(undefined, undefined, true); },
      onAnalyzeNode: handleAnalyzeNode,
    },
    // Add AI fix handler for ValidationDialog
    handleAIFixRequest,
  };
} 