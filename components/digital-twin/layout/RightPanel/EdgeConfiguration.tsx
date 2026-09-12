import { FC } from 'react';
import { Edge } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EDGE_PROPERTY_SPECS } from '@/constants/digital-twin';
import DynamicFormField from '@/components/digital-twin/forms/DynamicFormField';

interface EdgeConfigurationProps {
  selectedEdge: Edge;
  formValues: any;
  onInputChange: (field: string, value: any) => void;
  sourceNode?: any;
  targetNode?: any;
}

const EdgeConfiguration: FC<EdgeConfigurationProps> = ({
  selectedEdge,
  formValues,
  onInputChange,
  sourceNode,
  targetNode
}) => {
  // Get all applicable fields for this edge based on the matcher functions
  const getApplicableFields = () => {
    const allFields: any[] = [];
    
    EDGE_PROPERTY_SPECS.forEach(spec => {
      if (spec.matcher(
        sourceNode?.type, 
        targetNode?.type, 
        formValues.mode || 'road',
        { 
          passesThroughKeyRoute: formValues.passesThroughChokepoint,
          sourceCountry: sourceNode?.data?.location?.country || sourceNode?.data?.country,
          targetCountry: targetNode?.data?.location?.country || targetNode?.data?.country
        }
      )) {
        allFields.push(...spec.fields);
      }
    });
    
    return allFields;
  };

  const applicableFields = getApplicableFields();

  // Check if chokepoint selection should be shown
  const shouldShowChokepointSelection = () => {
    const sourceCountry = sourceNode?.data?.location?.country || sourceNode?.data?.country;
    const targetCountry = targetNode?.data?.location?.country || targetNode?.data?.country;
    const isCrossCountry = sourceCountry && targetCountry && sourceCountry !== targetCountry;
    // Show chokepoint selection for cross-country sea transport
    return formValues.mode === 'sea' && isCrossCountry;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full space-y-4">
        <Accordion type="multiple" defaultValue={[]} className="w-full">
          {/* Transportation Properties Section */}
          <AccordionItem value="transportation">
            <AccordionTrigger className="text-sm font-medium">
              Transportation Properties
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Transportation Mode</Label>
                <select
                  value={formValues.mode || 'road'}
                  onChange={(e) => onInputChange('mode', e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                >
                  <option value="road">🚚 Road Transport</option>
                  <option value="rail">🚂 Rail Transport</option>
                  <option value="sea">🚢 Sea Transport</option>
                  <option value="air">✈️ Air Transport</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Cost</Label>
                <Input
                  type="number"
                  value={formValues.cost || 0}
                  onChange={(e) => onInputChange('cost', parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Transit Time (days)</Label>
                <Input
                  type="number"
                  value={formValues.transitTime || 0}
                  onChange={(e) => onInputChange('transitTime', parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Risk & Disruption Analysis Section */}
          <AccordionItem value="risk-analysis">
            <AccordionTrigger className="text-sm font-medium">
              Risk & Disruption Analysis
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {applicableFields.map((field) => {
                // Special handling for chokepoint selection - only show if nodes are in different countries
                if (field.key === 'chokepointNames' && !shouldShowChokepointSelection()) {
                  return null;
                }
                
                return (
                  <DynamicFormField
                    key={field.key}
                    spec={field}
                    value={formValues[field.key]}
                    onChange={(value: any) => onInputChange(field.key, value)}
                    formValues={formValues}
                  />
                );
              })}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </TooltipProvider>
  );
};

export default EdgeConfiguration; 