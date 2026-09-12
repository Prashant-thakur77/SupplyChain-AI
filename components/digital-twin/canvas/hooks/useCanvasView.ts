"use client";

import { useCallback } from 'react';
import { Node, Edge, ReactFlowInstance } from 'reactflow';
import { toast } from 'sonner';

type SetNodes = (payload: Node[] | ((nodes: Node[]) => Node[])) => void;
type SetEdges = (payload: Edge[] | ((edges: Edge[]) => Edge[])) => void;
type SetSelectedElement = (element: Node | Edge | null) => void;
type SetShowValidationDialog = (show: boolean) => void;

export function useCanvasView({
  nodes,
  edges,
  setNodes,
  setEdges,
  setSelectedElement,
  setShowValidationDialog,
  reactFlowInstance,
}: {
  nodes: Node[];
  edges: Edge[];
  setNodes: SetNodes;
  setEdges: SetEdges;
  setSelectedElement: SetSelectedElement;
  setShowValidationDialog: SetShowValidationDialog;
  reactFlowInstance: React.MutableRefObject<ReactFlowInstance | null>;
}) {

  const handleFocusElement = useCallback((elementId: string, elementType: 'node' | 'edge') => {
    if (elementType === 'node') {
      const node = nodes.find(n => n.id === elementId);
      if (node && reactFlowInstance.current) {
        setSelectedElement(null);
        reactFlowInstance.current.setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.5 });
        setTimeout(() => setSelectedElement(node), 300);
      }
    } else if (elementType === 'edge') {
      const edge = edges.find(e => e.id === elementId);
      if (edge && reactFlowInstance.current) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (sourceNode && targetNode) {
          setSelectedElement(null);
          const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
          const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
          reactFlowInstance.current.setCenter(centerX, centerY, { zoom: 1.5 });
          setTimeout(() => setSelectedElement(edge), 300);
        }
      }
    }
    setShowValidationDialog(false);
  }, [nodes, edges, setSelectedElement, setShowValidationDialog, reactFlowInstance]);

  const handleUpdateNodePositions = useCallback((nodePositions: { [nodeId: string]: { x: number; y: number } }) => {
    let updatedCount = 0;
    setNodes(nds => {
      const updatedNodes = nds.map(n => {
        if (nodePositions[n.id]) {
          updatedCount++;
          return { ...n, position: nodePositions[n.id] };
        }
        return n;
      });
      return updatedNodes;
    });
    toast.success(`Updated positions for ${updatedCount} nodes.`);
  }, [setNodes]);

  const handleFindAndSelectNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      reactFlowInstance.current?.fitView({ nodes: [{ id: nodeId }], duration: 200 });
      setSelectedElement(node);
      toast.success(`Found and selected node ${node.data.label || nodeId}`);
    } else {
      toast.error(`Node with ID ${nodeId} not found.`);
    }
  }, [nodes, reactFlowInstance, setSelectedElement]);

  const handleFindAndSelectEdges = useCallback((edgeIds: string[]) => {
      toast.info(`Attempting to select ${edgeIds.length} edges.`);
      // Actual selection logic would go here, likely involving updating the 'selected' property of edges
  }, []);

  const handleHighlightNodes = useCallback((nodeIds: string[]) => {
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          style: nodeIds.includes(n.id) ? { ...n.style, boxShadow: '0 0 15px #ff0072' } : n.style,
        }))
      );
      toast.success(`Highlighted ${nodeIds.length} nodes.`);
  }, [setNodes]);

  const handleFocusNode = useCallback((nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node && reactFlowInstance.current) {
          reactFlowInstance.current.setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 500 });
          toast.success(`Focused on node ${node.data.label || nodeId}`);
      } else {
          toast.error(`Node with ID ${nodeId} not found.`);
      }
  }, [nodes, reactFlowInstance]);

  const handleZoomToNodes = useCallback((nodeIds: string[]) => {
      const nodesToFit = nodes.filter(n => nodeIds.includes(n.id));
      if (nodesToFit.length > 0 && reactFlowInstance.current) {
          reactFlowInstance.current.fitView({ nodes: nodesToFit, padding: 0.2, duration: 500 });
          toast.success(`Zoomed to ${nodesToFit.length} nodes.`);
      } else {
          toast.info(`No nodes found for IDs: ${nodeIds.join(', ')}`);
      }
  }, [nodes, reactFlowInstance]);

  const handleGetNodeConnections = useCallback((nodeId: string) => {
      return edges.filter(e => e.source === nodeId || e.target === nodeId);
  }, [edges]);

  const handleAnalyzeNetworkPaths = useCallback((sourceId: string, targetId: string) => {
      toast.info(`Path analysis from ${sourceId} to ${targetId} is not yet implemented.`);
  }, []);

  const handleBulkUpdateEdges = useCallback((edgeIds: string[], properties: object) => {
      setEdges(eds =>
        eds.map(e =>
          edgeIds.includes(e.id) ? { ...e, data: { ...e.data, ...properties } } : e
        )
      );
      toast.success(`Bulk updated ${edgeIds.length} edges.`);
  }, [setEdges]);

  const handleCreateNodeGroup = useCallback((nodeIds: string[], groupName: string) => {
      toast.info(`Node grouping is not yet implemented.`);
  }, []);

  const handleExportSubgraph = useCallback((nodeIds: string[]) => {
      const subgraphNodes = nodes.filter(n => nodeIds.includes(n.id));
      const subgraphEdges = edges.filter(e => nodeIds.includes(e.source) && nodeIds.includes(e.target));
      const subgraph = { nodes: subgraphNodes, edges: subgraphEdges };
      navigator.clipboard.writeText(JSON.stringify(subgraph, null, 2));
      toast.success("Subgraph copied to clipboard.");
  }, [nodes, edges]);

  return {
    handleFocusElement,
    handleUpdateNodePositions,
    handleFindAndSelectNode,
    handleFindAndSelectEdges,
    handleHighlightNodes,
    handleFocusNode,
    handleZoomToNodes,
    handleGetNodeConnections,
    handleAnalyzeNetworkPaths,
    handleBulkUpdateEdges,
    handleCreateNodeGroup,
    handleExportSubgraph,
  };
} 