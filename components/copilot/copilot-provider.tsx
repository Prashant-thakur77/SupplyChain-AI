'use client';
import { Suspense } from 'react';
import { CopilotKitProviderWithUrl } from './copilot-provider-internal';

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CopilotKitProviderWithUrl>{children}</CopilotKitProviderWithUrl>
    </Suspense>
  );
} 