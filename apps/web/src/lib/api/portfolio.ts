import { apiFetch } from "./client";
import { portfolioCasesResponseSchema, type PortfolioCasesResponse } from "@/lib/schemas/portfolio";

export function getPortfolioCases(): Promise<PortfolioCasesResponse> {
  return apiFetch("/portfolio/cases", portfolioCasesResponseSchema);
}
