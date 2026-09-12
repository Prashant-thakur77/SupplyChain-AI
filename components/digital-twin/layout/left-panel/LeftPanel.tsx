"use client";

import { FC, useState } from 'react';
import { useQueryState } from 'nuqs';
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  MessageSquare, 
  GitBranch, 
  Package, 
  Anchor, 
  Factory, 
  Warehouse, 
  Route, 
  Store, 
  Sparkles, 
  Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SUPPLY_CHAIN_TEMPLATES } from '@/constants/digital-twin';
import { AIChatPanel } from './assistant';

interface LeftPanelProps {
  onAddNode: (nodeType: string, label: string, enhancedData?: any) => void;
  onAddNodeAtPosition?: (nodeType: string, position: { x: number; y: number }, label?: string, enhancedData?: any) => void;
  onClearAllNodes: () => void;
  onLoadTemplate?: (templateId: string) => void;
  onLoadTemplateAtPosition?: (templateId: string, position: { x: number, y: number }) => void;
  simulationMode: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  // CopilotKit integration props
  nodes?: any[];
  edges?: any[];
  onAddMultipleNodes?: (nodes: any[]) => void;
  onAddMultipleEdges?: (edges: any[]) => void;
  onAddEdges?: (edges: any[]) => void;
  onUpdateNode?: (nodeId: string, updates: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onUpdateEdge?: (edgeId: string, updates: any) => void;
  onValidateSupplyChain?: () => void;
  onUpdateMultipleNodes?: (nodeIds: string[], properties: object) => void;
  onUpdateNodePositions?: (nodePositions: { [nodeId: string]: { x: number; y: number } }) => void;
  onFindAndSelectNode?: (nodeId: string) => void;
  onFindAndSelectEdges?: (edgeIds: string[]) => void;

  onHighlightNodes?: (nodeIds: string[]) => void;
  onFocusNode?: (nodeId: string) => void;
  onZoomToNodes?: (nodeIds: string[]) => void;
  onGetNodeConnections?: (nodeId: string) => any[];
  onAnalyzeNetworkPaths?: (sourceId: string, targetId: string) => void;
  onBulkUpdateEdges?: (edgeIds: string[], properties: object) => void;
  onCreateNodeGroup?: (nodeIds: string[], groupName: string) => void;
  onExportSubgraph?: (nodeIds: string[]) => void;
  pendingAIMessage?: string | null;
  setPendingAIMessage?: (message: string | null) => void;
  
  // Custom Selector props
  supplyChainName?: string;
  selectedSupplyChain?: string;
  setSelectedSupplyChain?: (id: string) => void;
}

const LeftPanel: FC<LeftPanelProps> = ({ 
  onAddNode,
  onAddNodeAtPosition,
  onClearAllNodes, 
  onLoadTemplate, 
  onLoadTemplateAtPosition,
  simulationMode, 
  isCollapsed, 
  setIsCollapsed,
  nodes = [],
  edges = [],
  onAddMultipleNodes,
  onAddMultipleEdges,
  onAddEdges,
  onUpdateNode,
  onDeleteNode,
  onUpdateEdge,
  onValidateSupplyChain,
  onUpdateMultipleNodes,
  onUpdateNodePositions,
  onFindAndSelectNode,
  onFindAndSelectEdges,

  onHighlightNodes,
  onFocusNode,
  onZoomToNodes,
  onGetNodeConnections,
  onAnalyzeNetworkPaths,
  onBulkUpdateEdges,
  onCreateNodeGroup,
  onExportSubgraph,
  pendingAIMessage,
  setPendingAIMessage,
  
  supplyChainName,
  selectedSupplyChain,
  setSelectedSupplyChain,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [chatMode, setChatMode] = useQueryState('chat');

  const isImmersiveMode = chatMode === 'immersive';

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    
    const target = event.target as HTMLElement;
    target.style.opacity = '0.6';
    target.style.transform = 'scale(0.95)';
  };

  const onDragEnd = (event: React.DragEvent) => {
    const target = event.target as HTMLElement;
    target.style.opacity = '1';
    target.style.transform = 'scale(1)';
  };

  const onTemplateDragStart = (event: React.DragEvent, templateId: string) => {
    event.dataTransfer.setData('application/reactflow-template', templateId);
    event.dataTransfer.effectAllowed = 'move';

    const target = event.target as HTMLElement;
    target.style.opacity = '0.6';
    target.style.transform = 'scale(0.95)';
  };

  const handleImmersiveModeChange = (immersive: boolean) => {
    setChatMode(immersive ? 'immersive' : null);
  };

  const supplyChainOptions = [
    { id: 'default-chain', name: 'Default Supply Chain' },
    { id: 'electronics-chain', name: 'Electronics Supply Chain' },
    { id: 'automotive-chain', name: 'Automotive Supply Chain' }
  ];

  const nodeTypesToRender = [
    { id: 'Supplier', label: 'Supplier', icon: Package, color: 'text-[#2748E8] border-[#2748E8]' },
    { id: 'Port', label: 'Port', icon: Anchor, color: 'text-[#1A7F4B] border-[#1A7F4B]' },
    { id: 'Factory', label: 'Factory', icon: Factory, color: 'text-[#B45309] border-[#B45309]' },
    { id: 'Warehouse', label: 'Warehouse', icon: Warehouse, color: 'text-[#7C3AED] border-[#7C3AED]' },
    { id: 'Distribution', label: 'Distribution', icon: Route, color: 'text-[#B91C1C] border-[#B91C1C]' },
    { id: 'Retailer', label: 'Retail', icon: Store, color: 'text-[#6B7280] border-[#6B7280]' }
  ];

  return (
    <motion.div 
      className="h-full border-r border-theme-border-subtle bg-theme-bg-surface flex flex-col z-20 flex-shrink-0 lg:relative absolute left-0 top-0 shadow-lg lg:shadow-none"
      initial={false}
      animate={{ 
        width: isCollapsed ? 48 : 320 
      }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0.0, 0.2, 1] 
      }}
    >
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="w-full h-full flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center">
              <motion.div 
                className="text-[10px] text-theme-text-secondary font-[700] uppercase tracking-widest select-none"
                style={{ 
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed'
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                Supply Chain Builder
              </motion.div>
            </div>
            
            <div className="mt-auto border-t border-theme-border-subtle">
              <motion.button
                onClick={() => {
                  setIsCollapsed(false);
                  handleImmersiveModeChange(true);
                }}
                className="w-full p-4 hover:bg-theme-bg-secondary/50 transition-colors group flex items-center justify-center"
                title="Supply Chain Assistant"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageSquare className="h-5 w-5 text-theme-text-secondary group-hover:text-theme-blue transition-colors" />
              </motion.button>
              <motion.button
                onClick={() => setIsCollapsed(false)}
                className="w-full p-4 hover:bg-theme-bg-secondary/50 transition-colors group flex items-center justify-center border-t border-theme-border-subtle"
                title="Expand Builder Panel"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="h-5 w-5 text-theme-text-secondary group-hover:text-theme-blue transition-colors" />
              </motion.button>
            </div>
          </motion.div>
        ) : isImmersiveMode ? (
          <motion.div
            key="immersive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="w-full h-full"
          >
            <AIChatPanel 
              simulationMode={simulationMode}
              onImmersiveModeChange={handleImmersiveModeChange}
              isImmersiveMode={true}
              onCollapse={() => setIsCollapsed(true)}
              nodes={nodes}
              edges={edges}
              onAddNode={onAddNode}
              onAddNodeAtPosition={onAddNodeAtPosition}
              onAddMultipleNodes={onAddMultipleNodes}
              onAddMultipleEdges={onAddMultipleEdges}
              onAddEdges={onAddEdges}
              onLoadTemplate={onLoadTemplate}
              onClearCanvas={onClearAllNodes}
              onUpdateNode={onUpdateNode}
              onUpdateEdge={onUpdateEdge}
              onValidateSupplyChain={onValidateSupplyChain}
              onUpdateMultipleNodes={onUpdateMultipleNodes}
              onUpdateNodePositions={onUpdateNodePositions}
              onFindAndSelectNode={onFindAndSelectNode}
              onFindAndSelectEdges={onFindAndSelectEdges}
              onDeleteNode={onDeleteNode}

              onHighlightNodes={onHighlightNodes}
              onFocusNode={onFocusNode}
              onZoomToNodes={onZoomToNodes}
              onGetNodeConnections={onGetNodeConnections}
              onAnalyzeNetworkPaths={onAnalyzeNetworkPaths}
              onBulkUpdateEdges={onBulkUpdateEdges}
              onCreateNodeGroup={onCreateNodeGroup}
              onExportSubgraph={onExportSubgraph}
              pendingAIMessage={pendingAIMessage}
              setPendingAIMessage={setPendingAIMessage}
            />
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="w-full flex flex-col h-full bg-theme-bg-surface p-4"
          >
            {/* Supply Chain Selection Dropdown */}
            <div className="relative mb-5 flex-shrink-0">
              <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1.5">SUPPLY CHAIN</label>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-theme-bg-surface border border-theme-border-subtle rounded-lg text-xs font-semibold text-theme-text-primary hover:bg-[#EFEBE3] dark:hover:bg-[#191817] transition-all"
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-theme-text-secondary" />
                  <span className="truncate">{supplyChainName || 'Select Supply Chain'}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-theme-text-secondary" />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-theme-bg-surface border border-theme-border-subtle rounded-lg shadow-md py-1 z-50">
                  {supplyChainOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSelectedSupplyChain?.(option.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-theme-text-primary hover:bg-[#EFEBE3] dark:hover:bg-[#191817] transition-colors"
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable Content (Add Nodes and Templates) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              {/* Add Nodes Section */}
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-2">ADD NODES</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {nodeTypesToRender.map(node => {
                    const NodeIcon = node.icon;
                    return (
                      <button
                        key={node.id}
                        onClick={() => onAddNode(node.id, `New ${node.id}`)}
                        onDragStart={(event) => onDragStart(event, node.id)}
                        onDragEnd={onDragEnd}
                        draggable={!simulationMode}
                        disabled={simulationMode}
                        className="flex flex-col items-center justify-center p-3.5 bg-theme-bg-surface border border-theme-border-subtle rounded-xl hover:border-theme-border-default hover:scale-[1.02] active:scale-95 transition-all cursor-grab active:cursor-grabbing shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <NodeIcon className={`w-5.5 h-5.5 mb-2 ${node.color.split(' ')[0]}`} />
                        <span className="text-xs font-semibold text-theme-text-primary">{node.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Templates Section */}
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-2">TEMPLATES</label>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {SUPPLY_CHAIN_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => onLoadTemplate?.(template.id)}
                      onDragStart={(event) => onTemplateDragStart(event, template.id)}
                      onDragEnd={onDragEnd}
                      draggable={!simulationMode}
                      disabled={simulationMode || !onLoadTemplate}
                      className="w-full flex items-center justify-between p-2.5 bg-theme-bg-surface border border-theme-border-subtle rounded-lg hover:bg-[#EFEBE3] dark:hover:bg-[#191817] hover:border-theme-border-default transition-all cursor-grab active:cursor-grabbing text-left shadow-sm disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm">{template.icon}</span>
                        <span className="text-xs font-semibold text-theme-text-primary truncate">{template.name}</span>
                      </div>
                      <span className="text-[10px] font-medium text-theme-text-secondary whitespace-nowrap bg-theme-bg-secondary px-2 py-0.5 rounded-full">
                        {template.nodes} nodes
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex-shrink-0 pt-4 border-t border-theme-border-subtle bg-theme-bg-surface space-y-2.5">
              <Button
                onClick={() => handleImmersiveModeChange(true)}
                disabled={simulationMode}
                className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Build with AI
              </Button>
              <Button
                variant="outline"
                onClick={onClearAllNodes}
                disabled={simulationMode}
                className="w-full border-[#B91C1C]/30 hover:border-[#B91C1C] text-[#B91C1C] hover:bg-[#FEF2F2]/30 dark:hover:bg-[#2A1515]/30 font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-2 bg-transparent transition-all shadow-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all nodes
              </Button>
              
              <div className="flex justify-center pt-1.5">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-theme-md hover:bg-theme-bg-secondary/50 transition-colors group cursor-pointer bg-transparent border-none outline-none focus:outline-none"
                  title="Collapse Builder Panel"
                >
                  <span className="text-[11px] text-theme-text-secondary group-hover:text-theme-text-primary font-medium select-none">Hide Panel</span>
                  <ChevronLeft className="h-3.5 w-3.5 text-theme-text-secondary group-hover:text-theme-text-primary transition-colors" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LeftPanel;