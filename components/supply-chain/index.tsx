"use client";

import dynamic from "next/dynamic";

const SupplyChainGlobe = dynamic(() => import("./SupplyChainGlobe"), { ssr: false });
const SupplyChainMap = dynamic(() => import("./SupplyChainMap"), { ssr: false });

interface SupplyChainViewProps {
  twinId?: string | null;
  mode?: "graph" | "globe" | "map";
}

export default function SupplyChainView({ twinId, mode }: SupplyChainViewProps) {
  if (mode === "map") {
    return <SupplyChainMap twinId={twinId} />;
  }
  return <SupplyChainGlobe twinId={twinId} />;
}
