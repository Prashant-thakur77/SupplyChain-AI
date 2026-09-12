'use client';

import { FC, useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CopilotTextarea } from '@copilotkit/react-textarea';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SaveSupplyChainDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  nodes: Node[];
  edges: Edge[];
}

interface FormErrors {
  name?: string;
  description?: string;
}

const SaveSupplyChainDialog: FC<SaveSupplyChainDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialDescription = '',
  nodes,
  edges,
}) => {
  // Pure local state — no nuqs URL sync to avoid full page re-renders killing the dialog
  const [name, setName] = useState(initialName || 'Default Supply Chain');
  const [description, setDescription] = useState(initialDescription || '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName || 'Default Supply Chain');
      setDescription(initialDescription || '');
      setErrors({});
      setIsLoading(false);
    }
  }, [isOpen, initialName, initialDescription]);

  const supplyChainContext = useMemo(() => {
    const context = {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodeTypes: Array.from(new Set(nodes.map(n => n.data.type))),
      countries: Array.from(new Set(nodes.map(n => n.data.country).filter(Boolean))),
    };
    return JSON.stringify(context, null, 2);
  }, [nodes, edges]);

  const autosuggestionsConfig = useMemo(() => ({
    textareaPurpose:
      'Generate a detailed summary for a supply chain. ' +
      'Use the following context to inform the description: ' +
      supplyChainContext,
    chatApiConfigs: { suggestionsApiConfig: {} },
  }), [supplyChainContext]);

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Supply chain name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Supply chain name must be at least 3 characters';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Supply chain name must be less than 50 characters';
    }

    if (description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save action
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(name.trim(), description.trim());
      // Dialog close is handled by the parent after save completes
      handleClose();
    } catch (error) {
      toast.error('Failed to save supply chain. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    setName(initialName || '');
    setDescription(initialDescription || '');
    setErrors({});
    setIsLoading(false);
    onClose();
  };

  // Handle key press events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  // Handle input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-full mx-4 p-6 rounded-xl shadow-2xl bg-blue-50/80 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/60 top-20 translate-y-0">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-50">
            Save Supply Chain
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Provide a name and description for your supply chain configuration. 
            This will help you identify and manage it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Supply Chain Name Input */}
          <div className="space-y-2">
            <label htmlFor="supply-chain-name" className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Supply Chain Name *
            </label>
            <Input
              id="supply-chain-name"
              type="text"
              placeholder="e.g., Global Electronics Supply Chain"
              value={name}
              onChange={handleNameChange}
              onKeyPress={handleKeyPress}
              className={cn(
                'border border-gray-300 text-sm p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700',
                {
                  'border-red-500 focus-visible:ring-red-500': errors.name,
                }
              )}
              maxLength={50}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {name.length}/50 characters
            </p>
          </div>

          {/* Supply Chain Description Textarea */}
          <div className="space-y-2">
            <label htmlFor="supply-chain-description" className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Description
            </label>
            <CopilotTextarea
              id="supply-chain-description"
              placeholder="Describe your supply chain configuration, key components, and objectives..."
              value={description}
              onValueChange={setDescription}
              className={cn(
                'border border-gray-300 h-[100px] resize-none text-sm p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 scrollbar-hide',
                {
                  'border-red-500 focus-visible:ring-red-500': errors.description,
                }
              )}
              maxLength={500}
              disabled={isLoading}
              autosuggestionsConfig={autosuggestionsConfig}
            />
            {errors.description && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                {errors.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1 text-sm py-2 px-4 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="w-full sm:w-auto order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-sm py-2 px-4 rounded-lg shadow-md"
          >
            <Save className="w-5 h-5 mr-2.5" />
            {isLoading ? 'Saving...' : 'Save Supply Chain'}
          </Button>
        </DialogFooter>

        <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-3">
          Press Ctrl + Enter to save quickly
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSupplyChainDialog;