import { apiFetch } from "./client";
import { API_BASE_URL } from "@/lib/constants";
import {
  caseInboxResponseSchema,
  copilotChatResponseSchema,
  creditFileSchema,
  evidenceMapResponseSchema,
  evidenceRecordSchema,
  type CaseInboxResponse,
  type CopilotChatResponse,
  type CreditFile,
  type EvidenceMapResponse,
  type EvidenceRecord
} from "@/lib/schemas/credit-file";
import { z } from "zod";

export function getCaseInbox(): Promise<CaseInboxResponse> {
  return apiFetch("/case-inbox", caseInboxResponseSchema);
}

export function getCreditFile(msmeId: string): Promise<CreditFile> {
  return apiFetch(`/credit-file/${msmeId}`, creditFileSchema);
}

export function getEvidenceMap(msmeId: string): Promise<EvidenceMapResponse> {
  return apiFetch(`/credit-file/${msmeId}/evidence-map`, evidenceMapResponseSchema);
}

export function getEvidenceRecords(msmeId: string): Promise<EvidenceRecord[]> {
  return apiFetch(`/credit-file/${msmeId}/evidence`, z.array(evidenceRecordSchema));
}

export function getEvidenceRecord(msmeId: string, evidenceId: string): Promise<EvidenceRecord> {
  return apiFetch(`/credit-file/${msmeId}/evidence/${evidenceId}`, evidenceRecordSchema);
}

export function updateEvidenceStatus(msmeId: string, evidenceId: string, status: string): Promise<EvidenceRecord> {
  return apiFetch(`/credit-file/${msmeId}/evidence/${evidenceId}/status`, evidenceRecordSchema, {
    method: "PATCH",
    body: { status }
  });
}

export function uploadEvidence(msmeId: string, file: File, sourceType = "uploaded_document", status = "partial") {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("source_type", sourceType);
  formData.set("status", status);
  return apiFetch(`/credit-file/${msmeId}/evidence/upload`, z.object({ record: evidenceRecordSchema, audit_event_id: z.string() }), {
    method: "POST",
    formData
  });
}

export function evidenceFileUrl(msmeId: string, evidenceId: string) {
  return new URL(`/credit-file/${msmeId}/evidence/${evidenceId}/file`, API_BASE_URL).toString();
}

export function sendCopilotChat(msmeId: string, message: string, mode?: string): Promise<CopilotChatResponse> {
  return apiFetch(`/copilot/${msmeId}/chat`, copilotChatResponseSchema, {
    method: "POST",
    body: { message, mode, include_trace: true }
  });
}
