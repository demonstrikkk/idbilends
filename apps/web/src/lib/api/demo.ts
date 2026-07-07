import { z } from "zod";
import { apiFetch } from "./client";

const seedResponseSchema = z.object({
  seeded: z.boolean(),
  profile_count: z.number(),
  scenario_counts: z.record(z.number()),
  audit_event_id: z.string(),
  generated_at: z.string()
});

export type SeedRequest = {
  reset: boolean;
  seed: number;
  profile_count: number;
};

export function seedDemoData(payload: SeedRequest) {
  return apiFetch("/demo/seed", seedResponseSchema, {
    method: "POST",
    body: payload
  });
}
