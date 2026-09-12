import { FC } from 'react';
import { Node } from 'reactflow';
import { Accordion } from '@/components/ui/accordion';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  NodeTypeHeader,
  GeneralSection,
  LocationSection,
  RiskAssessmentSection,
  TypeSpecificSection,
  AppearanceSection
} from './node-configuration';

interface NodeConfigurationProps {
  selectedNode: Node;
  formValues: any;
  onInputChange: (field: string, value: any) => void;
  onMapCoordinatesChange: (lat: string, lng: string, address?: string) => void;
}

const NodeConfiguration: FC<NodeConfigurationProps> = ({
  selectedNode,
  formValues,
  onInputChange,
  onMapCoordinatesChange
}) => {
  console.log('formValues', formValues);
  // Get node type for dynamic properties
  const nodeType = formValues.type || '';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full space-y-4">
        {/* Node Type Header - Always visible at top */}
        <NodeTypeHeader nodeType={nodeType} />

        <Accordion type="multiple" defaultValue={[]} className="w-full">
          {/* General Section */}
          <GeneralSection 
            formValues={formValues}
            onInputChange={onInputChange}
          />

          {/* Location Section */}
          <LocationSection 
            formValues={formValues}
            onInputChange={onInputChange}
            onMapCoordinatesChange={onMapCoordinatesChange}
          />

          {/* Risk Assessment Section */}
          <RiskAssessmentSection 
            formValues={formValues}
            onInputChange={onInputChange}
          />

          {/* Type-Specific Properties Section */}
          <TypeSpecificSection 
            nodeType={nodeType}
            formValues={formValues}
            onInputChange={onInputChange}
          />

          {/* Appearance Section */}
          <AppearanceSection 
            formValues={formValues}
            selectedNode={selectedNode}
            onInputChange={onInputChange}
          />
        </Accordion>
      </div>
    </TooltipProvider>
  );
};

export default NodeConfiguration; 