import React from 'react';
import { cn } from '@/lib/utils';

interface BgGradientProps {
  className?: string;
  variant?: 'default' | 'purple' | 'blue' | 'pink';
}

const BgGradient: React.FC<BgGradientProps> = ({
  className,
  variant = 'default'
}) => {
  const variants = {
    default: 'bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20',
    purple: 'bg-gradient-to-br from-purple-500/20 via-violet-500/20 to-fuchsia-500/20',
    blue: 'bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20',
    pink: 'bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-orange-500/20',
  };

  return (
    <div
      className={cn(
        'absolute inset-0 w-full h-full',
        variants[variant],
        'blur-3xl opacity-30 animate-pulse',
        className
      )}
    />
  );
};

export default BgGradient; 