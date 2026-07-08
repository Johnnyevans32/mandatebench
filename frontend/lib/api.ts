const API =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface LeaderboardRow {
  model: string;
  traps: number;
  violations: number;
  violationRate: number;
  low: number;
  high: number;
}

export interface MatrixCell {
  model: string;
  pressure: string;
  n: number;
  violations: number;
  rate: number;
}

export interface Spend {
  totalUsd: number;
  runs: number;
}

export interface DuelCell {
  attacker: string;
  agent: string;
  duels: number;
  breaches: number;
  breachRate: number;
}

export interface AgentDefense {
  model: string;
  duels: number;
  breached: number;
  breachRate: number;
  low: number;
  high: number;
}

export interface Snapshot {
  leaderboard: LeaderboardRow[];
  matrix: MatrixCell[];
  spend: Spend;
  duelMatrix: DuelCell[];
  duelAgents: AgentDefense[];
  live: boolean;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

/** Fetch all dashboard data. Falls back to a small sample if the API is down. */
export async function loadSnapshot(): Promise<Snapshot> {
  try {
    const [leaderboard, matrix, spend, duelMatrix, duelSummary] = await Promise.all([
      get<LeaderboardRow[]>('/leaderboard'),
      get<MatrixCell[]>('/matrix'),
      get<Spend>('/spend'),
      get<DuelCell[]>('/duel-matrix').catch(() => [] as DuelCell[]),
      get<{ agents: AgentDefense[] }>('/duel-summary').catch(() => ({ agents: [] })),
    ]);
    if (leaderboard.length === 0) return { ...MOCK, live: false };
    return {
      leaderboard,
      matrix,
      spend,
      duelMatrix,
      duelAgents: duelSummary.agents ?? [],
      live: true,
    };
  } catch {
    return { ...MOCK, live: false };
  }
}

export const PRESSURES = [
  'principal_agent',
  'social_engineering',
  'urgency',
  'ambiguity',
  'prompt_injection',
];

export const PRESSURE_LABELS: Record<string, string> = {
  principal_agent: 'Principal-agent',
  social_engineering: 'Social engineering',
  urgency: 'Urgency',
  ambiguity: 'Ambiguity',
  prompt_injection: 'Prompt injection',
};

// Sample shown only when the live API returns nothing — clearly flagged in the UI.
const MOCK: Omit<Snapshot, 'live'> = {
  leaderboard: [
    { model: 'openai/gpt-5.5', traps: 5, violations: 0, violationRate: 0, low: 0, high: 0.43 },
    { model: 'anthropic/claude-opus-4.8', traps: 5, violations: 0, violationRate: 0, low: 0, high: 0.43 },
    { model: 'google/gemini-3.5-flash', traps: 5, violations: 0, violationRate: 0, low: 0, high: 0.43 },
    { model: 'meta-llama/llama-4-maverick', traps: 5, violations: 1, violationRate: 0.2, low: 0.04, high: 0.62 },
  ],
  matrix: [
    { model: 'meta-llama/llama-4-maverick', pressure: 'urgency', n: 1, violations: 1, rate: 1 },
  ],
  spend: { totalUsd: 0, runs: 0 },
  duelMatrix: [],
  duelAgents: [],
};
