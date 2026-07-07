import type {
  AgentCallContext,
  AgentCallResult,
  AgentClient,
} from './agent.types';
import type { OpenRouterConfig } from './config';
import { parseAgentJson } from './json';
import { decisionFormat } from './schemas';

interface ChatCompletion {
  provider?: string;
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
}

interface ModelsResponse {
  data?: { id: string; supported_parameters?: string[] }[];
}

/**
 * Framework-free OpenRouter client (uses global fetch — no axios, no NestJS).
 * Implements the AgentClient the scenario engine depends on, plus rawChat for
 * the monitor pass.
 *
 * Notes carried over from prior runs:
 *  - never send provider.require_parameters (it 404s several flagship endpoints);
 *  - only send `seed` when the model advertises it, clamped to a positive int32;
 *  - keep max_tokens generous (reasoning models share it with hidden reasoning);
 *  - one repair retry, then fall back to tolerant parsing.
 */
export class OpenRouterClient implements AgentClient {
  private caps: Map<string, string[]> | null = null;

  constructor(private readonly cfg: OpenRouterConfig) {}

  async decide(ctx: AgentCallContext): Promise<AgentCallResult> {
    if (!this.cfg.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set — use the mock provider instead.');
    }
    const structured = await this.supports(ctx.model, 'structured_outputs');

    const first = await this.complete(ctx, ctx.userPrompt, structured);
    try {
      return { ...first, decision: parseAgentJson(first.raw) };
    } catch {
      const repairPrompt = `${ctx.userPrompt}\n\nYour previous answer was not valid JSON. Respond again with ONLY the JSON object, no other text.`;
      const second = await this.complete(ctx, repairPrompt, structured);
      try {
        return { ...second, decision: parseAgentJson(second.raw) };
      } catch (err) {
        return {
          ...second,
          decision: { privateReasoning: second.raw.slice(0, 500) },
          parseError: (err as Error).message,
        };
      }
    }
  }

  /** Single-shot chat for the monitor pass (its own schema, not the agent shape). */
  async rawChat(
    model: string,
    system: string,
    user: string,
    opts: { temperature?: number; seed?: number; responseFormat?: Record<string, unknown> } = {},
  ): Promise<{ raw: string; provider?: string; costUsd?: number }> {
    const body: Record<string, unknown> = {
      model,
      temperature: opts.temperature ?? 0,
      max_tokens: this.cfg.maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      usage: { include: true },
      reasoning: { effort: this.cfg.reasoningEffort },
    };
    if (opts.seed !== undefined && (await this.supports(model, 'seed'))) {
      body.seed = opts.seed & 0x7fffffff;
    }
    if (opts.responseFormat) body.response_format = opts.responseFormat;

    const data = await this.post<ChatCompletion>('/chat/completions', body);
    return {
      raw: data.choices?.[0]?.message?.content ?? '',
      provider: data.provider,
      costUsd: data.usage?.cost,
    };
  }

  private async complete(
    ctx: AgentCallContext,
    userContent: string,
    structured: boolean,
  ): Promise<AgentCallResult> {
    const body: Record<string, unknown> = {
      model: ctx.model,
      temperature: ctx.temperature,
      max_tokens: this.cfg.maxTokens,
      messages: [
        { role: 'system', content: ctx.systemPrompt },
        { role: 'user', content: userContent },
      ],
      usage: { include: true },
      reasoning: { effort: this.cfg.reasoningEffort },
    };
    if (ctx.seed !== undefined && (await this.supports(ctx.model, 'seed'))) {
      body.seed = ctx.seed & 0x7fffffff;
    }
    if (structured) body.response_format = decisionFormat(ctx.kind);

    const data = await this.post<ChatCompletion>('/chat/completions', body);
    return {
      decision: { privateReasoning: '' }, // filled by the caller after parsing
      raw: data.choices?.[0]?.message?.content ?? '',
      provider: data.provider,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      costUsd: data.usage?.cost,
    };
  }

  /** Does `model` advertise support for `param` (e.g. structured_outputs, seed)? */
  private async supports(model: string, param: string): Promise<boolean> {
    if (!this.caps) await this.loadCaps();
    return this.caps?.get(model)?.includes(param) ?? false;
  }

  private async loadCaps(): Promise<void> {
    this.caps = new Map();
    try {
      const res = await fetch(`${this.cfg.baseURL}/models`, {
        headers: { Authorization: `Bearer ${this.cfg.apiKey}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as ModelsResponse;
      for (const m of data.data ?? []) {
        this.caps.set(m.id, m.supported_parameters ?? []);
      }
    } catch {
      // Offline / fetch failure: leave caps empty. supports() then returns false,
      // so we skip structured outputs and seeds and rely on tolerant parsing.
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.cfg.baseURL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        'HTTP-Referer': this.cfg.referer,
        'X-Title': 'MandateBench',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  }
}
