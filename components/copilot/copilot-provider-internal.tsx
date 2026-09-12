'use client';

import { CopilotKit } from '@copilotkit/react-core';

// Single CopilotKit runtime endpoint (the canvas-builder assistant). Supply-chain intelligence is handled by the
// Strands agent-service via /api/agent/*; CopilotKit only powers client-side canvas actions.
export function CopilotKitProviderWithUrl({ children }: { children: React.ReactNode }) {
  return <CopilotKit runtimeUrl="/api/copilotkit">{children}</CopilotKit>;
}
