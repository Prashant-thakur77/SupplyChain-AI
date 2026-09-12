"use client";

import { FC, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/stores/user';

interface ViewModeHeaderProps {
  /** Optional override title */
  title?: string;
  /** Additional classname */
  className?: string;
}

/**
 * ViewModeHeader
 * --------------
 * A slim header bar for View-Only pages. It surfaces a **Back to Dashboard**
 * button and an optional title. The header is intentionally minimal: no save
 * or intelligence actions are shown.
 */
const ViewModeHeader: FC<ViewModeHeaderProps> = ({ title = 'Supply Chain View', className }) => {
  const router = useRouter();
  const params = useParams();
  const { userData } = useUser();
  const userId = userData?.id;
  const [isScanning, setIsScanning] = useState(false);

  const supplyChainId = params?.id as string;

  const handleRunThreatScan = async () => {
    if (!supplyChainId || !userId) return;
    
    setIsScanning(true);
    try {
        const res = await fetch(`/api/agent/automated-alerts?supplyChainId=${supplyChainId}&userId=${userId}`);
        const data = await res.json();
        
        if (data.success && data.alertsGenerated > 0) {
            alert(`Analysis complete: Found ${data.alertsGenerated} high-risk threats affecting this supply chain. Check your notifications!`);
        } else {
            alert("Analysis complete: No high-risk threats found for these specific nodes right now.");
        }
    } catch (error) {
        console.error("Failed to run threat scan:", error);
        alert("Failed to analyze threats. Please try again.");
    } finally {
        setIsScanning(false);
    }
  };

  return (
    <header
      className={`flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 py-2 shadow-md ${className ?? ''}`}
    >
      <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold whitespace-nowrap">{title}</span>
          </Button>
      </div>

      <div className="flex items-center gap-2">
          <Button 
              variant="default" 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-sm transition-all text-xs h-8"
              onClick={handleRunThreatScan}
              disabled={isScanning || !supplyChainId}
          >
              {isScanning ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isScanning ? "Scanning Global News..." : "Run Threat Scan AI"}
          </Button>
      </div>
    </header>
  );
};

export default ViewModeHeader;