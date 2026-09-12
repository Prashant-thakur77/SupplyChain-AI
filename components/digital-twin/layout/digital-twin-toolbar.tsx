"use client";

import { FC, useState, useEffect } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { useRouter } from 'next/navigation';
import SaveSupplyChainDialog from '../forms/SaveSupplyChainDialog';
import IntelligenceAnalysisDialog from '../IntelligenceAnalysisDialog';
import { Node, Edge } from 'reactflow';
import { Check } from 'lucide-react';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';

interface SimulationToolbarProps {
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
  viewOnly?: boolean;
}

const SimulationToolbar: FC<SimulationToolbarProps> = ({
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
  viewOnly = false,
}) => {
  // In view-only mode, hide the toolbar completely (no Save/Intelligence buttons)
  if (viewOnly) {
    return null;
  }

  const { isControlTowerMode, setControlTowerMode } = useDigitalTwinStore();

  // Check for URL parameters to detect if save dialog was previously opened
  const [nameParam] = useQueryState('saveName', parseAsString);
  const [descriptionParam] = useQueryState('saveDescription', parseAsString);
  
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [analysisSupplyChainId, setAnalysisSupplyChainId] = useState<string | null>(null);

  // Initialize input value
  useEffect(() => {
    const supplyChainOptions = {
      'default-chain': 'Default Supply Chain',
      'electronics-chain': 'Electronics Supply Chain',
      'automotive-chain': 'Automotive Supply Chain'
    };

    const defaultName = supplyChainOptions[selectedSupplyChain as keyof typeof supplyChainOptions] || selectedSupplyChain;
    setInputValue(defaultName);
    
    const finalName = nameParam || supplyChainName || defaultName;
    const finalDescription = descriptionParam || description || '';
    
    if (setSupplyChainName && supplyChainName !== finalName) {
      setSupplyChainName(finalName);
    }
    if (setDescription && description !== finalDescription) {
      setDescription(finalDescription);
    }
  }, [selectedSupplyChain, setSupplyChainName, setDescription, nameParam, descriptionParam, supplyChainName, description]);

  // Listen for global "supply_chain_saved" events
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ supplyChainId?: string }>;
      const id = customEvent.detail?.supplyChainId;
      if (id) {
        setAnalysisSupplyChainId(id);
        setIsDialogOpen(false);
      }
    };

    window.addEventListener('supply_chain_saved', handler as EventListener);
    return () => {
      window.removeEventListener('supply_chain_saved', handler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (analysisSupplyChainId) {
      setIsAnalysisDialogOpen(true);
    }
  }, [analysisSupplyChainId]);

  const handleSaveClick = () => {
    setIsDialogOpen(true);
  };

  const handleSaveSupplyChain = async (name: string, desc: string) => {
    setIsSaving(true);
    try {
      if (setSupplyChainName) {
        setSupplyChainName(name);
      }
      if (setDescription) {
        setDescription(desc);
      }
      setInputValue(name);

      const supplyChainId = await onSave(name, desc);

      if (supplyChainId) {
        setAnalysisSupplyChainId(supplyChainId);
        setIsDialogOpen(false);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="w-full h-auto sm:h-14 py-3 sm:py-0 bg-theme-bg-surface border-b border-theme-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 z-30 flex-shrink-0">
        {/* Left Section: Label + Mode Switcher */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-6">
          <span className="text-sm font-bold text-theme-text-primary tracking-tight uppercase hidden sm:block">Digital Twin</span>
          
          <div className="flex items-center bg-[#EFEBE3] dark:bg-[#191817] p-1 rounded-full border border-theme-border-subtle">
            <button
              onClick={() => setControlTowerMode(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                !isControlTowerMode
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold'
                  : 'bg-transparent text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              Design
            </button>
            <button
              onClick={() => setControlTowerMode(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                isControlTowerMode
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold'
                  : 'bg-transparent text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              Control Tower
            </button>
          </div>
        </div>

        {/* Right Section: Auto-save + Outlined Button */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A7F4B]">
            <Check className="w-4 h-4 stroke-[3px]" />
            <span className="hidden sm:inline">Auto-saved</span>
          </div>

          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-[#D6CFC4] hover:border-theme-text-primary text-theme-text-primary hover:bg-[#EFEBE3] dark:hover:bg-[#191817] transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save snapshot'}
          </button>
        </div>
      </div>

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

export default SimulationToolbar;