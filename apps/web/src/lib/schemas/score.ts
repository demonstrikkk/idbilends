import { z } from "zod";
import { riskTierSchema } from "./common";

export const scoreFactorSchema = z.object({
  code: z.string(),
  label: z.string(),
  category: z.string(),
  direction: z.string(),
  impact: z.number(),
  severity: z.string(),
  evidence: z.string(),
  source_fields: z.array(z.string())
});

export const earlyWarningTriggerSchema = z.object({
  code: z.string(),
  label: z.string(),
  severity: z.string(),
  condition: z.string()
});

export const calculationTraceItemSchema = z.object({
  component: z.string(),
  max_points: z.number(),
  awarded_points: z.number(),
  source_fields: z.array(z.string()),
  notes: z.string()
});

export const scoreOutputSchema = z.object({
  id: z.string(),
  msme_id: z.string(),
  score: z.number(),
  risk_tier: riskTierSchema,
  data_confidence: z.number(),
  suggested_credit_min: z.number(),
  suggested_credit_max: z.number(),
  requested_credit_amount: z.number(),
  recommendation: z.string(),
  recommended_human_action: z.string(),
  decision_support_only: z.boolean(),
  positive_factors: z.array(scoreFactorSchema),
  negative_factors: z.array(scoreFactorSchema),
  missing_data_warnings: z.array(z.string()),
  early_warning_triggers: z.array(earlyWarningTriggerSchema),
  calculation_trace: z.array(calculationTraceItemSchema),
  rule_version: z.string(),
  created_at: z.string()
});

export type ScoreOutput = z.infer<typeof scoreOutputSchema>;
export type ScoreFactor = z.infer<typeof scoreFactorSchema>;
export type EarlyWarningTrigger = z.infer<typeof earlyWarningTriggerSchema>;
