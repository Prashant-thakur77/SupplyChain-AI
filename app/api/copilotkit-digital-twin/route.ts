import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';

import { NextRequest } from 'next/server';
import { getCopilotKitConfig } from '@/lib/ai-config';

// Uses AI_MODELS.chatLite + GOOGLE_API_KEY_AGENTS (or fallback to main key)
// To change model or key, edit lib/ai-config.ts

export const POST = async (req: NextRequest) => {
  const { model, apiKey } = getCopilotKitConfig('digital-twin');
  if (apiKey) process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
  const serviceAdapter = new GoogleGenerativeAIAdapter({ model });
  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit-digital-twin',
  });
  return handleRequest(req);
};