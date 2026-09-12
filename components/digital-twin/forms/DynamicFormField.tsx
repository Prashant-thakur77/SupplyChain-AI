import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { PropertySpec } from '@/lib/types/digital-twin';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import { MultiSelect } from '@/components/ui/multiselect';

interface DynamicFormFieldProps {
  spec: PropertySpec;
  value: any;
  onChange: (value: any) => void;
  formValues: any; // For checking dependencies
}

const DynamicFormField: FC<DynamicFormFieldProps> = ({ spec, value, onChange, formValues }) => {
  // Check if field should be shown based on dependencies
  const shouldShow = !spec.dependsOn || formValues[spec.dependsOn.key] === spec.dependsOn.value;

  const renderField = () => {
    switch (spec.type) {
      case 'string':
        return (
          <div className="p-0.5">
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 shadow-md"
              placeholder={`Enter ${spec.label.toLowerCase()}...`}
            />
          </div>
        );

      case 'number':
        return (
          <div className="p-0.5">
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              className="w-full px-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 shadow-md"
              placeholder="0"
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="p-0.5">
            <Textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 resize-none shadow-md"
              placeholder={`Enter ${spec.label.toLowerCase()}...`}
              rows={3}
            />
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm font-medium text-foreground">
                {spec.label}
                {spec.showInfoIcon && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Info className="inline-block w-4 h-4 ml-2 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-80 z-[9999] shadow-lg border bg-popover text-popover-foreground"
                      side="right"
                      sideOffset={8}
                      collisionPadding={16}
                      avoidCollisions={true}
                    >
                      <p className="text-sm font-normal text-muted-foreground whitespace-pre-line">{spec.infoText}</p>
                    </PopoverContent>
                  </Popover>
                )}
              </Label>
            </div>
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
            />
          </div>
        );

      case 'enum':
        return (
          <div className="p-0.5">
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger className="w-full px-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 shadow-md">
                <SelectValue placeholder={`Select ${spec.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {spec.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'country':
        return (
          <div className="p-0.5">
            <CountryDropdown
              defaultValue={value}
              onChange={(country) => onChange(country.alpha3)}
              placeholder={`Select ${spec.label.toLowerCase()}`}
            />
          </div>
        );

      case 'slider':
        const currentValue = value !== undefined ? value : (spec.defaultValue || spec.min || 0);
        return (
          <div className="p-0.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {spec.min || 0}
              </span>
              <div className="bg-primary/10 px-3 py-1 rounded-md">
                <span className="text-sm font-medium text-primary">
                  {currentValue}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {spec.max || 100}
              </span>
            </div>
            <Slider
              value={[currentValue]}
              onValueChange={(values) => onChange(values[0])}
              min={spec.min || 0}
              max={spec.max || 100}
              step={spec.step || 1}
              className="w-full"
            />
          </div>
        );

      case 'multiselect':
        const multiselectOptions = spec.options?.map(option => ({
          label: option,
          value: option
        })) || [];
        
        return (
          <div className="p-0.5">
            <MultiSelect
              options={multiselectOptions}
              onValueChange={(values) => onChange(values)}
              defaultValue={Array.isArray(value) ? value : []}
              placeholder={spec.placeholder || `Select ${spec.label.toLowerCase()}...`}
              className="w-full"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // For boolean fields, the label is handled inside the switch case
  if (spec.type === 'boolean') {
    return (
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {renderField()}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          <Label className="text-sm font-medium text-foreground">
            {spec.label}
            {spec.showInfoIcon && (
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="inline-block w-4 h-4 ml-2 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 z-[9999] shadow-lg border bg-popover text-popover-foreground"
                  side="right"
                  sideOffset={8}
                  collisionPadding={16}
                  avoidCollisions={true}
                >
                  <p className="text-sm font-normal text-muted-foreground whitespace-pre-line">{spec.infoText}</p>
                </PopoverContent>
              </Popover>
            )}
          </Label>
          {renderField()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DynamicFormField; 