import { apiFetch } from "./client";
import { API_BASE_URL } from "@/lib/constants";
import { copilotBriefSchema, copilotProviderStatusSchema, type CopilotBrief, type CopilotProviderStatus } from "@/lib/schemas/copilot";

export function generateCopilotBrief(msmeId: string): Promise<CopilotBrief> {
  return apiFetch(`/copilot/${msmeId}/brief`, copilotBriefSchema, {
    method: "POST",
    body: { include_trace: true }
  });
}

export function getCopilotProviderStatus(): Promise<CopilotProviderStatus> {
  return apiFetch("/copilot/provider/status", copilotProviderStatusSchema);
}

export function copilotStreamUrl(msmeId: string): string {
  return new URL(`/copilot/${msmeId}/brief/stream`, API_BASE_URL).toString();
}
