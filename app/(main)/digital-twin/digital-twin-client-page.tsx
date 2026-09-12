'use client';

import { useState, useEffect } from 'react';
import { useQueryState, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs';
import { decompressArchData } from '@/lib/utils/url-compression';
import DigitalTwinDashboard from '@/components/digital-twin/display/dashboard';
import CreationForm from '@/components/digital-twin/forms/creation-form';
import DigitalTwinCanvas from '@/components/digital-twin/canvas/digital-twin-canvas';
import { selectTemplate, getTemplateInfo } from '@/lib/template-selector';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import DigitalTwinEditSkeleton from '@/components/digital-twin/display/DigitalTwinEditSkeleton';
import { supabaseClient } from '@/lib/supabase/client';
import dynamic from "next/dynamic";
const SupplyChainGlobe = dynamic(() => import("@/components/supply-chain"), { ssr: false });

export default function DigitalTwinClientPage() {
  const [twinId, setTwinId] = useQueryState('twinId', parseAsString);
  const [view, setView] = useQueryState('view', parseAsString);
  const [archParam] = useQueryState('arch', parseAsString);
  const [formParam] = useQueryState('form', parseAsString);
  const [activeTwinData, setActiveTwinData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  type ViewMode = "graph" | "globe" | "map";
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  // URL state for form data - to recreate twin from URL parameters
  const [industryParam] = useQueryState('industry', parseAsString);
  const [customIndustryParam] = useQueryState('customIndustry', parseAsString);
  const [productCharacteristicsParam] = useQueryState('productCharacteristics', parseAsArrayOf(parseAsString));
  const [supplierTiersParam] = useQueryState('supplierTiers', parseAsString);
  const [operationsLocationParam] = useQueryState('operationsLocation', parseAsArrayOf(parseAsString));
  const [countryParam] = useQueryState('country', parseAsString);
  const [currencyParam] = useQueryState('currency', parseAsString);
  const [shippingMethodsParam] = useQueryState('shippingMethods', parseAsArrayOf(parseAsString));
  const [annualVolumeTypeParam] = useQueryState('annualVolumeType', parseAsString);
  const [annualVolumeValueParam] = useQueryState('annualVolumeValue', parseAsInteger);
  const [risksParam] = useQueryState('risks', parseAsArrayOf(parseAsString));


  // Helper to check compressed form data or legacy individual params
  const hasFormDataInUrl = () => {
    return (
      !!formParam || (
        industryParam && 
        productCharacteristicsParam && 
        supplierTiersParam && 
        operationsLocationParam && 
        currencyParam && 
        shippingMethodsParam && 
        annualVolumeTypeParam && 
        annualVolumeValueParam && 
        risksParam
      )
    );
  };

  // Load twin data when twinId changes
  useEffect(() => {
    if (twinId) {
      // Only set loading state if we don't already have some twin data (prevents unmounting canvass during save)
      if (!activeTwinData) {
        setIsLoading(true);
      }
      
      // If there's an arch parameter, we'll let the canvas handle the state
      // Only load from localStorage if there's no arch parameter
      if (!archParam) {
        // First, try to recreate twin from URL parameters if available
        if (formParam) {
          try {
            const formDataFromUrl = decompressArchData(formParam);

            console.log('Recreating twin from COMPRESSED URL parameters...');

            // Select template based on decompressed form data
            const { nodes, edges } = selectTemplate(formDataFromUrl);
            const templateInfo = getTemplateInfo(formDataFromUrl);

            const twinData = {
              ...formDataFromUrl,
              nodes,
              edges,
              templateInfo,
              createdAt: new Date().toISOString(),
            };

            console.log('Twin recreated from COMPRESSED URL:', twinData);
            setActiveTwinData(twinData);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error recreating twin from compressed form param:', error);
          }
        } else if (hasFormDataInUrl()) {
          console.log('Recreating twin from URL parameters...');
          
          const formDataFromUrl = {
            industry: industryParam!,
            customIndustry: customIndustryParam || "",
            productCharacteristics: productCharacteristicsParam!,
            supplierTiers: supplierTiersParam!,
            operationsLocation: operationsLocationParam!,
            country: countryParam || "",
            currency: currencyParam!,
            shippingMethods: shippingMethodsParam!,
            annualVolumeType: annualVolumeTypeParam as "units" | "currency",
            annualVolumeValue: annualVolumeValueParam!,
            risks: risksParam!
          };

          try {
            // Select the appropriate template based on form data
            const { nodes, edges } = selectTemplate(formDataFromUrl);
            const templateInfo = getTemplateInfo(formDataFromUrl);

            const twinData = {
              ...formDataFromUrl,
              nodes,
              edges,
              templateInfo,
              createdAt: new Date().toISOString()
            };

            console.log('Twin recreated from URL parameters:', twinData);
            setActiveTwinData(twinData);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error recreating twin from URL parameters:', error);
          }
        }

        // Fallback 1: localStorage (for locally-created twins)
        const localData = localStorage.getItem(`supplyChain-${twinId}`);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            setActiveTwinData(parsedData);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing localStorage twin data:', error);
          }
        }

        // Fallback 2: Fetch directly from Supabase DB (for DB-persisted twins)
        const fetchFromDb = async () => {
          console.log('💾 No localStorage found — fetching supply chain from Supabase:', twinId);
          try {
            const [{ data: scData, error: scErr }, { data: nodes }, { data: edges }] = await Promise.all([
              supabaseClient.from('supply_chains').select('*').eq('supply_chain_id', twinId).single(),
              supabaseClient.from('nodes').select('*').eq('supply_chain_id', twinId),
              supabaseClient.from('edges').select('*').eq('supply_chain_id', twinId),
            ]);

            if (scErr || !scData) {
              console.error('Supply chain not found in DB:', scErr?.message);
              setActiveTwinData(null);
              setIsLoading(false);
              return;
            }

            const formData = scData.form_data as any || {};
            const org = scData.organisation as any || {};

            // Build canvas-compatible node/edge format from DB rows
            const canvasNodes = (nodes || []).map((n: any, idx: number) => ({
              id: n.node_id,
              type: 'supply-chain-node',
              position: n.data?.position || { x: 100 + (idx % 4) * 280, y: 100 + Math.floor(idx / 4) * 200 },
              data: {
                label: n.name,
                nodeType: n.type,
                description: n.description,
                location: n.address,
                lat: n.location_lat,
                lng: n.location_lng,
                capacity: n.capacity,
                riskLevel: n.risk_level,
                ...n.data,
              },
            }));

            const canvasEdges = (edges || []).map((e: any) => ({
              id: e.edge_id,
              source: e.from_node_id,
              target: e.to_node_id,
              type: e.type || 'smoothstep',
              label: e.data?.label || '',
              data: e.data || {},
            }));

            const twinData = {
              // Form-compatible fields
              industry: formData.industry || org.industry || 'General',
              customIndustry: formData.customIndustry || '',
              productCharacteristics: formData.productCharacteristics || [],
              supplierTiers: formData.supplierTiers || '1',
              operationsLocation: formData.operationsLocation || [org.location || 'Global'],
              country: formData.country || 'India',
              currency: formData.currency || 'USD',
              shippingMethods: formData.shippingMethods || [],
              annualVolumeType: formData.annualVolumeType || 'units',
              annualVolumeValue: formData.annualVolumeValue || 0,
              risks: formData.risks || [],
              // Supply chain metadata
              name: scData.name,
              description: scData.description,
              supply_chain_id: scData.supply_chain_id,
              // Canvas data
              nodes: canvasNodes,
              edges: canvasEdges,
              // DB source flag
              fromDatabase: true,
              createdAt: scData.timestamp || new Date().toISOString(),
            };

            console.log(`✅ Loaded supply chain "${scData.name}" from DB: ${canvasNodes.length} nodes, ${canvasEdges.length} edges`);
            setActiveTwinData(twinData);
            setIsLoading(false);
          } catch (dbErr: any) {
            console.error('Error fetching supply chain from DB:', dbErr.message);
            setActiveTwinData(null);
            setIsLoading(false);
          }
        };

        fetchFromDb();
      } else {
        // When arch param exists, set minimal twin data to indicate we have a twin
        // but let the canvas handle the actual node/edge state from the URL
        setActiveTwinData({ hasArchData: true });
      }
      if (!activeTwinData) setIsLoading(false);
    } else {
      setActiveTwinData(null);
      setIsLoading(false);
    }
  }, [twinId, archParam, formParam, industryParam, productCharacteristicsParam, supplierTiersParam, operationsLocationParam, currencyParam, shippingMethodsParam, annualVolumeTypeParam, annualVolumeValueParam, risksParam]);

  const handleCreationCancel = () => {
    setView(null, { scroll: false });
  };

  const handleCreationSuccess = (data: any) => {
    console.log('Supply chain created with form data:', data);
    console.log(' Form Data Details:', {
      industry: data.industry,
      customIndustry: data.customIndustry,
      productCharacteristics: data.productCharacteristics,
      supplierTiers: data.supplierTiers,
      operationsLocation: data.operationsLocation,
      country: data.country,
      currency: data.currency,
      shippingMethods: data.shippingMethods,
      annualVolumeType: data.annualVolumeType,
      annualVolumeValue: data.annualVolumeValue,
      risks: data.risks
    });

    // Select the appropriate template based on form data
    const { nodes, edges } = selectTemplate(data);
    const templateInfo = getTemplateInfo(data);

    console.log(`Selected template: ${templateInfo.templateName} - ${templateInfo.reason}`);

    // Create dummy twin ID with a strict UUID so Supabase doesn't reject it
    const twinId = crypto.randomUUID();
    
    // Store the template data temporarily for the canvas to use
    const twinData = {
      ...data,
      nodes,
      edges,
      templateInfo,
      createdAt: new Date().toISOString()
    };
    
    
    console.log(' Digital twin created with dummy ID:', twinId);
    console.log(' Template data stored temporarily:', twinData);
    
    // Store the data in localStorage so it can be retrieved when loading the canvas
    localStorage.setItem(`supplyChain-${twinId}`, JSON.stringify(twinData));
    console.log('Template data stored in localStorage with key:', `supplyChain-${twinId}`);
    
    // Close the dialog
    setView(null, { scroll: false });
    
    // Set the twin ID to show the canvas
    setTwinId(twinId);
  };

  // If a twinId is present, we would show the canvas/details view.
  if (twinId) {
    if (isLoading) {
      return <DigitalTwinEditSkeleton />;
    }

    if (activeTwinData) {
      return (
        <div className="relative w-full h-full flex flex-col flex-1">
          {/* View toggle */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 rounded-full p-1.5 shadow-2xl"
            style={{ background: "rgba(6, 10, 24, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <button
              onClick={() => setViewMode("graph")}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{ background: viewMode === "graph" ? "#4B6EFF" : "transparent", color: viewMode === "graph" ? "#fff" : "#9ca3af" }}
            >
              Graph View
            </button>
            <button
              onClick={() => setViewMode("globe")}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{ background: viewMode === "globe" ? "#4B6EFF" : "transparent", color: viewMode === "globe" ? "#fff" : "#9ca3af" }}
            >
              🌐 Globe
            </button>
            <button
              onClick={() => setViewMode("map")}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{ background: viewMode === "map" ? "#4B6EFF" : "transparent", color: viewMode === "map" ? "#fff" : "#9ca3af" }}
            >
              🗺️ Map
            </button>
          </div>

          {viewMode === "graph" && (
            activeTwinData.hasArchData ? (
              <DigitalTwinCanvas />
            ) : (
              <DigitalTwinCanvas
                initialNodes={activeTwinData.nodes}
                initialEdges={activeTwinData.edges}
              />
            )
          )}
          
          {(viewMode === "globe" || viewMode === "map") && (
            <div className="absolute inset-0 z-0 bg-[#060a18] rounded-xl overflow-hidden"
              style={{ top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column" }}
            >
              <SupplyChainGlobe twinId={twinId} mode={viewMode} />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full flex-1">
        <div className="text-center">
          <p className="text-lg text-gray-600">Digital twin not found.</p>
          <button
            onClick={() => setTwinId(null)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // The dashboard is always rendered, and the dialog is overlaid on top.
  return (
    <>
      <main className="flex-1 overflow-auto">
        <DigitalTwinDashboard />
      </main>
      <Dialog
        open={view === 'create'}
        onOpenChange={(isOpen) => !isOpen && setView(null, { scroll: false })}
      >
        <DialogContent className="sm:max-w-2xl p-0" hideCloseIcon={true}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Create a New Digital Twin
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Fill out the steps below to build your supply chain model.
            </DialogDescription>
          </DialogHeader>
          <CreationForm
            onSuccess={handleCreationSuccess}
            onCancel={handleCreationCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 