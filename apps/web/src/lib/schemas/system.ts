import { z } from "zod";

export const healthSchema = z.object({
  status: z.string(),
  service: z.string(),
  version: z.string(),
  environment: z.string()
});

export const readySchema = z.object({
  status: z.string(),
  checks: z.record(z.string())
});

export type HealthStatus = z.infer<typeof healthSchema>;
export type ReadyStatus = z.infer<typeof readySchema>;
