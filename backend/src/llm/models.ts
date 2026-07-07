/**
 * Cross-play model registry. Slugs are OpenRouter model identifiers and are
 * env-overridable because they rotate over time — set MODELS in .env as a
 * comma-separated list of slugs to change the matrix without touching code.
 *
 * `tier` gives the within-family scaling axis; `family` lets us separate
 * cross-family external-validity cells; `color` is a hint the frontend can use.
 */
export interface ModelEntry {
  id: string; // OpenRouter slug
  label: string; // short display name
  family: string;
  tier: 'small' | 'mid' | 'frontier';
  color: string;
  /** OpenRouter `supported_parameters` for this model (e.g. structured_outputs, seed). */
  supportedParameters?: string[];
  contextLength?: number;
  pricePerMTokUsd?: number;
  /** Convenience flag: provider can enforce a JSON schema for this model. */
  supportsStructured?: boolean;
}

/** Parameters our default-set models are known to support (offline fallback). */
// Conservative offline fallback: response_format/structured_outputs are broadly
// supported; `seed` is NOT (e.g. Anthropic rejects it), so we don't claim it
// here — real per-model support comes from the live OpenRouter catalog.
const DEFAULT_SUPPORTED = ['response_format', 'structured_outputs'];

export const DEFAULT_MODELS: ModelEntry[] = (
  [
  // Cross-lab flagship roster: one top model per major lab (v2). Diversity across
  // providers is the scientifically interesting axis for cross-play deception,
  // so we deliberately avoid stacking multiple tiers of one family.
  {
    id: 'openai/gpt-5.5',
    label: 'GPT-5.5',
    family: 'openai',
    tier: 'frontier',
    color: '#a78bfa',
  },
  {
    id: 'anthropic/claude-opus-4.8',
    label: 'Opus 4.8',
    family: 'claude',
    tier: 'frontier',
    color: '#14b8a6',
  },
  {
    id: 'google/gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    family: 'google',
    tier: 'mid',
    color: '#f472b6',
  },
  {
    id: 'deepseek/deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    family: 'deepseek',
    tier: 'frontier',
    color: '#38bdf8',
  },
  {
    id: 'meta-llama/llama-4-maverick',
    label: 'Llama 4 Maverick',
    family: 'llama',
    tier: 'mid',
    color: '#f59e0b',
  },
  {
    id: 'x-ai/grok-4.3',
    label: 'Grok 4.3',
    family: 'grok',
    tier: 'mid',
    color: '#f87171',
  },
] as ModelEntry[]
).map((m) => ({
  ...m,
  supportedParameters: DEFAULT_SUPPORTED,
  supportsStructured: true,
}));

/** Shape of an entry in OpenRouter's public GET /models response. */
export interface OpenRouterModel {
  id: string;
  name?: string;
  created?: number;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  supported_parameters?: string[];
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
    modality?: string;
  };
}

/** Cheap → small, mid, expensive → frontier, by completion price (USD/1M tok). */
export function inferTier(pricePerMTokUsd: number): ModelEntry['tier'] {
  if (pricePerMTokUsd < 1) return 'small';
  if (pricePerMTokUsd < 6) return 'mid';
  return 'frontier';
}

/** Deterministic, palette-friendly color for an arbitrary slug. */
export function colorFor(id: string): string {
  const known = DEFAULT_MODELS.find((m) => m.id === id);
  if (known) return known.color;
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = h % 360;
  return `hsl(${hue} 55% 60%)`;
}

/** Build a ModelEntry from a raw OpenRouter model + its completion price. */
export function toModelEntry(
  m: OpenRouterModel,
  pricePerMTokUsd: number,
): ModelEntry {
  const supported = m.supported_parameters ?? [];
  return {
    id: m.id,
    label: (m.name || m.id.split('/').pop() || m.id).replace(/\s*\(.*\)$/, ''),
    family: m.id.split('/')[0] || 'unknown',
    tier: inferTier(pricePerMTokUsd),
    color: colorFor(m.id),
    supportedParameters: supported,
    contextLength: m.context_length,
    pricePerMTokUsd,
    supportsStructured: supported.includes('structured_outputs'),
  };
}

/**
 * Resolve the active model set. If MODELS env is set we honour it (slugs only,
 * labels derived); otherwise the curated default above is used.
 */
export function getModels(envValue?: string): ModelEntry[] {
  if (!envValue) return DEFAULT_MODELS;
  const slugs = envValue
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (slugs.length === 0) return DEFAULT_MODELS;
  return slugs.map((id) => {
    const known = DEFAULT_MODELS.find((m) => m.id === id);
    if (known) return known;
    return {
      id,
      label: id.split('/').pop() || id,
      family: id.split('/')[0] || 'unknown',
      tier: 'mid' as const,
      color: '#94a3b8',
    };
  });
}
