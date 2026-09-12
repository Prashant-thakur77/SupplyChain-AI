'use client';
import * as React from 'react';
import { CheckIcon, XCircle, ChevronDown, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * An array of option objects to be displayed in the multi-select component.
   * Each option object has a label, value, and an optional icon.
   */
  options: {
    /** The text to display for the option. */
    label: string;
    /** The unique value associated with the option. */
    value: string;
    /** Optional icon component to display alongside the option. */
    icon?: React.ComponentType<{ className?: string }>;
    disable?: boolean;
    /** If true, this option is exclusive and selecting it will deselect all other options */
    exclusive?: boolean;
  }[];

  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void;

  /** The default selected values when the component mounts. */
  defaultValue?: string[];

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string;

  /**
   * Animation duration in seconds for the visual effects (e.g., bouncing badges).
   * Optional, defaults to 0 (no animation).
   */
  animation?: number;

  /**
   * Maximum number of items to display. Extra selected items will be summarized.
   * Optional, defaults to 3.
   */
  maxCount?: number;

  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean;

  /**
   * If true, renders the multi-select component as a child of another component.
   * Optional, defaults to false.
   */
  asChild?: boolean;

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string;
  popoverClass?: string;
  showall?: boolean;
}

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      defaultValue = [],
      placeholder = 'Select options',
      animation = 0,
      maxCount = 3,
      modalPopover = false,
      asChild = false,
      className,
      popoverClass,
      showall = false,
      ...props
    },
    ref
  ) => {
    const [selectedValues, setSelectedValues] =
      React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (event.key === 'Enter') {
        setIsPopoverOpen(true);
      } else if (event.key === 'Backspace' && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = (option: string) => {
      const selectedOption = options.find(opt => opt.value === option);
      const isExclusive = selectedOption?.exclusive;
      const hasExclusiveSelected = selectedValues.some(value => 
        options.find(opt => opt.value === value)?.exclusive
      );

      let newSelectedValues: string[];

      if (isExclusive) {
        // If selecting an exclusive option, clear all others and select only this one
        newSelectedValues = [option];
      } else if (hasExclusiveSelected && !isExclusive) {
        // If an exclusive option is already selected and we're trying to select a non-exclusive, ignore
        return;
      } else {
        // Normal multi-select behavior
        newSelectedValues = selectedValues.includes(option)
          ? selectedValues.filter((value) => value !== option)
          : [...selectedValues, option];
      }

      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      setSelectedValues([]);
      onValueChange([]);
    };

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev);
    };

    const clearExtraOptions = () => {
      const newSelectedValues = selectedValues.slice(0, maxCount);
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };
    const filteredOptions = options.filter((option) => !option.disable);
    const toggleAll = () => {
      const hasExclusiveSelected = selectedValues.some(value => 
        options.find(opt => opt.value === value)?.exclusive
      );
      
      // Don't allow toggle all if exclusive option is selected
      if (hasExclusiveSelected) return;
      
      if (selectedValues.length === filteredOptions.length) {
        handleClear();
      } else {
        const allValues = filteredOptions
          .filter(option => !option.exclusive) // Don't include exclusive options in "select all"
          .map((option) => option.value);
        setSelectedValues(allValues);
        onValueChange(allValues);
      }
    };

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={modalPopover}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            {...props}
            onClick={handleTogglePopover}
            className={cn(
              'flex w-full p-1 rounded-xl border min-h-10 h-auto items-center justify-between bg-background hover:bg-background dark:bg-gray-800 dark:border-gray-700',
              className
            )}
          >
            {selectedValues.length > 0 ? (
              <div className='flex justify-between items-center w-full'>
                <div className='flex items-center gap-1 p-1 overflow-x-auto overflow-y-hidden flex-1 min-h-0'>
                  {(showall
                    ? selectedValues
                    : selectedValues.slice(0, maxCount)
                  ).map((value) => {
                    const option = options.find((o) => o.value === value);
                    const IconComponent = option?.icon;
                    return (
                      <div
                        key={value}
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground flex-shrink-0'
                        )}
                      >
                        {IconComponent && (
                          <IconComponent className='h-3 w-3 mr-1' />
                        )}
                        <span className="truncate max-w-24">{option?.label}</span>
                        <XCircle
                          className='ml-1 h-3 w-3 cursor-pointer flex-shrink-0'
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleOption(value);
                          }}
                        />
                      </div>
                    );
                  })}
                  {!showall && selectedValues.length > maxCount && (
                    <div
                      className={cn(
                        'bg-primary-foreground inline-flex items-center border px-2 py-0.5 rounded-full text-foreground border-foreground/1 hover:bg-transparent flex-shrink-0'
                      )}
                      style={{ animationDuration: `${animation}s` }}
                    >
                      {`+ ${selectedValues.length - maxCount} more`}
                      <XCircle
                        className='ml-2 h-3 w-3 cursor-pointer'
                        onClick={(event) => {
                          event.stopPropagation();
                          clearExtraOptions();
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className='flex items-center justify-between flex-shrink-0'>
                  <XIcon
                    className='h-4 mx-2 cursor-pointer text-muted-foreground'
                    onClick={(event) => {
                      event.stopPropagation();
                      handleClear();
                    }}
                  />
                  {/* <Separator
                    orientation="vertical"
                    className="flex min-h-6 h-full"
                  /> */}
                  <ChevronDown className='h-4 mx-2 cursor-pointer text-muted-foreground' />
                </div>
              </div>
            ) : (
              <div className='flex items-center justify-between w-full mx-auto'>
                <span className='text-sm text-muted-foreground mx-3'>
                  {placeholder}
                </span>
                <ChevronDown className='h-4 cursor-pointer text-muted-foreground mx-2' />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('w-auto p-0', popoverClass)}
          align='start'
          onEscapeKeyDown={() => setIsPopoverOpen(false)}
        >
          <Command>
            <CommandInput
              placeholder='Search...'
              onKeyDown={handleInputKeyDown}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  key='all'
                  onSelect={toggleAll}
                  className='cursor-pointer'
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selectedValues.length === filteredOptions.length
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <CheckIcon className='h-4 w-4' />
                  </div>
                  <span>(Select All)</span>
                </CommandItem>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  const hasExclusiveSelected = selectedValues.some(value => 
                    options.find(opt => opt.value === value)?.exclusive
                  );
                  const isCurrentExclusive = option.exclusive;
                  
                  // Disable non-exclusive options when an exclusive option is selected
                  // or disable exclusive options when non-exclusive options are selected
                  const isDisabled = option.disable || 
                    (hasExclusiveSelected && !isCurrentExclusive && !isSelected) ||
                    (!hasExclusiveSelected && isCurrentExclusive && selectedValues.length > 0 && !isSelected);

                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => !isDisabled && toggleOption(option.value)}
                      className={cn(
                        'cursor-pointer',
                        isDisabled && 'opacity-50 cursor-not-allowed' // Disable styling
                      )}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        {!isDisabled && <CheckIcon className='h-4 w-4' />}
                      </div>
                      {option.icon && (
                        <option.icon
                          className={cn(
                            'mr-2 h-4 w-4',
                            isDisabled ? 'text-muted-foreground' : ''
                          )}
                        />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <div className='flex items-center justify-between'>
                  {selectedValues.length > 0 && (
                    <>
                      <CommandItem
                        onSelect={handleClear}
                        className='flex-1 justify-center cursor-pointer border-r'
                      >
                        Clear
                      </CommandItem>
                    </>
                  )}
                  <CommandItem
                    onSelect={() => setIsPopoverOpen(false)}
                    className='flex-1 justify-center cursor-pointer max-w-full'
                  >
                    Close
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';