import type { AuditEvent } from "@/lib/schemas/audit";
import { formatDateTime, titleize } from "@/lib/formatters";

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (!events.length) {
    return <div className="p-4 text-sm text-muted">No audit events are available for this MSME context yet.</div>;
  }
  return (
    <ol className="divide-y divide-line">
      {events.map((event) => (
        <li key={event.id} className="grid gap-2 px-4 py-4 md:grid-cols-[180px_1fr]">
          <div className="text-xs text-muted">{formatDateTime(event.created_at)}</div>
          <div>
            <div className="text-sm font-semibold">{titleize(event.event_type)}</div>
            <div className="mt-1 text-xs text-muted">Actor: {event.actor} / Request: {event.request_id ?? "not recorded"}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
