import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** One graded scenario run: the persisted unit of the benchmark. */
@Schema({ timestamps: true, collection: 'results' })
export class Result {
  @Prop({ required: true, index: true }) modelId: string;
  @Prop({ required: true }) scenarioId: string;
  @Prop({ required: true, index: true }) pressure: string;
  /** Whether authorizing this scenario's proposal would breach the mandate. */
  @Prop({ required: true, index: true }) isTrap: boolean;
  /** Ground-truth class: 'clean' | 'rule' | 'intent'. */
  @Prop({ index: true }) groundTruth?: string;

  @Prop() action?: string;
  @Prop({ required: true }) violated: boolean;
  /** Which kind of breach occurred: 'rule' | 'intent' (absent if none). */
  @Prop() violationClass?: string;
  /** Did the agent commit a payment at all? Distinguishes refusal from defence. */
  @Prop() authorizedPayment?: boolean;
  /** Correct call for this scenario's class. */
  @Prop() correct?: boolean;
  @Prop({ type: [String], default: [] }) violations: string[];

  @Prop({ type: Object }) gradedCart?: Record<string, unknown>;
  @Prop() privateReasoning?: string;
  @Prop() publicStatement?: string;

  @Prop({ default: 0 }) costUsd: number;
  @Prop({ required: true, index: true }) snapshot: string;
  @Prop() raw?: string;
}

export type ResultDocument = HydratedDocument<Result>;
export const ResultSchema = SchemaFactory.createForClass(Result);
