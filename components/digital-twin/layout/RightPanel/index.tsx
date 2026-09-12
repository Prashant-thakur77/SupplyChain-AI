"use client";

import { FC, useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  Trash2, 
  MapPin, 
  Activity, 
  ShieldAlert, 
  Check, 
  Package, 
  Anchor, 
  Factory, 
  Warehouse, 
  Route, 
  Store 
} from 'lucide-react';
import Cookies from 'js-cookie';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import EdgeConfiguration from './EdgeConfiguration';
import SaveStatusIndicator from './SaveStatusIndicator';
import EmptyState from './EmptyState';
import CollapsedState from './CollapsedState';
import { RightPanelProps, SaveStatus } from './types';
import { panelVariants, contentVariants, iconVariants } from './animations';
import { createDebouncedSave, isNodeElement } from './functions';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';
import { useDisruptionSimulation } from '@/components/digital-twin/canvas/hooks/useDisruptionSimulation';
import { toast } from 'sonner';
import AddressAutocompleteMap from '@/components/ui/AutoComplete';

// Helper to resolve node type metadata
const getTypeConfig = (typeStr: string, isDisrupted: boolean) => {
  const normType = (typeStr || '').toLowerCase();
  if (normType.includes('supplier')) {
    return { label: 'SUPPLIER', icon: Package, colorClass: 'text-[#2748E8] border-[#2748E8]', colorHex: '#2748E8' };
  }
  if (normType.includes('port')) {
    return { label: 'PORT', icon: Anchor, colorClass: 'text-[#1A7F4B] border-[#1A7F4B]', colorHex: '#1A7F4B' };
  }
  if (normType.includes('factory') || normType.includes('manufacturer') || normType.includes('production')) {
    return { label: 'FACTORY', icon: Factory, colorClass: 'text-[#B45309] border-[#B45309]', colorHex: '#B45309' };
  }
  if (normType.includes('warehouse')) {
    return { label: 'WAREHOUSE', icon: Warehouse, colorClass: 'text-[#7C3AED] border-[#7C3AED]', colorHex: '#7C3AED' };
  }
  if (normType.includes('distribution')) {
    return { label: 'DISTRIBUTION', icon: Route, colorClass: 'text-[#B91C1C] border-[#B91C1C]', colorHex: '#B91C1C' };
  }
  if (normType.includes('retail') || normType.includes('customer')) {
    return { 
      label: 'RETAILER', 
      icon: Store, 
      colorClass: isDisrupted ? 'text-[#B91C1C] border-[#B91C1C]' : 'text-[#6B7280] border-[#6B7280]', 
      colorHex: isDisrupted ? '#B91C1C' : '#6B7280' 
    };
  }
  return { label: 'WAREHOUSE', icon: Warehouse, colorClass: 'text-[#7C3AED] border-[#7C3AED]', colorHex: '#7C3AED' };
};

