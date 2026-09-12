import React from 'react';
import { useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';
import { Factory, Building2, Truck, Package, Settings } from 'lucide-react';
import { SaveStatus } from './types';

/**
 * Creates a debounced save function with status management
 * @param onSave - The save function to call
 * @param setSaveStatus - Function to update save status
 * @param minimumDisplayTime - Minimum time to show "saved" status
 * @returns Debounced save function and refs for tracking
 */
export const createDebouncedSave = (
  onSave: (() => Promise<void>) | undefined,
  setSaveStatus: (status: SaveStatus) => void,
  minimumDisplayTime: number = 1000
) => {
  const isSaving = useRef(false);
  const lastSavedTime = useRef<number>(0);

  const debouncedSave = useCallback(
    debounce(async () => {
      if (isSaving.current || !onSave) return;
      
      try {
        isSaving.current = true;
        setSaveStatus('saving');
        await onSave();
        
        // Record the time when save completed
        const currentTime = Date.now();
        lastSavedTime.current = currentTime;
        
        // Show "saved" status with smooth transition
        setSaveStatus('saved');
        
        // After minimum display time, if no new changes, keep showing saved
        setTimeout(() => {
          // Only reset if this was the last save operation and we haven't had new changes
          if (lastSavedTime.current === currentTime) {
            // Keep showing saved status - don't flicker back and forth
          }
        }, minimumDisplayTime);
        
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('unsaved');
      } finally {
        isSaving.current = false;
      }
    }, 1500), // 1.5 second debounce
    [onSave, setSaveStatus, minimumDisplayTime]
  );

  return {
    debouncedSave,
    isSaving,
    lastSavedTime
  };
};

/**
 * Determines if the selected element is a node (vs edge)
 * @param selectedElement - The selected element
 * @returns true if element is a node, false if edge
 */
export const isNodeElement = (selectedElement: any): boolean => {
  return selectedElement && !('source' in selectedElement);
};

/**
 * Maps node types to their default colors - synchronized with node-actions.ts
 * @param nodeType - The type of the node
 * @returns The default color as a hex string
 */
export const getDefaultColorFromNodeType = (nodeType: string): string => {
  const nodeTypeMap: { [key: string]: string } = {
    'supplier': '#3B82F6', // Blue for suppliers (matches node-actions.ts)
    'suppliernode': '#3B82F6', // Blue for suppliers
    'factory': '#EF4444', // Red for factories
    'factorynode': '#EF4444', // Red for factories  
    'manufacturer': '#EF4444', // Red for manufacturers
    'port': '#06B6D4', // Cyan for ports
    'portnode': '#06B6D4', // Cyan for ports
    'warehouse': '#F59E0B', // Orange for warehouses
    'warehousenode': '#F59E0B', // Orange for warehouses
    'distribution': '#10B981', // Green for distribution
    'distributionnode': '#10B981', // Green for distribution
    'distributor': '#10B981', // Green for distribution
    'retailer': '#8B5CF6', // Purple for retail
    'retailernode': '#8B5CF6', // Purple for retail
    'customer': '#8B5CF6', // Purple for customers
    '3pl': '#84CC16' // Lime for 3PL
  };
  return nodeTypeMap[nodeType?.toLowerCase()] || '#ffffff';
};

/**
 * Gets the appropriate icon for a node type
 * @param type - The node type
 * @returns React element for the icon
 */
export const getNodeTypeIcon = (type: string): React.ReactElement => {
  switch (type.toLowerCase()) {
    case 'factory':
    case 'manufacturer':
      return <Factory className="w-4 h-4" />;
    case 'warehouse':
    case 'distribution center':
      return <Building2 className="w-4 h-4" />;
    case 'supplier':
    case 'vendor':
      return <Package className="w-4 h-4" />;
    case 'logistics':
    case 'transport':
      return <Truck className="w-4 h-4" />;
    default:
      return <Settings className="w-4 h-4" />;
  }
};

/**
 * Initializes the color for a node based on formValues or node type
 * @param formValues - The form values object
 * @param selectedNode - The selected node
 * @returns The initialized color as a hex string
 */
export const initializeNodeColor = (formValues: any, selectedNode?: any): string => {
  if (formValues.nodeColor) {
    return formValues.nodeColor;
  }
  // For nodes without explicit nodeColor, use the default color based on type
  const nodeType = formValues.type || selectedNode?.data?.type || '';
  return getDefaultColorFromNodeType(nodeType);
};
