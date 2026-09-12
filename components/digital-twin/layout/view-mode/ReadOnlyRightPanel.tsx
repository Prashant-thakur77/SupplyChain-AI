"use client";

import { FC, useMemo, useState } from 'react';
import { Node } from 'reactflow';
import { useStore } from 'reactflow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Maximize2 } from 'lucide-react';
import { NODE_TYPES } from '@/constants/digital-twin';

interface ReadOnlyRightPanelProps {
  /** Optional additional class names */
  className?: string;
}

/**
 * ReadOnlyRightPanel
 * ------------------
 * A minimal inspector panel for Digital-Twin **View-Only** mode. It simply
 * displays the data payload for the currently-selected node. No mutation
 * controls are provided.
 */
const ReadOnlyRightPanel: FC<ReadOnlyRightPanelProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // React Flow v11 stores nodes inside the `nodeInternals` Map instead of a `nodes` array.
  // We convert it to an array and filter for the currently-selected node(s).
  const selectedNodes = useStore((state: any) => {
    const nodesArray: Node[] = Array.from(state?.nodeInternals?.values?.() ?? []) as Node[];
    return nodesArray.filter((n) => (n as any).selected);
  }) as Node[];

  const selectedNode = useMemo(() => (selectedNodes?.length ? selectedNodes[0] : null), [selectedNodes]);

  const nodeTypeInfo = useMemo(() => {
    if (!selectedNode?.type) return null;
    const typeId = selectedNode.type.replace(/Node$/, ''); // E.g., "supplierNode" -> "supplier"
    // Find a match, ignoring case
    return NODE_TYPES.find(nt => nt.id.toLowerCase() === typeId.toLowerCase());
  }, [selectedNode?.type]);

  return (
    <motion.div 
      className={`border-l border-border bg-card/50 backdrop-blur-sm flex flex-col shadow-md overflow-hidden ${className ?? ''}`}
      initial={{ width: 300 }}
      animate={{ width: isCollapsed ? 48 : 300 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Collapsed State */}
      {isCollapsed ? (
        <div className="h-full flex flex-col items-center justify-between py-4">
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Vertical "Properties" text when collapsed */}
            <div className="writing-mode-vertical text-xs font-medium text-muted-foreground uppercase tracking-wide transform rotate-180">
              Properties
            </div>
            
            {/* Node indicator when something is selected */}
            {selectedNode && (
              <div className="mt-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="w-8 h-8 p-0 hover:bg-muted/50"
            title="Expand Properties Panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Properties</h2>
              <div className="flex items-center text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                View Only
              </div>
            </div>
          </div>

          {/* Content Area - now a flex container */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!selectedNode ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                    <Maximize2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm">Select a node on the canvas to inspect details</p>
                </div>
              </div>
            ) : (
              // This is now a flex container to layout its children
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Fixed Header Content */}
                <div className="flex-shrink-0">
                  {/* Node Title */}
                  <div className="px-4 py-3 border-b border-border/50 bg-background/50">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Viewing node: 
                      </div>
                      <div className="text-sm font-medium text-foreground truncate" title={String(selectedNode.data?.label || selectedNode.id)}>
                        {selectedNode.data?.label || selectedNode.id}
                      </div>
                    </div>
                  </div>

                  {/* Node Type Badge */}
                  {selectedNode.type && nodeTypeInfo && (
                    <div className="px-4 py-3 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${nodeTypeInfo.color}`}>
                          <nodeTypeInfo.icon className={`w-4 h-4 ${nodeTypeInfo.iconColor}`} />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            NODE TYPE
                          </div>
                          <div className="text-sm font-medium capitalize">
                            {nodeTypeInfo.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scrollable Properties Area */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {selectedNode.data && Object.keys(selectedNode.data).length > 0 ? (
                      Object.entries(selectedNode.data)
                        .filter(([key]) => !['location', 'position'].includes(key))
                        .map(([key, value]) => {
                          let displayValue = value;
                          
                          if (key === 'country' && 
                              selectedNode.data.location && 
                              typeof selectedNode.data.location === 'object' && 
                              'countryName' in selectedNode.data.location) {
                            displayValue = (selectedNode.data.location as any).countryName;
                          }

                          return (
                            <div key={key} className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                <div className="text-sm text-foreground break-words">
                                  {typeof displayValue === 'object' 
                                    ? JSON.stringify(displayValue, null, 2) 
                                    : String(displayValue) || 'No value set'
                                  }
                                </div>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No properties available for this node.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          {/* Footer with Collapse Button */}
          <div className="flex-shrink-0 p-2 border-t border-border bg-background/80 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="w-full h-8 hover:bg-muted/50 flex items-center justify-center"
              title="Collapse Properties Panel"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ReadOnlyRightPanel; 