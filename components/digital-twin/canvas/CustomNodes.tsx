"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';
import { Truck, Anchor, Factory, Warehouse, Route, Store } from 'lucide-react';

// Get active node styling and colors
const nodeTypeConfigs = {
  supplier: {
    label: 'SUPPLIER',
    colorHex: '#2748E8',
    icon: Truck
  },
  port: {
    label: 'PORT',
    colorHex: '#1A7F4B',
    icon: Anchor
  },
  factory: {
    label: 'FACTORY',
    colorHex: '#B45309',
    icon: Factory
  },
  warehouse: {
    label: 'WAREHOUSE',
    colorHex: '#7C3AED',
    icon: Warehouse
  },
  distribution: {
    label: 'DISTRIBUTION',
    colorHex: '#B91C1C',
    icon: Route
  },
  retailer: {
    label: 'RETAILER',
    colorHex: '#6B7280',
    icon: Store
  },
  manufacturer: {
    label: 'MANUFACTURER',
    colorHex: '#B45309',
    icon: Factory
  }
};

interface BaseNodeProps extends NodeProps {
  nodeType: keyof typeof nodeTypeConfigs;
  showLeftHandle?: boolean;
  showRightHandle?: boolean;
}

const BaseNode = memo(({
  id,
  data,
  isConnectable,
  selected,
  nodeType,
  showLeftHandle = true,
  showRightHandle = true
}: BaseNodeProps) => {
  const config = nodeTypeConfigs[nodeType] || nodeTypeConfigs.supplier;
  const Icon = config.icon;

  const { disruptedNodes } = useDigitalTwinStore();
  const isDisrupted = disruptedNodes.includes(id);

  // High risk conditions
  const isHighRisk = data.riskScore >= 0.7 || 
                     data.riskLevel === 'High' || 
                     data.riskLevel === 'HIGH' || 
                     (nodeType === 'retailer' && isDisrupted);

  const isWatch = (data.riskScore >= 0.4 && data.riskScore < 0.7) || 
                  data.riskLevel === 'Medium' || 
                  data.riskLevel === 'Watch';

  // Status mapping
  let statusText = 'Healthy';
  let statusColorClass = 'bg-[#1A7F4B]';

  if (isDisrupted) {
    statusText = 'Disrupted';
    statusColorClass = 'bg-[#B91C1C]';
  } else if (isHighRisk) {
    statusText = 'High Risk';
    statusColorClass = 'bg-[#B91C1C]';
  } else if (isWatch) {
    statusText = 'Watch';
    statusColorClass = 'bg-[#B45309]';
  } else if (data.status) {
    statusText = data.status;
    const lowerStatus = statusText.toLowerCase();
    if (lowerStatus === 'healthy') statusColorClass = 'bg-[#1A7F4B]';
    else if (lowerStatus === 'watch') statusColorClass = 'bg-[#B45309]';
    else if (lowerStatus === 'disrupted' || lowerStatus === 'critical') statusColorClass = 'bg-[#B91C1C]';
  }

  const borderHex = data.nodeColor || config.colorHex;
  const borderStyle = {
    border: `1px solid ${isHighRisk ? '#B91C1C' : borderHex}`
  };

  const isRootDisruption = disruptedNodes.length > 0 && disruptedNodes[0] === id;
  const disruptionBorderClass = isRootDisruption 
    ? 'animate-pulse-border-red border-2' 
    : isDisrupted 
      ? 'animate-pulse-border-orange border-2' 
      : '';

  const selectedClass = selected 
    ? 'ring-2 ring-[#2748E8] ring-offset-2 dark:ring-offset-zinc-950 scale-[1.02]' 
    : '';

  return (
    <div
      style={borderStyle}
      title="Click to view node details"
      className={`relative w-[190px] rounded-xl px-3 py-2.5 transition-all duration-200 shadow-sm text-left cursor-pointer ${
        isHighRisk 
          ? 'bg-[#FEF2F2] dark:bg-[#2A1515]' 
          : 'bg-white dark:bg-zinc-900'
      } ${disruptionBorderClass} ${selectedClass}`}
    >
      {showLeftHandle && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="!w-2.5 !h-2.5 !bg-theme-border-default hover:!bg-[#2748E8] transition-colors"
        />
      )}
      {showRightHandle && (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="!w-2.5 !h-2.5 !bg-theme-border-default hover:!bg-[#2748E8] transition-colors"
        />
      )}

      {/* High Risk Badge */}
      {isHighRisk && (
        <span className="absolute top-2.5 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase bg-[#B91C1C] text-white">
          HIGH RISK
        </span>
      )}

      {/* Top row: icon + type label */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: isHighRisk ? '#B91C1C' : borderHex }} />
        <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: isHighRisk ? '#B91C1C' : borderHex }}>
          {config.label}
        </span>
      </div>

      {/* Middle row: node name */}
      <div className="font-semibold text-xs leading-tight text-[#18160F] dark:text-[#F0EDE7] mb-2 truncate" title={data.label}>
        {data.label}
      </div>

      {/* Bottom row: status dot + status text */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${statusColorClass}`} />
        <span className="text-[10px] font-medium text-theme-text-secondary">
          {statusText}
        </span>
      </div>
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

// Supplier Node
export const SupplierNode = memo((props: NodeProps) => (
  <BaseNode {...props} nodeType="supplier" />
));
SupplierNode.displayName = 'SupplierNode';

// Factory Node
export const FactoryNode = memo((props: NodeProps) => (
  <BaseNode {...props} nodeType="factory" />
));
FactoryNode.displayName = 'FactoryNode';

// Port Node
export const PortNode = memo((props: NodeProps) => (
  <BaseNode {...props} nodeType="port" />
));
PortNode.displayName = 'PortNode';

// Warehouse Node
export const WarehouseNode = memo((props: NodeProps) => (
  <BaseNode {...props} nodeType="warehouse" />
));
WarehouseNode.displayName = 'WarehouseNode';

// Distribution Node
export const DistributionNode = memo((props: NodeProps) => (
  <BaseNode {...props} nodeType="distribution" />
));
DistributionNode.displayName = 'DistributionNode';

// Retailer Node
export const RetailerNode = memo((props: NodeProps) => (
  <BaseNode {...props} nodeType="retailer" showRightHandle={false} />
));
RetailerNode.displayName = 'RetailerNode';

// Manufacturer / Production Node
export const ManufacturerNode = memo((props: NodeProps) => (
  <BaseNode {...props} nodeType="manufacturer" />
));
ManufacturerNode.displayName = 'ManufacturerNode';

// Template Group Node
export const TemplateGroupNode = memo(({ data, selected }: NodeProps) => {
  const templateSelectionClass = selected ? 'ring-2 ring-blue-500/50' : '';
  
  return (
    <div 
      className={`template-group h-full w-full border border-dashed border-[#D6CFC4] dark:border-zinc-800 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] ${templateSelectionClass}`}
      data-label={data.label}
      title="Double-click to ungroup this template"
    >
      <div className="h-full w-full" />
    </div>
  );
});
TemplateGroupNode.displayName = 'TemplateGroupNode';

export const nodeTypes = {
  supplierNode: SupplierNode,
  factoryNode: FactoryNode,
  portNode: PortNode,
  warehouseNode: WarehouseNode,
  distributionNode: DistributionNode,
  retailerNode: RetailerNode,
  customerNode: RetailerNode,
  manufacturerNode: ManufacturerNode,
  productionNode: ManufacturerNode,
  'supply-chain-node': WarehouseNode,
  supplyChainNode: WarehouseNode,
  genericNode: WarehouseNode,
  group: TemplateGroupNode,
};