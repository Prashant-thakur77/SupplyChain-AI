"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { SupplyChainImpactData, supplyChainImpactData } from "@/lib/data/impactresult";

interface ImpactContextProps {
  impactData: SupplyChainImpactData;
  setImpactData: React.Dispatch<React.SetStateAction<SupplyChainImpactData>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create a default context with safe initial values
const defaultContextValue: ImpactContextProps = {
  impactData: supplyChainImpactData,
  setImpactData: () => {},
  isLoading: false,
  setIsLoading: () => {},
};

const ImpactContext = createContext<ImpactContextProps>(defaultContextValue);

export const ImpactProvider = ({ children }: { children: ReactNode }) => {
  const [impactData, setImpactData] = useState<SupplyChainImpactData>(supplyChainImpactData);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const contextValue = {
    impactData,
    setImpactData,
    isLoading,
    setIsLoading,
  };

  return (
    <ImpactContext.Provider value={contextValue}>
      {children}
    </ImpactContext.Provider>
  );
};

export const useImpact = (): ImpactContextProps => {
  const context = useContext(ImpactContext);
  if (!context) {
    console.error("useImpact must be used within an ImpactProvider");
    // Return default context if used outside provider to prevent crashes
    return defaultContextValue;
  }
  return context;
};