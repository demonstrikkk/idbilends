import { apiFetch } from "./client";
import {
  caseInboxResponseSchema,
  copilotChatResponseSchema,
  creditFileSchema,
  evidenceMapResponseSchema,
  type CaseInboxResponse,
  type CopilotChatResponse,
  type CreditFile,
  type EvidenceMapResponse
} from "@/lib/schemas/credit-file";

export function getCaseInbox(): Promise<CaseInboxResponse> {
  return apiFetch("/case-inbox", caseInboxResponseSchema);
}

export function getCreditFile(msmeId: string): Promise<CreditFile> {
  return apiFetch(`/credit-file/${msmeId}`, creditFileSchema);
}

export function getEvidenceMap(msmeId: string): Promise<EvidenceMapResponse> {
  return apiFetch(`/credit-file/${msmeId}/evidence-map`, evidenceMapResponseSchema);
}

export function sendCopilotChat(msmeId: string, message: string): Promise<CopilotChatResponse> {
  return apiFetch(`/copilot/${msmeId}/chat`, copilotChatResponseSchema, {
    method: "POST",
    body: { message, mode: "mock", include_trace: true }
  });
}
