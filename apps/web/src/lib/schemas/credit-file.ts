import { z } from "zod";
import { auditEventSchema } from "./audit";
import { copilotBriefSchema, traceStepSchema } from "./copilot";
import { msmeDetailSchema } from "./msme";
import { portfolioCaseSchema } from "./portfolio";
import { prospectOutputSchema } from "./prospect";
import { earlyWarningTriggerSchema, scoreOutputSchema } from "./score";

export const transactionSummarySchema = z.object({
  msme_id: z.string(),
  snapshot_month: z.string(),
  monthly_revenue_avg: z.number(),
  monthly_expense_avg: z.number(),
  net_monthly_surplus_estimate: z.number(),
  average_bank_balance: z.number(),
  emi_to_revenue_ratio: z.number(),
  cash_inflow_volatility: z.number(),
  digital_payment_ratio: z.number(),
  bounce_count_3m: z.number(),
  invoice_delay_avg_days: z.number(),
  notes: z.array(z.string())
});

export const evidenceStatusItemSchema = z.object({
  source_type: z.string(),
  source_label: z.string(),
  status: z.string(),
  why_it_matters: z.string(),
  related_score_component: z.string(),
  action_label: z.string(),
  action_enabled: z.boolean(),
  disabled_reason: z.string().nullable()
});

export const evidenceRecordSchema = z.object({
  id: z.string(),
  msme_id: z.string(),
  evidence_type: z.string(),
  title: z.string(),
  source: z.string(),
  source_type: z.string(),
  document_name: z.string(),
  status: z.string(),
  content_type: z.string(),
  file_name: z.string(),
  file_size: z.number(),
  storage_path: z.string().nullable().optional(),
  preview_text: z.string(),
  extracted_signals: z.array(z.object({
    field_name: z.string(),
    value: z.string(),
    source_mapping: z.string(),
    confidence: z.number()
  })),
  extraction_status: z.string(),
  confidence_impact: z.string(),
  risk_impact: z.string(),
  related_score_components: z.array(z.string()),
  lending_question: z.string(),
  source_mapping: z.array(z.string()),
  uploaded_by: z.string(),
  reviewed_at: z.string().nullable().optional(),
  audit_event_id: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

export const recommendedHumanActionSchema = z.object({
  label: z.string(),
  detail: z.string(),
  source: z.string()
});

export const creditFileSchema = z.object({
  profile: msmeDetailSchema,
  score: scoreOutputSchema,
  prospect: prospectOutputSchema,
  evidence_status: z.array(evidenceStatusItemSchema),
  evidence_records: z.array(evidenceRecordSchema),
  missing_evidence: z.array(z.string()),
  transaction_summary: transactionSummarySchema,
  risk_warnings: z.array(earlyWarningTriggerSchema),
  suggested_credit_posture: z.string(),
  recommended_human_actions: z.array(recommendedHumanActionSchema),
  audit_summary: z.object({
    latest_events: z.array(auditEventSchema),
    total_events: z.number()
  }),
  cited_source_ids: z.array(z.string()),
  generated_at: z.string()
});

export const evidenceMapRowSchema = z.object({
  source_type: z.string(),
  source_label: z.string(),
  source_status: z.string(),
  derived_signal: z.string(),
  score_component: z.string(),
  lending_question: z.string(),
  recommended_action: z.string(),
  confidence_impact: z.string(),
  risk_impact: z.string()
});

export const evidenceMapResponseSchema = z.object({
  msme_id: z.string(),
  rows: z.array(evidenceMapRowSchema),
  generated_at: z.string()
});

export const caseInboxLaneSchema = z.object({
  lane: z.enum(["ready_for_review", "missing_evidence", "risk_attention", "high_potential", "low_confidence"]),
  label: z.string(),
  cases: z.array(portfolioCaseSchema)
});

export const caseInboxResponseSchema = z.object({
  lanes: z.array(caseInboxLaneSchema),
  generated_at: z.string()
});

export const copilotChatResponseSchema = z.object({
  answer_markdown: z.string(),
  decision_support_only: z.literal(true),
  cited_internal_inputs: z.array(z.string()),
  trace: z.array(traceStepSchema),
  provider: z.string(),
  model: z.string(),
  prompt_version: z.string(),
  summary: z.string(),
  recommended_human_action: z.string(),
  assumptions: z.array(z.string()),
  follow_up_questions: z.array(z.string()),
  created_at: z.string()
});

export type CreditFile = z.infer<typeof creditFileSchema>;
export type EvidenceStatusItem = z.infer<typeof evidenceStatusItemSchema>;
export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;
export type EvidenceMapRow = z.infer<typeof evidenceMapRowSchema>;
export type EvidenceMapResponse = z.infer<typeof evidenceMapResponseSchema>;
export type CaseInboxResponse = z.infer<typeof caseInboxResponseSchema>;
export type CaseInboxLane = z.infer<typeof caseInboxLaneSchema>;
export type CopilotChatResponse = z.infer<typeof copilotChatResponseSchema>;
export type CopilotBrief = z.infer<typeof copilotBriefSchema>;
