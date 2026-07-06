import { z } from "zod";
import { prospectPrioritySchema } from "./common";

export const prospectSignalSchema = z.object({
  code: z.string(),
  label: z.string(),
  direction: z.string(),
  confidence: z.number(),
  evidence: z.string()
});

export const prospectOutputSchema = z.object({
  id: z.string(),
  msme_id: z.string(),
  prospect_score: z.number(),
  priority: prospectPrioritySchema,
  likely_credit_need: z.string(),
  best_product_fit: z.string(),
  next_best_action: z.string(),
  outreach_timing: z.string(),
  signals: z.array(prospectSignalSchema),
  created_at: z.string()
});

export type ProspectOutput = z.infer<typeof prospectOutputSchema>;
export type ProspectSignal = z.infer<typeof prospectSignalSchema>;
