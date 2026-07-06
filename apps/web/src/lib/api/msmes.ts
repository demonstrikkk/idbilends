import { apiFetch } from "./client";
import { msmeDetailSchema, msmeListResponseSchema, type MSMEDetail, type MSMEListResponse } from "@/lib/schemas/msme";

export type MSMEListParams = {
  search?: string;
  risk_tier?: string;
  prospect_priority?: string;
  sort?: string;
  limit?: number;
  offset?: number;
};

export function getMSMEs(params: MSMEListParams = {}): Promise<MSMEListResponse> {
  return apiFetch("/msmes", msmeListResponseSchema, { searchParams: { limit: 50, sort: "prospect_score_desc", ...params } });
}

export function getMSME(id: string): Promise<MSMEDetail> {
  return apiFetch(`/msmes/${id}`, msmeDetailSchema);
}
