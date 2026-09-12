"use client";

import { useCallback } from 'react';
import { Node, Edge, ReactFlowInstance } from 'reactflow';
import { toast } from "sonner";
import { SUPPLY_CHAIN_TEMPLATES } from '@/constants/digital-twin';
import { migrateEdges } from '../lib/utils';

type SetNodes = (payload: Node[] | ((nodes: Node[]) => Node[])) => void;
type SetEdges = (payload: Edge[] | ((edges: Edge[]) => Edge[])) => void;
type SetSelectedElement = (element: Node | Edge | null) => void;

export function useTemplateManager({
  nodes,
  setNodes,
  setEdges,
  setSelectedElement,
  reactFlowInstance,
}: {
  nodes: Node[];
  setNodes: SetNodes;
  setEdges: SetEdges;
  setSelectedElement: SetSelectedElement;
  reactFlowInstance: React.MutableRefObject<ReactFlowInstance | null>;
}) {

  const handleUngroupTemplate = useCallback((groupId: string) => {
    setNodes(currentNodes => {
      const groupNode = currentNodes.find(node => node.id === groupId);
      if (!groupNode || groupNode.type !== 'group') return currentNodes;
      const childNodes = currentNodes.filter(node => node.parentId === groupId);
      const otherNodes = currentNodes.filter(node => node.id !== groupId && node.parentId !== groupId);
      const ungroupedChildNodes = childNodes.map(node => ({
        ...node,
        parentId: undefined,
        extent: undefined,
        position: {
          x: groupNode.position.x + node.position.x,
          y: groupNode.position.y + node.position.y
        }
      }));
      toast.success(`Ungrouped ${groupNode.data.label} template`);
      return [...otherNodes, ...ungroupedChildNodes];
    });
  }, [setNodes]);

  const handleLoadTemplate = useCallback((templateId: string) => {
    const template = SUPPLY_CHAIN_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      toast.error('Template not found');
      return;
    }
    const templateNodes = JSON.parse(JSON.stringify(template.nodes_data));
    const templateEdges = JSON.parse(JSON.stringify(template.edges_data));
    const timestamp = Date.now();
    const nodeIdMap = new Map();
    let maxX = 0;
    let maxY = 0;
    if (nodes.length > 0) {
      maxX = Math.max(...nodes.map(node => node.position.x + 200));
      maxY = Math.max(...nodes.map(node => node.position.y));
    }
    const templateBounds = templateNodes.reduce((bounds: any, node: Node) => ({
      minX: Math.min(bounds.minX, node.position.x),
      minY: Math.min(bounds.minY, node.position.y),
      maxX: Math.max(bounds.maxX, node.position.x + 200),
      maxY: Math.max(bounds.maxY, node.position.y + 100)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    const groupId = `template-group-${timestamp}`;
    const groupWidth = templateBounds.maxX - templateBounds.minX + 40;
    const groupHeight = templateBounds.maxY - templateBounds.minY + 80;
    const groupNode = {
      id: groupId, type: 'group',
      data: { label: template.name, description: template.description, templateId: template.id, isTemplate: true },
      position: { x: maxX + 100, y: maxY > 0 ? maxY + 50 : 50 },
      style: { width: groupWidth, height: groupHeight, backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '2px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '20px' },
      className: 'template-group'
    };
    const updatedTemplateNodes = templateNodes.map((node: Node, index: number) => {
      const originalId = node.id;
      const newId = `${node.id}-${timestamp}-${index}`;
      nodeIdMap.set(originalId, newId);
      return { ...node, id: newId, parentId: groupId, position: { x: node.position.x - templateBounds.minX + 20, y: node.position.y - templateBounds.minY + 40 }, extent: 'parent' as const, expandParent: true };
    });
    const updatedTemplateEdges = templateEdges.map((edge: Edge, index: number) => {
      const newSourceId = nodeIdMap.get(edge.source) || edge.source;
      const newTargetId = nodeIdMap.get(edge.target) || edge.target;
      return { ...edge, id: `${edge.id}-${timestamp}-${index}`, source: newSourceId, target: newTargetId };
    });
    const migrated = migrateEdges(updatedTemplateEdges);
    setNodes(currentNodes => [...currentNodes, groupNode, ...updatedTemplateNodes]);
    setEdges(currentEdges => [...currentEdges, ...migrated]);
    setTimeout(() => {
      if (reactFlowInstance.current) {
        const centerX = groupNode.position.x + groupWidth / 2;
        const centerY = groupNode.position.y + groupHeight / 2;
        reactFlowInstance.current.setCenter(centerX, centerY, { zoom: 0.8, duration: 800 });
        setTimeout(() => {
          setSelectedElement(groupNode);
          setTimeout(() => setSelectedElement(null), 1500);
        }, 400);
      }
    }, 100);
    toast.success(`Added ${template.name} template`);
  }, [nodes, setNodes, setEdges, reactFlowInstance, setSelectedElement]);

  const handleLoadTemplateAtPosition = useCallback((templateId: string, position: { x: number, y: number }) => {
    const template = SUPPLY_CHAIN_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      toast.error('Template not found');
      return;
    }
    const templateNodes = JSON.parse(JSON.stringify(template.nodes_data));
    const templateEdges = JSON.parse(JSON.stringify(template.edges_data));
    const timestamp = Date.now();
    const nodeIdMap = new Map();

    const templateBounds = templateNodes.reduce((bounds: any, node: Node) => ({
      minX: Math.min(bounds.minX, node.position.x),
      minY: Math.min(bounds.minY, node.position.y),
      maxX: Math.max(bounds.maxX, node.position.x + 200),
      maxY: Math.max(bounds.maxY, node.position.y + 100)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    const groupId = `template-group-${timestamp}`;
    const groupWidth = templateBounds.maxX - templateBounds.minX + 40;
    const groupHeight = templateBounds.maxY - templateBounds.minY + 80;
    
    const groupNode = {
      id: groupId, type: 'group',
      data: { label: template.name, description: template.description, templateId: template.id, isTemplate: true },
      position,
      style: { width: groupWidth, height: groupHeight, backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '2px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '20px' },
      className: 'template-group'
    };

    const updatedTemplateNodes = templateNodes.map((node: Node, index: number) => {
      const originalId = node.id;
      const newId = `${node.id}-${timestamp}-${index}`;
      nodeIdMap.set(originalId, newId);
      return { ...node, id: newId, parentId: groupId, position: { x: node.position.x - templateBounds.minX + 20, y: node.position.y - templateBounds.minY + 40 }, extent: 'parent' as const, expandParent: true };
    });

    const updatedTemplateEdges = templateEdges.map((edge: Edge, index: number) => {
      const newSourceId = nodeIdMap.get(edge.source) || edge.source;
      const newTargetId = nodeIdMap.get(edge.target) || edge.target;
      return { ...edge, id: `${edge.id}-${timestamp}-${index}`, source: newSourceId, target: newTargetId };
    });

    const migrated = migrateEdges(updatedTemplateEdges);
    setNodes(currentNodes => [...currentNodes, groupNode, ...updatedTemplateNodes]);
    setEdges(currentEdges => [...currentEdges, ...migrated]);
    
    setTimeout(() => {
      if (reactFlowInstance.current) {
        setSelectedElement(groupNode);
        setTimeout(() => setSelectedElement(null), 1500);
      }
    }, 100);
    
    toast.success(`Added ${template.name} template`);
  }, [setNodes, setEdges, reactFlowInstance, setSelectedElement]);

  return {
    handleLoadTemplate,
    handleUngroupTemplate,
    handleLoadTemplateAtPosition,
  };
} 