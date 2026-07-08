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
  @Prop({ required: true }) nPos: number;
  @Prop({ required: true }) nNeg: number;
  @Prop({ default: 0 }) scored: number;
  @Prop({ default: 0 }) costUsd: number;
}

export type MonitorDocument = HydratedDocument<Monitor>;
export const MonitorSchema = SchemaFactory.createForClass(Monitor);
