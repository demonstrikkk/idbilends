import { z } from "zod";

export const paginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  has_more: z.boolean()
});

export const riskTierSchema = z.enum(["very_low", "moderate_low", "moderate", "elevated", "high"]);
export const prospectPrioritySchema = z.enum(["very_high", "high", "medium", "low", "not_ready"]);
