import { z } from "zod";
import { paginationSchema } from "./common";
import { msmeListItemSchema } from "./msme";
import { prospectOutputSchema } from "./prospect";
import { scoreOutputSchema } from "./score";

export const portfolioCaseSchema = z.object({
  item: msmeListItemSchema,
  score: scoreOutputSchema,
  prospect: prospectOutputSchema
});

export const portfolioCasesResponseSchema = z.object({
  items: z.array(portfolioCaseSchema),
  pagination: paginationSchema.nullable().optional()
});

export const commandCenterCaseSchema = z.object({
  msme_id: z.string(),
  business_name: z.string(),
  segment: z.string(),
  city: z.string(),
  state: z.string(),
  branch: z.string().nullable(),
  zone: z.string().nullable(),
  relationship_manager: z.string().nullable(),
  requested_credit_amount: z.number(),
  policy_score: z.number(),
  market_adjusted_score: z.number(),
  score_delta: z.number(),
  risk_tier: z.string(),
  data_confidence: z.number(),
  top_blocker: z.string(),
  missing_evidence_count: z.number(),
  active_alert_count: z.number(),
  latest_event: z.string().nullable(),
  latest_event_at: z.string().nullable(),
  recommended_human_action: z.string(),
  prospect_priority: z.string(),
  suggested_credit_min: z.number(),
  suggested_credit_max: z.number(),
  last_updated: z.string(),
  case_stage: z.string(),
  monitoring_status: z.string()
});

export const commandCenterCasesResponseSchema = z.object({
  items: z.array(commandCenterCaseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  sort: z.string(),
  applied_filters: z.record(z.string()),
  available_facets: z.record(z.array(z.string())),
  facets: z.record(z.array(z.string())),
  counts_by_saved_view: z.record(z.number()),
  page_summary: z.object({
    returned: z.number(),
    needing_action: z.number(),
    score_dropped: z.number(),
    missing_evidence: z.number(),
    high_potential_low_confidence: z.number()
  })
});

export type PortfolioCase = z.infer<typeof portfolioCaseSchema>;
export type PortfolioCasesResponse = z.infer<typeof portfolioCasesResponseSchema>;
export type CommandCenterCase = z.infer<typeof commandCenterCaseSchema>;
export type CommandCenterCasesResponse = z.infer<typeof commandCenterCasesResponseSchema>;
