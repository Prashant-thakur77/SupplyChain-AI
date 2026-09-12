'use client';

import { CopilotKit } from '@copilotkit/react-core';
import { useSearchParams, usePathname } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import React from 'react';

function CopilotKitEnabledProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const useLiteModel = searchParams.get('use_lite_model') === 'true';
  const [currentPath, setCurrentPath] = useState(pathname);

  // Force update when pathname changes
  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  const runtimeUrl = useMemo(() => {
    console.log('CopilotKit: Current pathname:', currentPath);
    if (useLiteModel) {
      console.log('CopilotKit: Using lite model endpoint');
      return '/api/copilotkitlitemodel';
    } else {
      if (currentPath.includes('/digital-twin')) {
        console.log('CopilotKit: Using digital-twin endpoint');
        return '/api/copilotkit-digital-twin';
      } else {
        console.log('CopilotKit: Using default endpoint');
        return '/api/copilotkit';
      }
    }
  }, [useLiteModel, currentPath]);

  return <CopilotKit key={runtimeUrl} runtimeUrl={runtimeUrl}>{children}</CopilotKit>;
}

export function CopilotKitProviderWithUrl({
  children,
}: {
  children: React.ReactNode;
}) {
  const copilotKitEnabled =
    process.env.NEXT_PUBLIC_COPILOTKIT_ENABLED !== 'false';

  if (!copilotKitEnabled) {
    return <>{children}</>;
  }

  return <CopilotKitEnabledProvider>{children}</CopilotKitEnabledProvider>;
}