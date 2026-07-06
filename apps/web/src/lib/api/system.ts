import { apiFetch } from "./client";
import { healthSchema, readySchema, type HealthStatus, type ReadyStatus } from "@/lib/schemas/system";

export function getHealth(): Promise<HealthStatus> {
  return apiFetch("/health", healthSchema);
}

export function getReadiness(): Promise<ReadyStatus> {
  return apiFetch("/ready", readySchema);
}
