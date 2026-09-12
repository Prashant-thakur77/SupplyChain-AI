import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import DynamicFormField from '@/components/digital-twin/forms/DynamicFormField';
import { NODE_PROPERTY_SPECS, NODE_TYPE_MAP } from '@/constants/digital-twin';
import { NodeType } from '@/lib/types/digital-twin';

interface TypeSpecificSectionProps {
  nodeType: string;
  formValues: any;
  onInputChange: (field: string, value: any) => void;
}

const TypeSpecificSection: React.FC<TypeSpecificSectionProps> = ({ 
  nodeType, 
  formValues, 
  onInputChange 
}) => {
  // Get node type for dynamic properties
  const mappedNodeType: NodeType | undefined = NODE_TYPE_MAP[nodeType];
  const propertySpecs = mappedNodeType ? NODE_PROPERTY_SPECS[mappedNodeType] : [];

  // Don't render if no properties
  if (propertySpecs.length === 0) {
    return null;
  }

  return (
    <AccordionItem value="type-specific">
      <AccordionTrigger className="text-sm font-medium">
        {nodeType} Properties
      </AccordionTrigger>
      <AccordionContent className="space-y-4">
        {propertySpecs.map((spec) => (
          <DynamicFormField
            key={spec.key}
            spec={spec}
            value={formValues[spec.key]}
            onChange={(value) => onInputChange(spec.key, value)}
            formValues={formValues}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
};

export default TypeSpecificSection; 