import { FC, useState, useEffect } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { useRouter } from 'next/navigation';
import SaveSupplyChainDialog from '../forms/SaveSupplyChainDialog';
import IntelligenceAnalysisDialog from '../IntelligenceAnalysisDialog';
import FloatingSaveButton from './FloatingSaveButton';
import { Node, Edge } from 'reactflow';

interface DigitalTwinToolbarProps {
  selectedSupplyChain: string;
  setSelectedSupplyChain: (id: string) => void;
  onSave: (name?: string, desc?: string) => Promise<string | null>;
  simulationMode: boolean;
  setSimulationMode: (mode: boolean) => void;
  supplyChainName?: string;
  setSupplyChainName?: (name: string) => void;
  description?: string;
  setDescription?: (desc: string) => void;
  nodes: Node[];
  edges: Edge[];
}

const DigitalTwinToolbar: FC<DigitalTwinToolbarProps> = ({
  selectedSupplyChain,
  setSelectedSupplyChain,
  onSave,
  simulationMode,
  setSimulationMode,
  supplyChainName,
  setSupplyChainName,
  description,
  setDescription,
  nodes,
  edges,
}) => {
  // Check for URL parameters to detect if save dialog was previously opened
  const [nameParam] = useQueryState('saveName', parseAsString);
  const [descriptionParam] = useQueryState('saveDescription', parseAsString);
  
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [analysisSupplyChainId, setAnalysisSupplyChainId] = useState<string | null>(null);

  // Initialize input value with the label corresponding to the selected supply chain
  useEffect(() => {
    const supplyChainOptions = {
      'default-chain': 'Default Supply Chain',
      'electronics-chain': 'Electronics Supply Chain',
      'automotive-chain': 'Automotive Supply Chain'
    };

    const defaultName = supplyChainOptions[selectedSupplyChain as keyof typeof supplyChainOptions] || selectedSupplyChain;
    setInputValue(defaultName);
    
    // If there are URL params for save data, prioritize those, otherwise use current state or default
    const finalName = nameParam || supplyChainName || defaultName;
    const finalDescription = descriptionParam || description || '';
    
    if (setSupplyChainName && supplyChainName !== finalName) {
      setSupplyChainName(finalName);
    }
    if (setDescription && description !== finalDescription) {
      setDescription(finalDescription);
    }
  }, [selectedSupplyChain, setSupplyChainName, setDescription, nameParam, descriptionParam, supplyChainName, description]);

  // Listen for global "supply_chain_saved" events (dispatched by performSave)
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ supplyChainId?: string }>;
      const id = customEvent.detail?.supplyChainId;
      if (id) {
        setAnalysisSupplyChainId(id);
        setIsDialogOpen(false); // ensure save dialog closes if still open
      }
    };

    window.addEventListener('supply_chain_saved', handler as EventListener);
    return () => {
      window.removeEventListener('supply_chain_saved', handler as EventListener);
    };
  }, []);

  // NEW: Open the analysis dialog automatically when a valid supply chain id is available
  useEffect(() => {
    if (analysisSupplyChainId) {
      setIsAnalysisDialogOpen(true);
    }
  }, [analysisSupplyChainId]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (setSupplyChainName) {
      setSupplyChainName(e.target.value);
    }
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setDescription) {
      setDescription(e.target.value);
    }
  };

  // Handle save button click - opens dialog
  const handleSaveClick = () => {
    setIsDialogOpen(true);
  };

  // Handle actual save from dialog
  const handleSaveSupplyChain = async (name: string, desc: string) => {
    setIsSaving(true);
    try {
      // Update local state
      if (setSupplyChainName) setSupplyChainName(name);
      if (setDescription) setDescription(desc);
      setInputValue(name);
      
      // Call the original save function and retrieve the generated supply chain ID
      const supplyChainId = await onSave(name, desc);

      // If the backend returned a valid ID, store it so the effect can trigger
      // and close the save dialog.
      if (supplyChainId) {
        setAnalysisSupplyChainId(supplyChainId);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving supply chain:', error);
      throw error; // Re-throw to let dialog handle the error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Floating Save Button - always visible */}
      <FloatingSaveButton 
        onSave={handleSaveClick}
        disabled={simulationMode}
        isLoading={isSaving}
      />

      {/* Save Dialog */}
      <SaveSupplyChainDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveSupplyChain}
        initialName={supplyChainName || inputValue}
        initialDescription={description || ''}
        nodes={nodes}
        edges={edges}
      />
      <IntelligenceAnalysisDialog
        isOpen={isAnalysisDialogOpen}
        onClose={() => {
          setIsAnalysisDialogOpen(false);
          // Navigate to the new twinId URL AFTER the dialog closes,
          // so the canvas isn't unmounted while the dialog is still shown.
          if (analysisSupplyChainId) {
            router.push(`/digital-twin?twinId=${analysisSupplyChainId}`);
          }
          setAnalysisSupplyChainId(null);
        }}
        supplyChainId={analysisSupplyChainId}
      />
    </>
  );
};

export default DigitalTwinToolbar; 