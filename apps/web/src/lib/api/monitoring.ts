import { API_BASE_URL } from "@/lib/constants";
import { apiFetch } from "./client";
import {
  monitoringBoardResponseSchema,
  monitoringEventsResponseSchema,
  monitoringEventResultSchema,
  monitoringStatusSchema,
  type MonitoringBoardResponse,
  type MonitoringEventType
} from "@/lib/schemas/monitoring";

export function getMonitoringBoard(): Promise<MonitoringBoardResponse> {
  return apiFetch("/monitoring/live-cases", monitoringBoardResponseSchema);
}

export function getMonitoringEvents(limit = 100) {
  return apiFetch("/monitoring/events", monitoringEventsResponseSchema, { searchParams: { limit } });
}

export function getMonitoringStatus() {
  return apiFetch("/monitoring/status", monitoringStatusSchema);
}

export function startMonitoring() {
  return apiFetch("/monitoring/start", monitoringStatusSchema, { method: "POST" });
}

export function stopMonitoring() {
  return apiFetch("/monitoring/stop", monitoringStatusSchema, { method: "POST" });
}

export function createManualMonitoringEvent(event_type: MonitoringEventType, msme_id?: string) {
  return apiFetch("/monitoring/events/manual", monitoringEventResultSchema, { method: "POST", body: { event_type, msme_id } });
}

export function monitoringWebSocketUrl() {
  const url = new URL("/ws/monitoring", API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
