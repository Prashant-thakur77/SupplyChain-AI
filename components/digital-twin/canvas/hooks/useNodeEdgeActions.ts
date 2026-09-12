"use client";

import { useCallback } from 'react';
import { addEdge, Node, Edge, Connection, OnNodesChange, OnEdgesChange, ReactFlowInstance } from 'reactflow';
import { toast } from "sonner";

type SetNodes = (payload: Node[] | ((nodes: Node[]) => Node[])) => void;
type SetEdges = (payload: Edge[] | ((edges: Edge[]) => Edge[])) => void;
type SetSelectedElement = (element: Node | Edge | null) => void;

export function useNodeEdgeActions({
  nodes,
  setNodes,
  setEdges,
  setSelectedElement,
  viewOnly = false,
}: {
  nodes: Node[];
  setNodes: SetNodes;
  setEdges: SetEdges;
  setSelectedElement: SetSelectedElement;
  /** When true all mutating handlers become no-ops (read-only mode) */
  viewOnly?: boolean;
}) {

  /**
   * Helper to guard mutating callbacks in view-only mode. If `viewOnly` is
   * enabled the callback becomes a no-op.
   */
  const guard = useCallback(<T extends (...args: any[]) => any>(fn: T): T => {
    // eslint-disable-next-line @typescript-eslint/return-await
    // @ts-ignore – we'll always return a function of the same signature
    return ((...args: Parameters<T>): ReturnType<T> | void => {
      if (viewOnly) {
        // In view-only mode silently ignore the mutation.
        return;
      }
      // @ts-ignore – TypeScript cannot infer spread generics easily
      return fn(...args);
    }) as T;
  }, [viewOnly]);

  const onConnect = useCallback((connection: Connection) => {
    const newEdge = {
      ...connection,
      id: `e${connection.source}-${connection.target}`,
      type: 'transportEdge',
      data: {
        mode: 'road', cost: 100, transitTime: 1, riskMultiplier: 1.0,
        avgDelayDays: 0, frequencyOfDisruptions: 0, hasAltRoute: false, passesThroughChokepoint: false
      }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const onConnectGuarded = guard(onConnect);

  const handleAddNode = useCallback((nodeType: string, label?: string, enhancedData?: any) => {
    const nodeData = enhancedData || {
      label: label || `New ${nodeType}`, description: `Description for ${nodeType}`, type: nodeType,
      capacity: 500, leadTime: 7, riskScore: 0.3, location: { lat: 0, lng: 0 },
      address: `Default address for ${nodeType}`
    };
    const newNode = {
      id: `${nodeType.toLowerCase()}-${nodes.length + 1}`,
      type: `${nodeType.toLowerCase()}Node`,
      data: { ...nodeData, type: nodeType },
      position: { x: 300 + Math.random() * 100, y: 300 + Math.random() * 100 },
    };
    setNodes(nds => [...nds, newNode]);
    setSelectedElement(newNode);
  }, [nodes, setNodes, setSelectedElement]);

  const handleAddNodeGuarded = guard(handleAddNode);

  const handleUpdateNode = useCallback((nodeId: string, properties: object) => {
    let updatedNode: Node | null = null;
    setNodes(currentNodes =>
      currentNodes.map(node => {
        if (node.id === nodeId) {
          updatedNode = { ...node, data: { ...node.data, ...properties } };
          return updatedNode;
        }
        return node;
      }),
    );
    if (updatedNode) {
      setSelectedElement(null);
      setTimeout(() => setSelectedElement(updatedNode), 50);
    }
    // @ts-ignore
    // toast.success(`Node ${updatedNode?.data?.label || nodeId} updated.`);
  }, [setNodes, setSelectedElement]);

  const handleUpdateNodeGuarded = guard(handleUpdateNode);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(currentNodes => {
      const nodeToDelete = currentNodes.find(node => node.id === nodeId);
      if (nodeToDelete && nodeToDelete.type === 'group' && nodeToDelete.data?.isTemplate) {
        const childNodes = currentNodes.filter(node => node.parentId === nodeId);
        const remainingNodes = currentNodes.filter(node => node.id !== nodeId && node.parentId !== nodeId);
        setEdges(currentEdges => currentEdges.filter(edge => !childNodes.some(child => edge.source === child.id || edge.target === child.id)));
        // toast.success(`Deleted template group`);
        return remainingNodes;
      } else {
        setEdges(currentEdges => currentEdges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
        return currentNodes.filter(node => node.id !== nodeId);
      }
    });
    setSelectedElement(null);
  }, [setNodes, setEdges, setSelectedElement]);

  const handleDeleteNodeGuarded = guard(handleDeleteNode);
  
  const handleAddMultipleNodes = useCallback((newNodes: Partial<Node>[]) => {
    const fullyFormedNodes = newNodes.map((n, i) => ({
      id: `${Date.now()}-${i}`,
      data: { label: `New Node ${i + 1}`, ...n.data },
      position: n.position || { x: Math.random() * 400, y: Math.random() * 400 },
      type: n.type || 'supplierNode',
      ...n
    }));
    setNodes(nds => nds.concat(fullyFormedNodes));
    // toast.success(`${newNodes.length} nodes added.`);
  }, [setNodes]);

  const handleAddMultipleNodesGuarded = guard(handleAddMultipleNodes);

  const handleUpdateEdge = useCallback((edgeId: string, properties: object) => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        if (edge.id === edgeId) {
          return { ...edge, data: { ...edge.data, ...properties } };
        }
        return edge;
      })
    );
    // toast.success(`Edge ${edgeId} updated.`);
  }, [setEdges]);

  const handleUpdateEdgeGuarded = guard(handleUpdateEdge);

  const handleAddMultipleEdges = useCallback((newEdges: Partial<Edge>[]) => {
    const fullyFormedEdges = newEdges.map((e, i) => ({
      id: `e-${Date.now()}-${i}`,
      type: 'transportEdge',
      ...e,
    }));
    // @ts-ignore
    setEdges(eds => eds.concat(fullyFormedEdges));
    // toast.success(`${newEdges.length} edges added.`);
  }, [setEdges]);

  const handleAddMultipleEdgesGuarded = guard(handleAddMultipleEdges);

  const handleAddEdges = useCallback((newEdges: Edge[]) => {
    setEdges((eds) => eds.concat(newEdges));
    //  toast.success(`${newEdges.length} edges added.`);
  }, [setEdges]);

  const handleAddEdgesGuarded = guard(handleAddEdges);

  const handleUpdateMultipleNodes = useCallback((nodeIds: string[], properties: object) => {
    console.log("handleUpdateMultipleNodes", nodeIds, properties);
    setNodes(nds =>
      nds.map(n =>
        nodeIds.includes(n.id) ? { ...n, data: { ...n.data, ...properties } } : n
      )
    );
    // toast.success(`Updated ${nodeIds.length} nodes.`);
  }, [setNodes]);

  const handleUpdateMultipleNodesGuarded = guard(handleUpdateMultipleNodes);

  // Add new function to update node positions and data
  const handleUpdateNodePositions = useCallback((updatedNodes: Node[]) => {
    console.log("handleUpdateNodePositions", updatedNodes.length, "nodes");
    setNodes(currentNodes => {
      const updatedMap = new Map(updatedNodes.map(n => [n.id, n]));
      return currentNodes.map(node => {
        const updated = updatedMap.get(node.id);
        return updated || node;
      });
    });
  }, [setNodes]);

  const handleUpdateNodePositionsGuarded = guard(handleUpdateNodePositions);

  const handleClearAllNodes = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedElement(null);
  }, [setNodes, setEdges, setSelectedElement]);

  const handleClearAllNodesGuarded = guard(handleClearAllNodes);

  const handleAddNodeAtPosition = useCallback((nodeType: string, position: { x: number; y: number }, label?: string, enhancedData?: any) => {
    const nodeData = enhancedData || {
      label: label || `New ${nodeType}`, 
      description: `Description for ${nodeType}`, 
      type: nodeType,
      capacity: 500, 
      leadTime: 7, 
      riskScore: 0.3, 
      location: { lat: 0, lng: 0 },
      address: `Default address for ${nodeType}`
    };
    const newNode = {
      id: `${nodeType.toLowerCase()}-${nodes.length + 1}`,
      type: `${nodeType.toLowerCase()}Node`,
      data: { ...nodeData, type: nodeType },
      position,
    };
    setNodes(nds => [...nds, newNode]);
    setSelectedElement(newNode);
  }, [nodes, setNodes, setSelectedElement]);

  const handleAddNodeAtPositionGuarded = guard(handleAddNodeAtPosition);

  return {
    onConnect: onConnectGuarded,
    handleAddNode: handleAddNodeGuarded,
    handleAddNodeAtPosition: handleAddNodeAtPositionGuarded,
    handleUpdateNode: handleUpdateNodeGuarded,
    handleDeleteNode: handleDeleteNodeGuarded,
    handleAddMultipleNodes: handleAddMultipleNodesGuarded,
    handleUpdateEdge: handleUpdateEdgeGuarded,
    handleAddEdges: handleAddEdgesGuarded,
    handleAddMultipleEdges: handleAddMultipleEdgesGuarded,
    handleUpdateMultipleNodes: handleUpdateMultipleNodesGuarded,
    handleUpdateNodePositions: handleUpdateNodePositionsGuarded,
    handleClearAllNodes: handleClearAllNodesGuarded,
    // Expose setNodes for direct layout algorithm usage (readonly safe)
    setNodes,
  };
} 