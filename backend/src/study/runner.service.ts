import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { loadConfig } from '../llm/config';
import { OpenRouterClient } from '../llm/openrouter';
import { runScenario } from '../scenario/engine';
import { createScenarioSet } from '../scenario/scenarios';
import configuration from '../configuration';
import { Result, ResultDocument } from './result.schema';

/** Fixed clock so mandate expiry is identical across models and runs. */
const RUN_CLOCK_SEC = 1_700_000_000;

@Injectable()
export class RunnerService {
  private readonly log = new Logger('Runner');
  private running = false;
  private readonly client = new OpenRouterClient(loadConfig());

  constructor(
    @InjectModel(Result.name) private readonly results: Model<ResultDocument>,
  ) {}

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Run every seed scenario against each model once, persisting each graded
   * outcome, until the configured budget is spent. Idempotency is intentionally
   * left simple for now: each call appends a fresh set of results under the
   * snapshot tag.
   */
  async runBatch(opts: { models?: string[]; snapshot?: string } = {}): Promise<{
    ran: number;
    spentUsd: number;
    stoppedOnBudget: boolean;
  }> {
    if (this.running) throw new Error('runner is already active');
    this.running = true;
    const cfg = loadConfig();
    const models = opts.models?.length ? opts.models : cfg.models;
    const snapshot = opts.snapshot ?? configuration().study.snapshotTag;
    const budget = configuration().study.budgetUsd;

    let ran = 0;
    let spentUsd = 0;
    try {
      for (const model of models) {
        for (const scenario of createScenarioSet(RUN_CLOCK_SEC)) {
          if (spentUsd >= budget) {
            this.log.warn(`budget cap $${budget} reached; stopping`);
            return { ran, spentUsd, stoppedOnBudget: true };
          }
          const r = await runScenario(this.client, scenario, model, {
            nowSec: RUN_CLOCK_SEC,
            temperature: 0,
          });
          spentUsd += r.costUsd;
          ran++;
          await this.results.create({
            modelId: model,
            scenarioId: r.scenarioId,
            pressure: r.pressure,
            isTrap: scenario.expectViolationIfAuthorized,
            action: r.action,
            violated: r.violated,
            violations: r.check?.violations ?? [],
            gradedCart: r.gradedCart as unknown as Record<string, unknown> | undefined,
            privateReasoning: r.decision.privateReasoning,
            publicStatement: r.decision.publicStatement,
            costUsd: r.costUsd,
            snapshot,
            raw: r.raw,
          });
        }
      }
      this.log.log(`batch complete: ${ran} runs, $${spentUsd.toFixed(4)}`);
      return { ran, spentUsd, stoppedOnBudget: false };
    } finally {
      this.running = false;
    }
  }
}
