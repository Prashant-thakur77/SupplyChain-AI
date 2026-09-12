import { Factory, Layers, Workflow, LucideProps } from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

// Define a mapping from node types to icons
export const nodeTypeToIcon: { [key: string]: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>> } = {
  supplierNode: Factory,
  factoryNode: Factory,
  warehouseNode: Layers,
  distributionNode: Workflow,
  retailerNode: Factory, // Using Factory as a default, can be changed
}; 