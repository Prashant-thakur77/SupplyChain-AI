import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import DynamicFormField from '@/components/digital-twin/forms/DynamicFormField';
import { COMMON_RISK_FIELDS } from '@/constants/digital-twin';

interface RiskAssessmentSectionProps {
  formValues: any;
  onInputChange: (field: string, value: any) => void;
}

const RiskAssessmentSection: React.FC<RiskAssessmentSectionProps> = ({ 
  formValues, 
  onInputChange 
}) => {
  return (
    <AccordionItem value="risk-assessment">
      <AccordionTrigger className="text-sm font-medium">
        Risk Assessment
      </AccordionTrigger>
      <AccordionContent className="space-y-4">
        {COMMON_RISK_FIELDS.map((spec) => (
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

export default RiskAssessmentSection; 