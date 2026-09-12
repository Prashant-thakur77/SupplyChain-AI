import { FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { SaveStatus } from './types';
import { TextShimmer } from '@/components/ui/text-shimmer';

interface SaveStatusIndicatorProps {
  saveStatus: SaveStatus;
}

const SaveStatusIndicator: FC<SaveStatusIndicatorProps> = ({ saveStatus }) => {
  const [displayStatus, setDisplayStatus] = useState<SaveStatus>(saveStatus);
  const [isMinimumDuration, setIsMinimumDuration] = useState(false);

  // Minimum saving duration of 1.5 seconds
  const MINIMUM_SAVING_DURATION = 1500;

  useEffect(() => {
    if (saveStatus === 'saving') {
      setDisplayStatus('saving');
      setIsMinimumDuration(true);
      
      // Set minimum duration timer
      const timer = setTimeout(() => {
        setIsMinimumDuration(false);
      }, MINIMUM_SAVING_DURATION);

      return () => clearTimeout(timer);
    } else if (saveStatus === 'saved' && !isMinimumDuration) {
      // Only update to saved if minimum duration has passed
      setDisplayStatus('saved');
    } else if (saveStatus === 'unsaved') {
      setDisplayStatus('unsaved');
      setIsMinimumDuration(false);
    }
  }, [saveStatus, isMinimumDuration]);

  // Update to saved after minimum duration if save completed
  useEffect(() => {
    if (!isMinimumDuration && saveStatus === 'saved' && displayStatus === 'saving') {
      setDisplayStatus('saved');
    }
  }, [isMinimumDuration, saveStatus, displayStatus]);

  const getStatusConfig = () => {
    switch (displayStatus) {
      case 'unsaved':
        return {
          icon: <div className="h-3 w-3 rounded-full bg-amber-500 dark:bg-amber-400" />,
          text: 'Unsaved changes',
          className: 'text-amber-600 dark:text-amber-400'
        };
      case 'saving':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-slate-600 dark:text-slate-400" />,
          text: <TextShimmer className="text-sm font-medium text-slate-600 dark:text-slate-400" duration={1.5}>Saving</TextShimmer>,
          className: ''
        };
      case 'saved':
        return {
          icon: <Check className="h-4 w-4 text-green-600 dark:text-green-400" />,
          text: 'Saved',
          className: 'text-green-600 dark:text-green-400'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      className="flex items-center space-x-2"
      layout
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      <motion.div
        layout
        transition={{ duration: 0.2 }}
      >
        {config.icon}
      </motion.div>
      
      {typeof config.text === 'string' ? (
        <motion.span 
          className={`text-sm font-medium ${config.className}`}
          layout
          transition={{ duration: 0.2 }}
        >
          {config.text}
        </motion.span>
      ) : (
        config.text
      )}
    </motion.div>
  );
};

export default SaveStatusIndicator; 