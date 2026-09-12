// src/components/CustomEdges.tsx
import { useState } from 'react';
import { 
  EdgeProps, 
  BaseEdge, 
  EdgeLabelRenderer,
  getSmoothStepPath
} from 'reactflow';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';

export const TransportEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style = {}
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  const { nodes, disruptedEdges, disruptedNodes } = useDigitalTwinStore();
  const isDisrupted = disruptedEdges.includes(id);

  // Check if either connected node is high-risk or disrupted
  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);

  const isSourceAtRisk = sourceNode && (
    (sourceNode.data?.riskScore && sourceNode.data.riskScore >= 0.7) || 
    sourceNode.data?.riskLevel === 'High' || 
    sourceNode.data?.riskLevel === 'HIGH' || 
    disruptedNodes.includes(source)
  );

  const isTargetAtRisk = targetNode && (
    (targetNode.data?.riskScore && targetNode.data.riskScore >= 0.7) || 
    targetNode.data?.riskLevel === 'High' || 
    targetNode.data?.riskLevel === 'HIGH' || 
    disruptedNodes.includes(target)
  );

  const isAtRisk = isSourceAtRisk || isTargetAtRisk;

  // Get emoji and text for transport mode
  const getTransportInfo = () => {
    switch (data?.mode) {
      case 'sea': 
        return { emoji: '🚢', text: 'Sea', color: '#0ea5e9' };
      case 'air': 
        return { emoji: '✈️', text: 'Air', color: '#8b5cf6' };
      case 'rail': 
        return { emoji: '🚂', text: 'Rail', color: '#f59e0b' };
      case 'road': 
      default: 
        return { emoji: '🚚', text: 'Road', color: '#10b981' };
    }
  };

  const transportInfo = getTransportInfo();

  return (
    <>
      <BaseEdge
        path={edgePath}
        id={id}
        style={{
          strokeWidth: (isDisrupted || isAtRisk) ? 3 : 2,
          stroke: (isDisrupted || isAtRisk) ? '#B91C1C' : 'var(--border-default)',
          strokeDasharray: (isDisrupted || isAtRisk) ? '5,5' : 'none',
          animation: (isDisrupted || isAtRisk) ? 'dashdraw 1.5s linear infinite' : 'none',
          ...style
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            padding: selected ? '6px 12px' : '0',
            width: selected ? 'auto' : '20px',
            height: selected ? 'auto' : '20px',
            borderRadius: selected ? '6px' : '50%',
            fontSize: selected ? '13px' : '11px',
            fontWeight: 500,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minWidth: selected ? 'max-content' : '20px'
          }}
          className="nodrag nopan hover:border-theme-blue/50 transition-colors"
        >
          <span style={{ fontSize: selected ? '14px' : '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {transportInfo.emoji}
          </span>
          {selected && <span style={{ color: 'var(--text-primary)' }}>{transportInfo.text}</span>}
          
          {selected && (
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)',
              marginLeft: '8px',
              borderLeft: '1px solid var(--border-subtle)',
              paddingLeft: '8px'
            }}>
              <div>💰 ${data?.cost || 0}</div>
              <div>⏱️ {data?.transitTime || 0}d</div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export const edgeTypes = {
  transportEdge: TransportEdge,
  sea: TransportEdge,
  air: TransportEdge,
  rail: TransportEdge,
  road: TransportEdge,
  default: TransportEdge
};