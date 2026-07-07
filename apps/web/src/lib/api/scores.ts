import { apiFetch } from "./client";
import { scoreOutputSchema, type ScoreOutput } from "@/lib/schemas/score";

export function generateScore(msmeId: string, options: { persist?: boolean; includeTrace?: boolean } = {}): Promise<ScoreOutput> {
  return apiFetch(`/scores/${msmeId}/generate`, scoreOutputSchema, {
    method: "POST",
    body: { persist: options.persist ?? true, include_trace: options.includeTrace ?? true }
  });
}
