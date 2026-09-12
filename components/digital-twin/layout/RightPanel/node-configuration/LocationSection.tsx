import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import AddressAutocompleteMap from '@/components/ui/AutoComplete';

interface LocationSectionProps {
  formValues: any;
  onInputChange: (field: string, value: any) => void;
  onMapCoordinatesChange: (lat: string, lng: string, address?: string) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({ 
  formValues, 
  onInputChange, 
  onMapCoordinatesChange 
}) => {
  return (
    <AccordionItem value="location">
      <AccordionTrigger className="text-sm font-medium">
        Location
      </AccordionTrigger>
      <AccordionContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Country</Label>
          <div className="p-0.5">
            <CountryDropdown
              defaultValue={formValues.location?.country}
              onChange={(country) => onInputChange('location', {
                ...formValues.location,
                country: country.alpha3,
                countryName: country.name
              })}
              placeholder="Select country..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Address & Coordinates</Label>
          <AddressAutocompleteMap
            onCoordinatesChange={onMapCoordinatesChange}
            initialAddress={formValues.address || ''}
            initialLat={formValues.location?.lat || ''}
            initialLng={formValues.location?.lng || ''}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default LocationSection; 