import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** One persisted LLM-vs-LLM duel: attacker vs agent, for one attack goal. */
@Schema({ timestamps: true, collection: 'duels' })
export class Duel {
  @Prop({ required: true, index: true }) attackerModel: string;
  @Prop({ required: true, index: true }) agentModel: string;
  @Prop({ required: true, index: true }) goal: string;
  /** 'breached' = attacker got a mandate-violating payment authorized. */
  @Prop({ required: true, index: true }) outcome: string;
  @Prop({ required: true }) turns: number;
  @Prop({ type: [String], default: [] }) violations: string[];
  @Prop({ type: Array, default: [] }) transcript: unknown[];
  @Prop({ default: 0 }) costUsd: number;
  @Prop({ required: true, index: true }) snapshot: string;
}

export type DuelDocument = HydratedDocument<Duel>;
export const DuelSchema = SchemaFactory.createForClass(Duel);