const RightPanel: FC<RightPanelProps> = ({ 
  selectedElement, 
  onUpdate, 
  onDelete, 
  onUngroup, 
  onAnalyzeNode,
  nodes = [], 
  onSave 
}) => {
  const [formValues, setFormValues] = useState<any>({});
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [shouldSkipConfirmation, setShouldSkipConfirmation] = useState(false);

  const { edges, disruptedNodes } = useDigitalTwinStore();
  const { simulateDisruption, clearDisruptions } = useDisruptionSimulation();
  
  // Create debounced save function
  const { debouncedSave } = createDebouncedSave(onSave, setSaveStatus);

  // Check cookie on component mount
  useEffect(() => {
    const skipConfirmation = Cookies.get('deleteNodeSkipConfirmation') === 'true';
    setShouldSkipConfirmation(skipConfirmation);
  }, []);

  // Update form values when selected element changes
  useEffect(() => {
    if (selectedElement) {
      setFormValues(selectedElement.data || {});
      setSaveStatus('saved'); 
      setIsCollapsed(false); // Automatically expand the panel when an element is selected
    } else {
      setFormValues({});
      setSaveStatus('saved');
    }
  }, [selectedElement]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Handle delete action
  const handleDelete = () => {
    if (selectedElement && onDelete) {
      if (dontAskAgain) {
        Cookies.set('deleteNodeSkipConfirmation', 'true', { 
          expires: 365, 
          path: '/' 
        });
      }
      onDelete(selectedElement.id);
    }
  };

  // Handle direct delete without confirmation
  const handleDirectDelete = () => {
    if (selectedElement && onDelete) {
      onDelete(selectedElement.id);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    const updatedFormValues = {
      ...formValues,
      [field]: value
    };
    
    setFormValues(updatedFormValues);
    
    if (saveStatus !== 'unsaved') {
      setSaveStatus('unsaved');
    }
    
    if (selectedElement) {
      const updatedElement = {
        ...selectedElement,
        data: {
          ...selectedElement.data,
          ...updatedFormValues
        }
      };
      onUpdate(updatedElement);
    }

    debouncedSave();
  };

  // Determine if we're dealing with a node or edge
  const isNode = isNodeElement(selectedElement);

  // Collapsed state
  if (isCollapsed) {
    return (
      <CollapsedState
        selectedElement={selectedElement as Node | null}
        formValues={formValues}
        onExpand={() => setIsCollapsed(false)}
        onDelete={onDelete}
      />
    );
  }

  // Empty state - no element selected
  if (!selectedElement) {
    return (
      <motion.div 
        className="border-l border-theme-border-subtle bg-theme-bg-surface flex flex-col h-full overflow-hidden w-[300px] flex-shrink-0 z-20 lg:relative absolute right-0 top-0 shadow-lg lg:shadow-none"
        variants={panelVariants}
        animate="expanded"
        initial={false}
      >
        <EmptyState onCollapse={() => setIsCollapsed(true)} />
      </motion.div>
    );
  }

  // Render node or edge configurations
  const isNodeDisrupted = disruptedNodes.includes(selectedElement.id);
  const nodeType = selectedElement.data?.nodeType || 'warehouse';
  const typeConfig = getTypeConfig(nodeType, isNodeDisrupted);
  const TypeIcon = typeConfig.icon;

  const riskScore = formValues.riskScore || 0;
  const isHighRisk = riskScore >= 0.7 || 
                     formValues.riskLevel === 'High' || 
                     formValues.riskLevel === 'HIGH' || 
                     (nodeType === 'retailer' && isNodeDisrupted);

  const isWatch = (riskScore >= 0.4 && riskScore < 0.7) || 
                  formValues.riskLevel === 'Medium' || 
                  formValues.riskLevel === 'Watch';

  // Find connections
  const connectedEdges = edges.filter(e => e.source === selectedElement.id || e.target === selectedElement.id);
  const connections = connectedEdges.map(e => {
    const isSource = e.source === selectedElement.id;
    const connectedNodeId = isSource ? e.target : e.source;
    const connectedNode = nodes.find(n => n.id === connectedNodeId);
    const connType = connectedNode?.data?.nodeType || 'warehouse';
    const connConfig = getTypeConfig(connType, false);
    return {
      id: connectedNodeId,
      label: connectedNode?.data?.label || connectedNodeId,
      icon: connConfig.icon,
      colorHex: connConfig.colorHex,
      direction: isSource ? 'Outgoing' : 'Incoming'
    };
  });

  return (
    <motion.div 
      className="border-l border-theme-border-subtle bg-theme-bg-surface flex flex-col h-full overflow-hidden w-[300px] flex-shrink-0 z-20 lg:relative absolute right-0 top-0 shadow-lg lg:shadow-none"
      variants={panelVariants}
      animate="expanded"
      initial={false}
      style={{ position: 'relative' }}
    >
      {/* Header Container */}
      <motion.div 
        className="flex-shrink-0 p-5 border-b border-theme-border-subtle bg-theme-bg-surface space-y-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-theme-text-muted uppercase tracking-wider">Properties</h3>
          <SaveStatusIndicator saveStatus={saveStatus} />
        </div>

        {isNode ? (
          /* Custom Node Header */
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TypeIcon className="w-4 h-4" style={{ color: typeConfig.colorHex }} />
                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: typeConfig.colorHex }}>
                  {typeConfig.label}
                </span>
              </div>
              
              {/* Trash/Delete Action */}
              {selectedElement.type !== 'group' && onDelete && (
                shouldSkipConfirmation ? (
                  <button
                    onClick={handleDirectDelete}
                    className="text-[#B91C1C] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1515] p-1.5 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-[#B91C1C] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1515] p-1.5 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-theme-bg-surface border-theme-border-subtle text-theme-text-primary rounded-theme-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-bold text-base">Delete Node</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 text-xs text-theme-text-secondary font-medium">
                          <div>
                            Are you sure you want to delete "{formValues.label || selectedElement.id}"? This action cannot be undone and will also remove all connected edges.
                          </div>
                          <div className="flex items-center space-x-2 pt-4">
                            <Checkbox 
                               id="dont-ask-again" 
                               checked={dontAskAgain}
                               onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
                               className="border-theme-border-subtle rounded-sm"
                            />
                            <label 
                              htmlFor="dont-ask-again" 
                              className="text-xs text-theme-text-secondary cursor-pointer select-none font-medium"
                            >
                              Don't ask again
                            </label>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-theme-border-subtle text-theme-text-secondary hover:bg-theme-bg-secondary/50 rounded-theme-md">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-theme-red text-white hover:bg-theme-red/90 rounded-theme-md">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              )}
            </div>

            {/* Editable Node Name */}
            <input
              type="text"
              value={formValues.label || ''}
              onChange={(e) => handleInputChange('label', e.target.value)}
              placeholder="Unnamed Node"
              className="text-base font-bold bg-transparent border-b border-transparent hover:border-theme-border-subtle focus:border-theme-text-primary focus:ring-0 outline-none w-full text-theme-text-primary p-0 m-0 transition-colors"
            />
          </div>
        ) : (
          /* Edge Title */
          <p className="text-xs text-theme-text-secondary font-medium pt-2">
            Editing Edge: <span className="font-semibold text-theme-blue">{formValues.label || selectedElement.id}</span>
          </p>
        )}
      </motion.div>
      
      {/* Scrollable Content */}
      <motion.div 
        className="flex-1 overflow-y-auto pr-1"
        variants={contentVariants}
        animate="visible"
        initial="hidden"
        style={{ position: 'relative' }}
      >
        <div className="p-5 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedElement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {isNode ? (
                /* REDESIGNED FLAT NODE LAYOUT */
                <>
                  {/* 1. RISK ASSESSMENT */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block">RISK ASSESSMENT</span>
                    
                    <div className="flex gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                        isNodeDisrupted 
                          ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#B91C1C]/20' 
                          : 'bg-[#EDFAF3] text-[#1A7F4B] border border-[#1A7F4B]/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isNodeDisrupted ? 'bg-[#B91C1C]' : 'bg-[#1A7F4B]'}`} />
                        {isNodeDisrupted ? 'Disrupted' : 'Healthy'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isHighRisk 
                          ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#B91C1C]/20' 
                          : isWatch 
                            ? 'bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/20'
                            : 'bg-[#EDFAF3] text-[#1A7F4B] border border-[#1A7F4B]/20'
                      }`}>
                        {isHighRisk ? 'High Risk' : isWatch ? 'Medium Risk' : 'Low Risk'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-theme-text-primary">
                        <span>Risk Score</span>
                        <span>{Math.round(riskScore * 100)} / 100</span>
                      </div>
                      <div className="w-full bg-[#EFEBE3] dark:bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-[#B91C1C] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round(riskScore * 100)}%` }}
                        />
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(riskScore * 100)}
                        onChange={(e) => handleInputChange('riskScore', parseFloat(e.target.value) / 100)}
                        className="w-full h-1 bg-[#EFEBE3] dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                      />
                    </div>
                  </div>

                  {/* 2. LOCATION */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block">LOCATION</span>
                    <AddressAutocompleteMap
                      onCoordinatesChange={(lat, lng, addr) => {
                        const updatedLocation = {
                          ...formValues.location,
                          lat,
                          lng
                        };
                        const updatedFormValues = {
                          ...formValues,
                          address: addr,
                          location: updatedLocation
                        };
                        setFormValues(updatedFormValues);
                        
                        if (saveStatus !== 'unsaved') {
                          setSaveStatus('unsaved');
                        }
                        
                        if (selectedElement) {
                          const updatedElement = {
                            ...selectedElement,
                            data: {
                              ...selectedElement.data,
                              ...updatedFormValues
                            }
                          };
                          onUpdate(updatedElement);
                        }
                        debouncedSave();
                      }}
                      initialAddress={formValues.address || ''}
                      initialLat={formValues.location?.lat || ''}
                      initialLng={formValues.location?.lng || ''}
                    />
                  </div>

                  {/* 3. CONNECTIONS */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block">CONNECTIONS</span>
                    {connections.length > 0 ? (
                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                        {connections.map((conn, idx) => {
                          const ConnIcon = conn.icon;
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 bg-[#EFEBE3] dark:bg-[#191817] rounded-lg border border-theme-border-subtle text-xs font-semibold">
                              <div className="flex items-center gap-2 truncate">
                                <ConnIcon className="w-4 h-4" style={{ color: conn.colorHex }} />
                                <span className="text-theme-text-primary truncate">{conn.label}</span>
                              </div>
                              <span className="text-[9px] font-medium text-theme-text-secondary bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                {conn.direction}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-theme-text-muted italic">No connected nodes</div>
                    )}
                  </div>
                </>
              ) : (
                /* REGULAR EDGE PROPERTIES CONFIGURATION */
                <EdgeConfiguration
                  selectedEdge={selectedElement as Edge}
                  formValues={formValues}
                  onInputChange={handleInputChange}
                  sourceNode={nodes.find(node => node.id === (selectedElement as Edge).source)}
                  targetNode={nodes.find(node => node.id === (selectedElement as Edge).target)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Fixed Bottom Section */}
      <motion.div 
        className="flex-shrink-0 p-5 border-t border-theme-border-subtle bg-theme-bg-surface space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        {isNode && selectedElement.type === 'group' && selectedElement.data.isTemplate && onUngroup && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUngroup(selectedElement.id)}
            className="w-full text-theme-blue border-theme-blue/20 hover:bg-theme-blue/10 hover:border-theme-blue/30 font-semibold text-xs rounded-theme-md"
          >
            <span className="mr-2">⚡</span>
            Ungroup Template
          </Button>
        )}

        {isNode && selectedElement.type !== 'group' && (
          /* REDESIGNED NODE ACTIONS BOTTOM BUTTONS */
          <div className="space-y-2">
            <button
              onClick={() => {
                if (onAnalyzeNode) {
                  onAnalyzeNode(selectedElement.id, formValues.label || selectedElement.id);
                  toast.success("AI Analysis Started", {
                    description: "Opening Copilot Assistant to analyze this node..."
                  });
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#EFEBE3] dark:bg-[#191817] hover:bg-[#D6CFC4] dark:hover:bg-[#2A2825] text-theme-text-primary text-xs font-semibold rounded-lg border border-theme-border-subtle transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              Analyse this node
            </button>

            {isNodeDisrupted ? (
              <button
                onClick={clearDisruptions}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#EDFAF3] hover:bg-[#EDFAF3]/80 text-[#1A7F4B] text-xs font-semibold rounded-lg border border-[#1A7F4B]/20 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Clear disruption
              </button>
            ) : (
              <button
                onClick={() => simulateDisruption(selectedElement.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#EFEBE3] dark:bg-[#191817] hover:bg-[#D6CFC4] dark:hover:bg-[#2A2825] text-[#B91C1C] text-xs font-semibold rounded-lg border border-[#B91C1C]/20 hover:border-[#B91C1C]/40 transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Simulate disruption
              </button>
            )}
          </div>
        )}
        
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-theme-md hover:bg-theme-bg-secondary/50 transition-colors group border-none bg-transparent outline-none focus:outline-none"
          title="Collapse Properties Panel"
        >
          <span className="text-xs text-theme-text-secondary group-hover:text-theme-text-primary font-semibold select-none">Hide Panel</span>
          <ChevronLeft className="h-4 w-4 text-theme-text-secondary group-hover:text-theme-text-primary transition-colors" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default RightPanel;