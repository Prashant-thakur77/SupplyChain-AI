import React from 'react';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { getNodeTypeIcon } from '../functions';

interface NodeTypeHeaderProps {
  nodeType: string;
}

const NodeTypeHeader: React.FC<NodeTypeHeaderProps> = ({ nodeType }) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="bg-muted/30 border border-border rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-background border border-border rounded-md">
              {getNodeTypeIcon(nodeType)}
            </div>
            <div className="flex-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Node Type
              </Label>
              <div className="text-base font-semibold text-foreground mt-0.5">
                {nodeType || 'Not specified'}
              </div>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center justify-center w-6 h-6 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              sideOffset={8}
              className="max-w-xs z-50"
              avoidCollisions={true}
              collisionPadding={16}
            >
              <p className="text-sm">
                Node type cannot be changed after creation. To change the type, delete this node and create a new one.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default NodeTypeHeader; 