import { config as loadEnv } from 'dotenv';
import { DEFAULT_MODELS } from './models';

loadEnv();

export interface OpenRouterConfig {
  apiKey: string;
  baseURL: string;
  referer: string;
  maxTokens: number;
  reasoningEffort: string;
  /** OpenRouter slugs to evaluate. */
  models: string[];
}

/** Read configuration from the environment (see .env.example). */
export function loadConfig(): OpenRouterConfig {
  const envModels = (process.env.MODELS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    referer: process.env.OPENROUTER_REFERER || 'https://mandatebench.xyz',
    maxTokens: Number(process.env.RESPONSE_MAX_TOKENS ?? '4096'),
    reasoningEffort: process.env.REASONING_EFFORT || 'low',
    models: envModels.length ? envModels : DEFAULT_MODELS.map((m) => m.id),
  };
}
