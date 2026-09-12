import React from 'react';
import { useDisruptionSimulation } from './hooks/useDisruptionSimulation';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';

interface NodeContextMenuProps {
  id: string;
  top: number;
  left: number;
  onClose: () => void;
  onSimulateClick?: () => void;
}

export default function NodeContextMenu({ id, top, left, onClose, onSimulateClick }: NodeContextMenuProps) {
  const { clearDisruptions } = useDisruptionSimulation();
  const { isControlTowerMode } = useDigitalTwinStore();

  if (!isControlTowerMode) return null;

  const handleSimulate = () => {
    if (onSimulateClick) {
      onSimulateClick();
    }
  };

  const handleClear = () => {
    clearDisruptions();
    onClose();
  };

  return (
    <div
      style={{ top, left }}
      className="absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-md py-1 min-w-[200px]"
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
        Control Tower Actions
      </div>
      <button
        onClick={handleSimulate}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        Simulate Disruption Here
      </button>
      <button
        onClick={handleClear}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Clear Disruptions
      </button>
    </div>
  );
}
