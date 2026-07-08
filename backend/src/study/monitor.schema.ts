import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * One pre-signature monitorability measurement (RQ3): a monitor model reads the
 * agents' own words (reasoning or public statement) for every graded decision in
 * a snapshot and scores each for likely violation. AUROC of those scores against
 * the objective violation labels is how diagnostic the channel is. Comparing a
 * normal snapshot to a `hideReasoning` one measures oversight robustness.
 */
@Schema({ timestamps: true, collection: 'monitors' })
export class Monitor {
  @Prop({ required: true, index: true }) snapshot: string;
  @Prop({ required: true }) monitorModel: string;
  /** 'reasoning' | 'public' — which channel the monitor read. */
  @Prop({ required: true }) channel: string;
  @Prop({ required: true }) auroc: number;
  /** Percentile-bootstrap 95% CI bounds over the scored items. */
  @Prop() aurocLow?: number;
  @Prop() aurocHigh?: number;
  @Prop({ required: true }) nPos: number;
  @Prop({ required: true }) nNeg: number;
  /** Within-model AUROC per agent model (pooled AUROC conflates styles). */
  @Prop({ type: [Object], default: [] })
  perModel: { model: string; auroc: number; nPos: number; nNeg: number }[];
  /** Items dropped because the monitored channel was empty. */
  @Prop({ default: 0 }) excludedEmpty: number;
  /** Monitor verdicts that failed to parse and defaulted to 0.5. */
  @Prop({ default: 0 }) fallbackVerdicts: number;
  @Prop({ default: 0 }) scored: number;
  @Prop({ default: 0 }) costUsd: number;
}

export type MonitorDocument = HydratedDocument<Monitor>;
export const MonitorSchema = SchemaFactory.createForClass(Monitor);
