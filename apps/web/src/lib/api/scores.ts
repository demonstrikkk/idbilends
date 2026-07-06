import { apiFetch } from "./client";
import { scoreOutputSchema, type ScoreOutput } from "@/lib/schemas/score";

export function generateScore(msmeId: string): Promise<ScoreOutput> {
  return apiFetch(`/scores/${msmeId}/generate`, scoreOutputSchema, {
    method: "POST",
    body: { persist: true, include_trace: true }
  });
}
