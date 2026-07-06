import { z } from "zod";
import { paginationSchema } from "./common";

export const financialSnapshotSchema = z.object({
  snapshot_month: z.string(),
  monthly_revenue_avg: z.number(),
  monthly_expense_avg: z.number(),
  average_bank_balance: z.number(),
  cash_inflow_volatility: z.number(),
  revenue_growth_3m: z.number(),
  revenue_growth_6m: z.number(),
  emi_obligation: z.number(),
  existing_debt: z.number(),
  bounce_count_3m: z.number(),
  bounce_count_6m: z.number(),
  gst_filing_regularity: z.number(),
  buyer_concentration: z.number(),
  digital_payment_ratio: z.number(),
  gem_order_completion_rate: z.number().nullable(),
  invoice_delay_avg_days: z.number(),
  cash_deposit_ratio: z.number().nullable(),
  revenue_spike_ratio: z.number().nullable()
});

export const documentStatusSchema = z.object({
  bank_statement: z.string(),
  gst_returns: z.string(),
  udyam: z.string(),
  bureau_report: z.string(),
  itr: z.string(),
  gem_profile: z.string(),
  missing_documents: z.array(z.string()),
  stale_documents: z.array(z.string())
});

export const msmeListItemSchema = z.object({
  id: z.string(),
  business_name: z.string(),
  segment: z.string(),
  scenario_label: z.string(),
  city: z.string(),
  state: z.string(),
  requested_credit_amount: z.number(),
  monthly_revenue_avg: z.number(),
  health_score: z.number().nullable(),
  risk_tier: z.string().nullable(),
  prospect_score: z.number().nullable(),
  prospect_priority: z.string().nullable(),
  data_confidence: z.number().nullable(),
  recommended_human_action: z.string().nullable()
});

export const msmeListResponseSchema = z.object({
  items: z.array(msmeListItemSchema),
  pagination: paginationSchema
});

export const msmeDetailSchema = z.object({
  id: z.string(),
  business_name: z.string(),
  segment: z.string(),
  scenario_label: z.string(),
  city: z.string(),
  state: z.string(),
  business_vintage_months: z.number(),
  employee_count: z.number(),
  requested_credit_amount: z.number(),
  financials: financialSnapshotSchema,
  documents: documentStatusSchema,
  latest_score_id: z.string().nullable(),
  latest_prospect_signal_id: z.string().nullable()
});

export type MSMEListItem = z.infer<typeof msmeListItemSchema>;
export type MSMEListResponse = z.infer<typeof msmeListResponseSchema>;
export type MSMEDetail = z.infer<typeof msmeDetailSchema>;
export type FinancialSnapshot = z.infer<typeof financialSnapshotSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
