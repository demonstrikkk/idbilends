import { z } from "zod";

export const monitoringEventTypeSchema = z.enum([
  "bank_balance_drop",
  "revenue_growth_change",
  "gst_filing_delayed",
  "bank_statement_received",
  "itr_received",
  "bureau_report_received",
  "invoice_delay_increased",
  "buyer_concentration_increased",
  "bounce_event_recorded",
  "emi_burden_increased",
  "gem_order_completed",
  "suspicious_revenue_spike",
  "sector_stress_changed",
  "market_overlay_changed"
]);

export const monitoringStatusSchema = z.object({
  running: z.boolean(),
  event_count: z.number(),
  last_event_at: z.string().nullable(),
  session_id: z.string().nullable().optional(),
  is_running: z.boolean().optional(),
  last_started_at: z.string().nullable().optional(),
  active_connections: z.number().optional()
});

export const scoreMovementSchema = z.object({
  msme_id: z.string(),
  business_name: z.string(),
  segment: z.string(),
  city: z.string(),
  branch: z.string().nullable(),
  previous_score: z.number().nullable(),
  new_score: z.number(),
  delta: z.number(),
  previous_risk_tier: z.string().nullable(),
  new_risk_tier: z.string(),
  reason: z.string(),
  event_id: z.string().nullable(),
  created_at: z.string()
});

export const monitoringEventSchema = z.object({
  id: z.string(),
  msme_id: z.string(),
  event_type: monitoringEventTypeSchema,
  label: z.string(),
  severity: z.string(),
  feature_changes: z.record(z.union([z.string(), z.number(), z.null()])),
  created_at: z.string()
});

export const monitoringEventsResponseSchema = z.object({
  items: z.array(monitoringEventSchema)
});

export const monitoringBoardResponseSchema = z.object({
  status: monitoringStatusSchema,
  score_movements: z.array(scoreMovementSchema),
  top_deteriorating: z.array(scoreMovementSchema),
  top_improving: z.array(scoreMovementSchema),
  feature_missingness_summary: z.record(z.number()),
  drift_indicators: z.record(z.number())
});

export const monitoringEventResultSchema = z.object({
  event: monitoringEventSchema,
  score_history: z.object({
    id: z.string(),
    msme_id: z.string(),
    previous_score: z.number().nullable(),
    new_score: z.number(),
    delta: z.number(),
    changed_components: z.array(z.string()),
    changed_features: z.array(z.string()),
    event_id: z.string().nullable(),
    created_at: z.string()
  }).passthrough()
});

export type MonitoringEventType = z.infer<typeof monitoringEventTypeSchema>;
export type MonitoringEvent = z.infer<typeof monitoringEventSchema>;
export type ScoreMovement = z.infer<typeof scoreMovementSchema>;
export type MonitoringBoardResponse = z.infer<typeof monitoringBoardResponseSchema>;
