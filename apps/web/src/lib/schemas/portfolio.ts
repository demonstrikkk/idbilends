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

export type PortfolioCase = z.infer<typeof portfolioCaseSchema>;
export type PortfolioCasesResponse = z.infer<typeof portfolioCasesResponseSchema>;
