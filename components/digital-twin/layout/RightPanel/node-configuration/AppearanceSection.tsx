import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { initializeNodeColor } from '../functions';

interface AppearanceSectionProps {
  formValues: any;
  selectedNode?: any;
  onInputChange: (field: string, value: any) => void;
}

const AppearanceSection: React.FC<AppearanceSectionProps> = ({ 
  formValues, 
  selectedNode, 
  onInputChange 
}) => {
  const [localColor, setLocalColor] = useState(() => initializeNodeColor(formValues, selectedNode));
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced color change handler
  const handleColorChange = useCallback((color: string) => {
    setLocalColor(color);
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      onInputChange('nodeColor', color);
    }, 150); // 150ms debounce
  }, [onInputChange]);

  // Update local color when formValues changes (for external updates)
  useEffect(() => {
    const newColor = initializeNodeColor(formValues, selectedNode);
    setLocalColor(newColor);
  }, [formValues.nodeColor, formValues.type, selectedNode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AccordionItem value="appearance">
      <AccordionTrigger className="text-sm font-medium">
        Appearance
      </AccordionTrigger>
      <AccordionContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Node Color</Label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={localColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="nodrag w-12 h-8 rounded border border-border cursor-pointer"
                title="Choose node color"
              />
              <div 
                className="w-8 h-8 rounded border border-border"
                style={{ backgroundColor: localColor }}
                title="Current color preview"
              />
            </div>
            <div className="flex-1">
              <Input
                type="text"
                value={localColor}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#ffffff"
                className="font-mono text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <Button
              type="button"
              onClick={() => {
                setLocalColor('#ffffff');
                onInputChange('nodeColor', '#ffffff');
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Reset
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose a custom color for this node. Changes will be applied immediately.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default AppearanceSection; 