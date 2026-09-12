import { FC } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MousePointer } from 'lucide-react';
import { contentVariants } from './animations';

interface EmptyStateProps {
  onCollapse: () => void;
}

const EmptyState: FC<EmptyStateProps> = ({ onCollapse }) => {
  return (
    <motion.div 
      className="flex-1 flex flex-col bg-theme-bg-surface"
      variants={contentVariants}
      animate="visible"
      initial="hidden"
    >
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-12 h-12 rounded-full border border-theme-border-subtle flex items-center justify-center bg-theme-bg-secondary text-theme-text-secondary mb-4">
          <MousePointer className="w-5 h-5" />
        </div>

        {/* Minimal text */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <p className="text-sm font-bold text-theme-text-primary uppercase tracking-wider">
            Select an element
          </p>
          <p className="text-xs text-theme-text-secondary max-w-[220px] leading-relaxed">
            Click any node or edge on the canvas to inspect and edit its properties
          </p>
        </motion.div>
      </div>
      
      {/* Subtle Collapse button */}
      <div className="p-4 border-t border-theme-border-subtle flex justify-center">
        <button
          onClick={onCollapse}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-theme-bg-secondary transition-colors group text-theme-text-secondary hover:text-theme-text-primary"
        >
          <span className="text-xs font-semibold select-none">Hide Panel</span>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default EmptyState;