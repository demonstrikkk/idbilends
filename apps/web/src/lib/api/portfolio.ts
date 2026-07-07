import { apiFetch } from "./client";
import { commandCenterCasesResponseSchema, portfolioCasesResponseSchema, type CommandCenterCasesResponse, type PortfolioCasesResponse } from "@/lib/schemas/portfolio";

export type PortfolioCaseQuery = {
  limit?: number;
  offset?: number;
  sort?: string;
  risk_tier?: string;
  segment?: string;
  query?: string;
  city?: string;
  zone?: string;
  branch?: string;
  scenario?: string;
  confidence_band?: string;
  score_movement?: string;
  saved_view?: string;
};

export function getPortfolioCases(params: PortfolioCaseQuery = {}): Promise<PortfolioCasesResponse> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/portfolio/cases${suffix}`, portfolioCasesResponseSchema);
}

export function getCommandCenterCases(params: PortfolioCaseQuery = {}): Promise<CommandCenterCasesResponse> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/command-center/cases${suffix}`, commandCenterCasesResponseSchema);
}
