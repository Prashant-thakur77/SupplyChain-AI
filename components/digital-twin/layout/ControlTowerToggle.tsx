'use client';

import { FC, useState } from 'react';
import { ShieldAlert, Settings } from 'lucide-react';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';

const ControlTowerToggle: FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { isControlTowerMode, setControlTowerMode } = useDigitalTwinStore();

  return (
    <div 
      className="fixed top-20 right-[150px] z-50 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        transform transition-all duration-300 ease-out
        ${isHovered ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-90'}
      `}>
        <button
          onClick={() => setControlTowerMode(!isControlTowerMode)}
          className={`
            relative flex items-center justify-center gap-2 px-4 py-2.5 
            ${isControlTowerMode ? 'bg-theme-red hover:bg-theme-red/90 text-white border-theme-red' : 'bg-theme-bg-surface hover:bg-theme-bg-secondary text-theme-text-primary border-theme-border-default'}
            font-[600] text-xs uppercase tracking-[0.05em]
            rounded-theme-md shadow-sm
            transition-all duration-200 ease-out
            transform hover:scale-[1.02] active:scale-95
            border
            min-w-[140px]
          `}
        >
          <div className="relative flex items-center gap-2">
            {isControlTowerMode ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Control Tower</span>
              </>
            ) : (
              <>
                <Settings className="w-3.5 h-3.5" />
                <span>Design Mode</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Tooltip */}
      <div className={`
        absolute top-full right-0 mt-2 px-3 py-1.5
        bg-theme-text-primary text-theme-bg-primary text-[10px] uppercase font-[700] tracking-[0.05em] rounded-theme-md
        transform transition-all duration-200 ease-out
        ${isHovered ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0 pointer-events-none'}
        whitespace-nowrap
        shadow-md border border-theme-border-subtle
      `}>
        {isControlTowerMode ? 'Exit Control Tower mode' : 'Enter Control Tower mode'}
        <div className="absolute -top-1 right-12 w-2 h-2 bg-theme-text-primary border-t border-l border-theme-border-subtle transform rotate-45"></div>
      </div>
    </div>
  );
};

export default ControlTowerToggle;
