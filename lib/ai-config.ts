/**
 * ┌───────────────────────────────────────────────────────────────────┐
 * │                     SupplyChain AI Configuration                        │
 * │                                                                   │
 * │  Single source of truth for all AI model names and API keys.      │
 * │  To swap models or API keys: edit this file only.                 │
 * │                                                                   │
 * │  Environment Variables (all optional, fall back to main key):     │
 * │    GOOGLE_GENERATIVE_AI_API_KEY  — main/default key               │
 * │    GOOGLE_API_KEY_ORCHESTRATOR   — for orchestrator/chat          │
 * │    GOOGLE_API_KEY_AGENTS         — for specialized AI agents      │
 * │    GOOGLE_API_KEY_SUGGESTIONS    — for background suggestions      │
 * └───────────────────────────────────────────────────────────────────┘
 */

// ─── Model Names ──────────────────────────────────────────────────────────────
// Change these to swap models globally.
//
// ⚠️  Quota guide (free tier):
//   gemini-2.5-flash  →   50 RPD  (premium quality, use sparingly)
//   gemini-2.0-flash  → 1,500 RPD (good quality, high limit)
//   gemini-1.5-flash  → 1,500 RPD (stable high-quota fallback)
//
// Each orchestrator request = up to 8 API calls internally, so keep
// agent/suggestions models on high-quota models to avoid hitting quota fast.

export const AI_MODELS = {
  /** Main chat model – used for CopilotKit chat & primary responses */
  chat: 'gemini-2.5-flash',
  /** Lightweight chat model – used when speed/cost matters */
  chatLite: 'gemini-2.5-flash',
  /** Agent analysis model – used for strategy, scenario, impact, info agents */
  agents: 'gemini-2.5-flash',
  /** Suggestions model – used for background supply chain suggestions */
  suggestions: 'gemini-2.5-flash',
} as const;

// ─── Module Types ─────────────────────────────────────────────────────────────

export type AIModule = 'orchestrator' | 'agents' | 'suggestions' | 'chat-lite' | 'digital-twin' | 'default';

// ─── API Key Resolution ───────────────────────────────────────────────────────

/**
 * Returns the most appropriate Gemini API key for the given module.
 * Priority: Module-specific key > Main project key
 */
export function getAIKeyForModule(module: AIModule): string {
  const mainKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

  switch (module) {
    case 'orchestrator':
      return process.env.GOOGLE_API_KEY_ORCHESTRATOR || mainKey;
    case 'digital-twin':
      return process.env.GOOGLE_API_KEY_DIGITAL_TWIN || mainKey;
    case 'agents':
    case 'chat-lite':
      return process.env.GOOGLE_API_KEY_AGENTS || mainKey;
    case 'suggestions':
      return process.env.GOOGLE_API_KEY_SUGGESTIONS || mainKey;
    default:
      return mainKey;
  }
}

// ─── SDK Config Helpers ───────────────────────────────────────────────────────

/**
 * Returns the API key for a module (for use with @ai-sdk/google createGoogleGenerativeAI).
 */
export function getAIConfig(module: AIModule = 'default') {
  return {
    apiKey: getAIKeyForModule(module)
  };
}

/**
 * Returns the CopilotKit model + apiKey config for a given endpoint type.
 * Centralizes all CopilotKit model/key management.
 */
export function getCopilotKitConfig(endpoint: 'chat' | 'digital-twin' | 'lite') {
  switch (endpoint) {
    case 'digital-twin':
      return {
        model: AI_MODELS.chatLite,
        apiKey: getAIKeyForModule('digital-twin'),
      };
    case 'lite':
      return {
        model: AI_MODELS.chatLite,
        apiKey: getAIKeyForModule('chat-lite'),
      };
    case 'chat':
    default:
      return {
        model: AI_MODELS.chat,
        apiKey: getAIKeyForModule('orchestrator'),
      };
  }
}
