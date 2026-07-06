import { apiFetch } from "./client";
import { auditListResponseSchema, type AuditListResponse } from "@/lib/schemas/audit";

export function getAuditEvents(msmeId: string): Promise<AuditListResponse> {
  return apiFetch(`/audit/${msmeId}`, auditListResponseSchema, { searchParams: { limit: 25 } });
}
