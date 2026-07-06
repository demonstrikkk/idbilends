import { AlertTriangle } from "lucide-react";
import type { EarlyWarningTrigger } from "@/lib/schemas/score";
import { titleize } from "@/lib/formatters";

export function EarlyWarningPanel({ triggers }: { triggers: EarlyWarningTrigger[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4 text-amber" />
        Early-warning triggers
      </div>
      {triggers.length ? (
        <div className="space-y-2">
          {triggers.map((trigger) => (
            <div key={trigger.code} className="border border-line bg-[#0d1c2a] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{trigger.label}</div>
                <span className="border border-amber/40 px-2 py-1 text-xs text-amber">{titleize(trigger.severity)}</span>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-300">{trigger.condition}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-line bg-[#0d1c2a] p-3 text-sm text-muted">No early-warning triggers returned by the deterministic score service.</div>
      )}
    </div>
  );
}
