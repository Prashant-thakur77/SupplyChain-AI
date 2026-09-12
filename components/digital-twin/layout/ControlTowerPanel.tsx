import { FC } from 'react';
import { useDigitalTwinStore } from '@/lib/digitalTwinStore';
import { AlertCircle, Route, XCircle, Search, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDisruptionSimulation } from '../canvas/hooks/useDisruptionSimulation';

const ControlTowerPanel: FC = () => {
  const { isControlTowerMode, disruptedNodes, disruptedEdges, nodes, edges, clearDisruptions, disruptionAnalysis, isAnalyzingDisruption, setIsAnalyzingDisruption, setDisruptionAnalysis, updateNode } = useDigitalTwinStore();
  const [isScanning, setIsScanning] = useState(false);
  const { simulateDisruption } = useDisruptionSimulation();

  if (!isControlTowerMode) return null;

  const activeNodes = nodes.filter(n => disruptedNodes.includes(n.id));

  return (
    <div className="absolute top-24 left-4 z-40 w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-4 transition-all animate-in slide-in-from-left-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ShieldAlertIcon /> Control Tower
        </h3>
        {disruptedNodes.length > 0 && (
          <button 
            onClick={clearDisruptions}
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            Clear All
          </button>
        )}
      </div>

      {disruptedNodes.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 space-y-4">
          <p>Right-click any node to manually simulate a disruption.</p>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase">OR</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <button 
            onClick={async () => {
              setIsScanning(true);
              try {
                const response = await fetch('/api/agent/live-intelligence', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nodes: nodes.map(n => ({ id: n.id, data: n.data })) })
                });
                if (response.ok) {
                  const result = await response.json();
                  
                  // Silently update all node risk scores on the canvas based on sentiment
                  if (result.nodeRisks && Array.isArray(result.nodeRisks)) {
                    result.nodeRisks.forEach((nr: any) => {
                      updateNode(nr.nodeId, { riskScore: nr.riskScore });
                    });
                  }

                  // Find a critical node (>0.80) to trigger the massive visual disruption alarm
                  const criticalNode = result.nodeRisks?.find((nr: any) => nr.riskScore > 0.80);

                  if (result.disruptionsFound && criticalNode) {
                    setIsAnalyzingDisruption(true);
                    simulateDisruption(criticalNode.nodeId);
                    
                    // Call the route-optimization agent with the live problem description
                    const analysisRes = await fetch('/api/agent/route-optimization', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                         nodeId: criticalNode.nodeId,
                         description: criticalNode.reason || result.description,
                         nodes: nodes.map(n => ({ id: n.id, data: n.data, type: n.type })),
                         edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, data: e.data }))
                       })
                    });
                    if (analysisRes.ok) {
                       setDisruptionAnalysis(await analysisRes.json());
                    }
                    setIsAnalyzingDisruption(false);
                  } else {
                    alert("News sentiment applied. No catastrophic disruptions (>0.80 risk) detected. Node risk scores updated silently.");
                  }
                }
              } catch (err) {
                console.error(err);
                alert("Failed to scan live intelligence.");
              } finally {
                setIsScanning(false);
              }
            }}
            disabled={isScanning || nodes.length === 0}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors border ${
              nodes.length === 0 
                ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 cursor-not-allowed'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800'
            }`}
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {nodes.length === 0 ? "Add Nodes to Scan" : isScanning ? "Scanning Global Feeds..." : "Scan Live Intelligence"}
          </button>
        </div>
      ) : isAnalyzingDisruption ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4 text-sm text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p>AI is analyzing disruption impact...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-1">
              <AlertCircle className="w-4 h-4" />
              Active Disruption
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Root node: <strong>{activeNodes[0]?.data?.label || activeNodes[0]?.id}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {disruptedNodes.length - 1}
              </div>
              <div className="text-xs text-orange-800 dark:text-orange-300">
                Nodes Impacted
              </div>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {disruptedEdges.length}
              </div>
              <div className="text-xs text-yellow-800 dark:text-yellow-300">
                Routes Blocked
              </div>
            </div>
          </div>
          
          {disruptionAnalysis && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
              <div className="text-sm font-semibold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${disruptionAnalysis.severity === 'High' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                AI Impact Analysis
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {disruptionAnalysis.impactDescription}
              </p>
              
              {disruptionAnalysis.alternateRoutes && disruptionAnalysis.alternateRoutes.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recommended Detours</div>
                  <ul className="space-y-2">
                    {disruptionAnalysis.alternateRoutes.map((route: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-100 dark:border-gray-700">
                        <Route className="w-3 h-3 mt-0.5 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">{route}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!disruptionAnalysis && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
               <button className="w-full flex items-center justify-center gap-2 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                 <Route className="w-4 h-4" />
                 Find Alternate Routes
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ShieldAlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m12 8-1.5 6h3z"/><circle cx="12" cy="17" r="1"/></svg>
)

export default ControlTowerPanel;
