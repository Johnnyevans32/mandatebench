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

  // --- provenance ---
  /** Repetition index within the matrix run (0-based). */
  @Prop() rep?: number;
  /** Deterministic sampling seed sent with both parties' calls. */
  @Prop() seed?: number;
  @Prop() maxTurns?: number;
}

export type DuelDocument = HydratedDocument<Duel>;
export const DuelSchema = SchemaFactory.createForClass(Duel);
// One duel per (snapshot, attacker, agent, goal, rep); partial so
// pre-provenance rows (no rep) are left alone.
DuelSchema.index(
  { snapshot: 1, attackerModel: 1, agentModel: 1, goal: 1, rep: 1 },
  { unique: true, partialFilterExpression: { rep: { $exists: true } } },
);
