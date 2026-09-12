// Core types for dynamic node properties system
export type NodeType = 'supplierNode' | 'factoryNode' | 'warehouseNode' | 'distributionNode' | 'portNode' | 'retailerNode';

export interface PropertySpec {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'slider' | 'textarea' | 'country' | 'multiselect';
  label: string;
  options?: string[];
  optional?: boolean;
  showInfoIcon?: boolean;
  infoText?: string;
  dependsOn?: {
    key: string;
    value: any;
  };
  // Slider-specific properties
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  // Multiselect-specific properties
  placeholder?: string;
}

// Edge-specific types
export interface EdgePropertySpec {
  matcher: (src: NodeType, tgt: NodeType, mode: string, meta?: any) => boolean;
  fields: PropertySpec[];
} 