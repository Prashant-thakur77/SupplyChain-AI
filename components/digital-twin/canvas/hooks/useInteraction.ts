"use client";

import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, OnSelectionChangeParams } from 'reactflow';

type SetSelectedElement = (element: Node | Edge | null) => void;

export function useInteraction(
  handleUngroupTemplate: (id: string) => void
) {
  const [selectedElement, setSelectedElement] = useState<Node | Edge | null>(null);

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    const { nodes: selectedNodes, edges: selectedEdges } = params;
    if (selectedNodes.length > 0) {
      setSelectedElement(selectedNodes[0]);
    } else if (selectedEdges.length > 0) {
      setSelectedElement(selectedEdges[0]);
    } else {
      setSelectedElement(null);
    }
  }, []);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'group' && node.data.isTemplate) {
      handleUngroupTemplate(node.id);
    }
  }, [handleUngroupTemplate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'u' || event.key === 'U') {
        if (selectedElement && 'type' in selectedElement && selectedElement.type === 'group' && selectedElement.data.isTemplate) {
          event.preventDefault();
          handleUngroupTemplate(selectedElement.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, handleUngroupTemplate]);

  return {
    selectedElement,
    setSelectedElement,
    onSelectionChange,
    onNodeDoubleClick,
  };
} 