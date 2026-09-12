'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeroAnimatedProps {
  header: string;
  headerClassName?: string;
  description?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
}

const HeroAnimated: React.FC<HeroAnimatedProps> = ({
  header,
  headerClassName,
  description,
  descriptionClassName,
  children,
}) => {
  return (
    <div className="space-y-4">
      {/* Animated Header */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={cn(
          "font-bold text-4xl md:text-5xl lg:text-6xl leading-tight",
          headerClassName
        )}
      >
        {header}
      </motion.h1>

      {/* Animated Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={cn(
            "text-lg text-muted-foreground max-w-2xl",
            descriptionClassName
          )}
        >
          {description}
        </motion.p>
      )}

      {/* Animated Children */}
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

export default HeroAnimated; 