import { z } from "zod";

export const traceStepSchema = z.object({
  step_id: z.string(),
  step_name: z.string(),
  step_type: z.enum(["tool", "agent_node", "provider"]),
  status: z.enum(["success", "failure", "skipped"]),
  input_refs: z.array(z.string()),
  output_ref: z.string().nullable(),
  error_code: z.string().nullable(),
  notes: z.string().nullable()
});

export const copilotBriefSchema = z.object({
  id: z.string(),
  msme_id: z.string(),
  answer_markdown: z.string(),
  summary: z.string(),
  executive_summary: z.string(),
  data_quality_observations: z.string(),
  credit_analyst_explanation: z.string(),
  prospect_assist_recommendation: z.string(),
  risk_investigator_findings: z.string(),
  final_lending_brief: z.string(),
  confidence: z.enum(["low", "medium", "medium_high", "high"]),
  assumptions: z.array(z.string()),
  follow_up_questions: z.array(z.string()),
  recommended_human_action: z.string(),
  decision_support_only: z.literal(true),
  cited_internal_inputs: z.array(z.string()),
  trace: z.array(traceStepSchema),
  provider: z.string(),
  model: z.string(),
  prompt_version: z.string(),
  created_at: z.string()
});

export const copilotProviderStatusSchema = z.object({
  configured_provider: z.string(),
  groq_configured: z.boolean(),
  user_facing_ai_enabled: z.boolean(),
  available_user_modes: z.array(z.string()),
  stream_model: z.string(),
  structured_model: z.string(),
  active_provider: z.string(),
  message: z.string().nullable()
});

export type CopilotBrief = z.infer<typeof copilotBriefSchema>;
export type TraceStep = z.infer<typeof traceStepSchema>;
export type CopilotProviderStatus = z.infer<typeof copilotProviderStatusSchema>;
