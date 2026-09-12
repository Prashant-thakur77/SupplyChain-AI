"use client"

import { MessageSquare, X, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImmersiveHeaderProps } from './types';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export const ImmersiveHeader: React.FC<ImmersiveHeaderProps> = ({ 
  onExit,
  onCollapse,
}) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
        <h2 className="text-sm font-semibold text-foreground truncate">AI Assistant</h2>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <TooltipProvider delayDuration={150}>
          {onCollapse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCollapse}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                  aria-label="Collapse panel"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Collapse Panel</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExit}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exit Immersive Mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}; 