"use client";

import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ISCAChatToggleProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnreadMessages?: boolean;
}

export function ISCAChatToggle({ isOpen, onClick, hasUnreadMessages = false }: ISCAChatToggleProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onClick}
        className={cn(
          "relative h-14 w-14 rounded-full shadow-lg transition-all duration-200 ease-in-out",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90",
          isOpen && "rotate-180"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        
        {hasUnreadMessages && !isOpen && (
          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-background animate-pulse" />
        )}
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md -z-10 animate-pulse" />
      </Button>
    </div>
  );
}
