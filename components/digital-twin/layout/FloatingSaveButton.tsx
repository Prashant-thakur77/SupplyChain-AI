'use client';

import { FC, useState } from 'react';
import { Save, ChevronDown } from 'lucide-react';

interface FloatingSaveButtonProps {
  onSave: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const FloatingSaveButton: FC<FloatingSaveButtonProps> = ({
  onSave,
  disabled = false,
  isLoading = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="fixed top-20 right-4 z-50 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Save Button */}
      <div className={`
        transform transition-all duration-300 ease-out
        ${isHovered ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-90'}
      `}>
        <button
          onClick={onSave}
          disabled={disabled || isLoading}
          className={`
            relative flex items-center justify-center gap-2 px-6 py-3 
            bg-black dark:bg-white
            hover:bg-slate-800 dark:hover:bg-slate-100
            text-white dark:text-black font-medium text-sm
            rounded-none shadow-none
            transition-all duration-200 ease-out
            transform hover:scale-105 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
            min-w-[120px]
            border border-black dark:border-white
          `}
        >
          {/* No blur overlay needed for flat button */}
          
          {/* Button content */}
          <div className="relative flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </div>

          {/* Hover indicator */}
          <div className={`
            absolute -bottom-1 -right-1 w-3 h-3 
            bg-white/20 rounded-full
            transition-all duration-200
            ${isHovered ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
          `}>
            <ChevronDown className="w-3 h-3 text-white/70" />
          </div>
        </button>
      </div>

      {/* Tooltip */}
      <div className={`
        absolute top-full right-0 mt-2 px-3 py-1.5
        bg-gray-900 text-white text-xs rounded-md
        transform transition-all duration-200 ease-out
        ${isHovered ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0 pointer-events-none'}
        whitespace-nowrap
        shadow-lg
      `}>
        Save your supply chain configuration
        <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
      </div>


    </div>
  );
};

export default FloatingSaveButton; 