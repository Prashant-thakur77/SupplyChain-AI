import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import { Info } from 'lucide-react';

interface GeneralSectionProps {
  formValues: any;
  onInputChange: (field: string, value: any) => void;
}

const GeneralSection: React.FC<GeneralSectionProps> = ({ formValues, onInputChange }) => {
  return (
    <AccordionItem value="general">
      <AccordionTrigger className="text-sm font-medium">
        General
      </AccordionTrigger>
      <AccordionContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Label</Label>
            <span className="text-xs text-muted-foreground">
                {(formValues.label || '').length}/50
            </span>
          </div>
          <div className="p-0.5">
            <Input
              type="text"
              value={formValues.label || ''}
              onChange={(e) => {
                if (e.target.value.length <= 50) {
                  onInputChange('label', e.target.value);
                }
              }}
              placeholder="Enter label..."
              maxLength={50}
              className="px-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 shadow-md"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum 50 characters for the node label.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-foreground">Description</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                sideOffset={8}
                className="max-w-xs z-50"
                avoidCollisions={true}
                collisionPadding={16}
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    More details help us better analyze risks for this node.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Examples: operating hours, capacity limits, key processes, quality standards, regulatory requirements, or special handling needs.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="p-0.5">
            <Textarea
              rows={3}
              value={formValues.description || ''}
              onChange={(e) => onInputChange('description', e.target.value)}
              placeholder="Add a detailed description..."
              className="resize-none px-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 shadow-md"
            />
          </div>
        </div>

        {/* External Company Dependencies */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm font-medium text-foreground">
                Depends on External Company?
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline-block w-4 h-4 ml-2 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    sideOffset={8}
                    className="max-w-xs z-50"
                    avoidCollisions={true}
                    collisionPadding={16}
                  >
                    <p className="text-sm">
                      Toggle if this node depends on or is operated by an external company or partner.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
            <Switch
              checked={formValues.dependsOnExternalCompany || false}
              onCheckedChange={(checked) => onInputChange('dependsOnExternalCompany', checked)}
            />
          </div>

          {/* Show external company fields when toggle is enabled */}
          {formValues.dependsOnExternalCompany && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Company Name</Label>
                <div className="p-0.5">
                  <Input
                    type="text"
                    value={formValues.externalCompanyName || ''}
                    onChange={(e) => onInputChange('externalCompanyName', e.target.value)}
                    placeholder="Enter company name..."
                    className="px-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 shadow-md"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Company Country of Origin</Label>
                <div className="p-0.5">
                  <CountryDropdown
                    defaultValue={formValues.externalCompanyCountry}
                    onChange={(country) => onInputChange('externalCompanyCountry', country.alpha3)}
                    placeholder="Select country of origin..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Description of Company 
                  <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                </Label>
                <div className="p-0.5">
                  <Textarea
                    rows={3}
                    value={formValues.externalCompanyDescription || ''}
                    onChange={(e) => onInputChange('externalCompanyDescription', e.target.value)}
                    placeholder="Optional: Describe the external company's role and relationship..."
                    className="resize-none px-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 shadow-md"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default GeneralSection; 