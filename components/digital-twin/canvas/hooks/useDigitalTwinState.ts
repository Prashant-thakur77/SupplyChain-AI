"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, Node, Edge, ReactFlowInstance } from 'reactflow';
import { useQueryState } from 'nuqs';
import debounce from 'lodash.debounce';
import { migrateEdges } from '../lib/utils';
import { compressArchData, decompressArchData } from '@/lib/utils/url-compression';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';

export function useDigitalTwinState(initialNodes: Node[] = [], initialEdges: Edge[] = []) {
  const [archParam, setArchParam] = useQueryState('arch', {
    defaultValue: '',
    // CRITICAL: must be shallow=true so URL updates don't trigger a full re-render
    // (which would unmount dialogs like SaveSupplyChainDialog & IntelligenceAnalysisDialog)
    shallow: true,
  });

  const [hydratedNodes, setHydratedNodes] = useState<Node[]>([]);
  const [hydratedEdges, setHydratedEdges] = useState<Edge[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(hydratedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(hydratedEdges);

  const isUpdatingFromURL = useRef(false);

  useEffect(() => {
    const hydrateFromURL = async () => {
      if (!isHydrated) {
        if (archParam) {
          try {
            console.log('🗜️ Decompressing canvas state from URL...');
            const canvasData = decompressArchData(archParam);

            if (canvasData.nodes && canvasData.edges) {
              const migrated = migrateEdges(canvasData.edges);
              setHydratedNodes(canvasData.nodes);
              setHydratedEdges(migrated);
              isUpdatingFromURL.current = true;
              setNodes(canvasData.nodes);
              setEdges(migrated);
              setTimeout(() => { isUpdatingFromURL.current = false; }, 100);
            }
          } catch (error) {
            console.error('Failed to hydrate canvas state from URL:', error);
            const migratedInitial = migrateEdges(initialEdges);
            setHydratedNodes(initialNodes);
            setHydratedEdges(migratedInitial);
            setNodes(initialNodes);
            setEdges(migratedInitial);
          }
        } else {
          const migratedInitial = migrateEdges(initialEdges);
          setHydratedNodes(initialNodes);
          setHydratedEdges(migratedInitial);
          setNodes(initialNodes);
          setEdges(migratedInitial);
        }
        setIsHydrated(true);
      }
    };
    hydrateFromURL();
  }, [archParam, initialNodes, initialEdges, isHydrated, setNodes, setEdges]);

  const debouncedUpdateURL = useCallback(
    debounce((currentNodes: Node[], currentEdges: Edge[]) => {
      if (isUpdatingFromURL.current) return;
      try {
        const canvasData = { nodes: currentNodes, edges: currentEdges, timestamp: Date.now() };
        const jsonString = JSON.stringify(canvasData);
        
        // Check if data is too large even before compression
        if (jsonString.length > 200000) {
          console.warn('Canvas data extremely large, skipping URL update');
          return;
        }
        
        console.log('🗜️ Compressing canvas state for URL...');
        const compressedString = compressArchData(canvasData);

        // Guard: skip URL write if the compressed param would exceed safe URL length
        // to avoid nuqs 'Max safe URL length exceeded' which causes full page re-renders.
        if (compressedString.length > 2000) {
          console.warn('⚠️ Compressed canvas data too large for URL (' + compressedString.length + ' chars), skipping URL update');
          return;
        }

        setArchParam(compressedString, { scroll: false, shallow: true });
      } catch (error) {
        console.error('Failed to update URL with canvas state:', error);
      }
    }, 1000),
    [setArchParam]
  );
  
  const forceURLUpdate = useRef(false);

  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    const hasPositionChange = changes.some(change =>
      change.type === 'position' || change.type === 'dimensions'
    );
    if (hasPositionChange) {
      forceURLUpdate.current = true;
    }
  }, [onNodesChange]);

  useEffect(() => {
    if (isHydrated && !isUpdatingFromURL.current) {
      debouncedUpdateURL(nodes, edges);
       if (forceURLUpdate.current) {
        forceURLUpdate.current = false;
      }
    }
  }, [nodes, edges, isHydrated, debouncedUpdateURL]);

  // Sync canvas nodes/edges into the Zustand store so ControlTowerPanel
  // and other global consumers can read the live canvas state.
  const storeSetNodes = useDigitalTwinStore((s) => s.setNodes);
  const storeSetEdges = useDigitalTwinStore((s) => s.setEdges);
  useEffect(() => {
    if (isHydrated) {
      storeSetNodes(nodes);
      storeSetEdges(edges);
    }
  }, [nodes, edges, isHydrated, storeSetNodes, storeSetEdges]);

  useEffect(() => {
    return () => {
      debouncedUpdateURL.cancel();
    };
  }, [debouncedUpdateURL]);

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    onNodesChange: handleNodesChange,
    onEdgesChange,
    isHydrated,
  };
} 