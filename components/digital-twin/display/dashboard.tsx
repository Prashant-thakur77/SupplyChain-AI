"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQueryState, parseAsString } from 'nuqs';
import { getUserSupplyChains, deleteSupplyChainViaEdgeFunction } from '@/lib/api/supply-chain';
import { useUser } from '@/lib/stores/user';
import { AlertCircle, Trash2 } from 'lucide-react';
import { RefreshCWIcon, PlusIcon } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface SupplyChainData {
  supply_chain_id: string;
  name: string;
  description: string;
  organisation: {
    industry: string;
    location: string;
  };
  form_data: {
    risks: string[];
    industry: string;
  };
  timestamp: string;
  nodes: any[];
  edges: any[];
}

interface ApiResponse {
  status: string;
  data: SupplyChainData[];
  meta: {
    total_supply_chains: number;
    total_nodes: number;
    total_edges: number;
  };
}

export default function DigitalTwinDashboard() {
  const [supplyChains, setSupplyChains] = useState<SupplyChainData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplyChainToDelete, setSupplyChainToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [view, setView] = useQueryState('view', parseAsString);
  const [, setTwinId] = useQueryState('twinId', parseAsString);
  const { userData, userLoading } = useUser();

  const fetchSupplyChains = async () => {
    if (!userData?.id) {
      setError('User not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response: ApiResponse = await getUserSupplyChains(userData.id);
      
      if (response.status === 'success' && response.data) {
        setSupplyChains(response.data);
        setDataFetched(true);
      } else {
        setError('Failed to load supply chains');
      }
    } catch (err) {
      console.error('Error fetching supply chains:', err);
      setError(err instanceof Error ? err.message : 'Failed to load supply chains');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!userData?.id) {
      setError('User not found. Please log in.');
      return;
    }

    if (dataFetched) {
      return;
    }

    setLoading(true);
    fetchSupplyChains();
  }, [userLoading, userData?.id, dataFetched]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setDataFetched(false);
    await fetchSupplyChains();
  };

  const handleDelete = async (supplyChainId: string, supplyChainName: string) => {
    if (!userData?.id) {
      toast.error('User not found. Please log in.');
      return;
    }

    setSupplyChainToDelete({ id: supplyChainId, name: supplyChainName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplyChainToDelete || !userData?.id) {
      return;
    }

    setDeleting(true);
    try {
      await deleteSupplyChainViaEdgeFunction(supplyChainToDelete.id, userData.id);
      toast.success('Supply chain deleted successfully');
      
      setSupplyChains(prevChains => 
        prevChains.filter(chain => chain.supply_chain_id !== supplyChainToDelete.id)
      );
    } catch (error) {
      console.error('Error deleting supply chain:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete supply chain');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSupplyChainToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSupplyChainToDelete(null);
  };

  if (userLoading || loading) {
    return (
      <div className="relative min-h-full flex-1 flex flex-col bg-theme-bg-primary overflow-x-hidden text-theme-text-primary">
        <div className="border-b border-theme-border-subtle px-6 py-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-4 w-40 bg-theme-bg-secondary/40 rounded animate-pulse" />
            <div className="h-3 w-64 bg-theme-bg-secondary/40 rounded animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-theme-bg-secondary/40 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-theme-bg-surface border border-theme-border-subtle rounded-theme-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-full flex-1 flex flex-col bg-theme-bg-primary text-theme-text-primary">
        <div className="border-b border-theme-border-subtle px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.15em] text-theme-text-muted font-bold">Network Registry</p>
            <h1 className="text-base font-[700] text-theme-text-primary mt-1">Operation Network Graphs</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs border border-theme-border-subtle text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded-theme-md bg-theme-bg-surface"
            >
              <RefreshCWIcon className={`${refreshing ? 'animate-spin' : ''}`} size={12} />
              Retry
            </button>
            <button onClick={() => setView('create')} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-theme-text-primary text-theme-bg-primary hover:bg-theme-text-primary/90 rounded-theme-md font-semibold">
              <PlusIcon size={12} />
              New Graph
            </button>
          </div>
        </div>
        <div className="p-6">
          <Alert variant="destructive" className="border-theme-red/20 bg-theme-red/5 text-theme-red rounded-theme-md">
            <AlertCircle className="h-4 w-4 text-theme-red" />
            <AlertDescription className="font-semibold text-theme-red">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-theme-bg-primary overflow-x-hidden text-theme-text-primary flex flex-col">

      {/* Top Action Bar */}
      <div className="border-b border-theme-border-subtle px-6 py-4 flex items-center justify-between shrink-0 bg-theme-bg-surface/50 backdrop-blur-[8px]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-theme-text-muted font-[700]">Network Registry</p>
          <h1 className="text-base font-bold text-theme-text-primary mt-1">
            Operation Network Graphs
            {supplyChains.length > 0 && (
              <span className="ml-2.5 text-[10px] font-semibold text-theme-text-muted border border-theme-border-subtle px-2 py-0.5 rounded-theme-pill bg-theme-bg-secondary/40">
                {supplyChains.length} registered
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-theme-border-subtle text-theme-text-secondary hover:text-theme-text-primary dark:hover:text-white hover:border-theme-border-default transition-colors rounded-theme-md bg-theme-bg-surface"
          >
            <RefreshCWIcon className={`${refreshing ? 'animate-spin' : ''}`} size={12} />
            Sync
          </button>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-theme-text-primary text-theme-bg-primary hover:bg-theme-text-primary/90 transition-colors font-semibold rounded-theme-md shadow-sm"
          >
            <PlusIcon size={12} />
            Register Graph
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {supplyChains.length === 0 ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <div className="text-center max-w-sm p-10 border border-theme-border-subtle rounded-theme-lg bg-theme-bg-surface shadow-sm">
              <div className="w-12 h-12 border border-theme-border-subtle rounded-full bg-theme-bg-secondary/50 flex items-center justify-center mx-auto mb-4 text-theme-text-muted">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-theme-text-primary mb-2">Registry Empty</h3>
              <p className="text-xs text-theme-text-secondary mb-6 leading-relaxed">
                No operation network graphs have been registered. Create your first graph to begin resilience modeling.
              </p>
              <button
                onClick={() => setView('create')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-theme-text-primary text-theme-bg-primary hover:bg-theme-text-primary/95 transition-colors font-semibold rounded-theme-md"
              >
                <PlusIcon size={12} />
                Register First Graph
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-theme-border-subtle rounded-theme-lg bg-theme-bg-surface overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center border-b border-theme-border-subtle px-6 py-3.5 text-[10px] uppercase tracking-wider text-theme-text-muted font-bold gap-4 bg-theme-bg-secondary/20">
              <span>Graph Name</span>
              <span>Industry</span>
              <span>Exposure Profile</span>
              <span>Registered</span>
              <span></span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-theme-border-subtle bg-theme-bg-surface">
              {supplyChains.map((chain) => {
                const riskLevel = chain.form_data?.risks?.length > 2 ? 'High' :
                                  chain.form_data?.risks?.length > 1 ? 'Medium' : 'Low';
                const chainDate = chain.timestamp || (chain as any).created_at || new Date().toISOString();
                const date = new Date(chainDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                const industry = chain.form_data?.industry || chain.organisation?.industry || 'General';
                const nodeCount = chain.nodes?.length || 0;
                const edgeCount = chain.edges?.length || 0;

                return (
                  <div key={chain.supply_chain_id} className="group grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center px-6 py-4 gap-4 hover:bg-theme-bg-secondary/40 transition-colors">
                    <button
                      className="flex items-start gap-3 text-left min-w-0"
                      onClick={() => {
                        setTwinId(chain.supply_chain_id);
                      }}
                    >
                      <div className="w-8 h-8 border border-theme-border-subtle bg-theme-bg-secondary rounded-theme-sm flex items-center justify-center shrink-0 text-[10.5px] font-bold text-theme-text-secondary mt-0.5 uppercase">
                        {chain.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <p className="text-sm font-semibold text-theme-text-primary truncate group-hover:underline underline-offset-2">
                          {chain.name || 'Unnamed Network'}
                        </p>
                        <p className="text-[11px] text-theme-text-secondary truncate mt-0.5">
                          {nodeCount} nodes · {edgeCount} connections
                        </p>
                      </div>
                    </button>

                    <span className="text-xs text-theme-text-secondary truncate">{industry}</span>

                    <span className={`text-[11px] font-[700] tracking-wide inline-flex items-center gap-1.5`}>
                      <span className={`w-2 h-2 rounded-full ${
                        riskLevel === 'High' ? 'bg-theme-red animate-pulse' :
                        riskLevel === 'Medium' ? 'bg-theme-amber' :
                        'bg-theme-green'
                      }`} />
                      <span className={
                        riskLevel === 'High' ? 'text-theme-red' :
                        riskLevel === 'Medium' ? 'text-theme-amber' :
                        'text-theme-green'
                      }>{riskLevel} Risk</span>
                    </span>

                    <span className="text-xs text-theme-text-secondary">{date}</span>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-theme-red/10 text-theme-text-secondary hover:text-theme-red rounded-theme-md"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(chain.supply_chain_id, chain.name);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md border border-theme-border-subtle/50 bg-theme-bg-glass backdrop-blur-[16px] saturate-[180%] shadow-lg rounded-theme-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-theme-text-primary text-sm font-semibold">
              <AlertCircle className="h-4 w-4 text-theme-red" />
              Deregister Network Graph
            </DialogTitle>
            <DialogDescription className="text-theme-text-secondary mt-2 text-xs leading-relaxed">
              Remove <span className="font-semibold text-theme-text-primary">"{supplyChainToDelete?.name}"</span> from the registry?
              This permanently deletes all associated node and edge data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deleting}
              className="flex-1 border-theme-border-subtle hover:bg-theme-bg-secondary/50 rounded-theme-md text-xs shadow-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 bg-theme-red hover:bg-theme-red/90 text-white rounded-theme-md text-xs shadow-none font-semibold"
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-3 w-3" />
                  Deregister
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}