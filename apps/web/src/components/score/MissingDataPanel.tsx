import { FileWarning } from "lucide-react";

export function MissingDataPanel({ warnings }: { warnings: string[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <FileWarning className="h-4 w-4 text-amber" />
        Missing or reduced-confidence inputs
      </div>
      {warnings.length ? (
        <ul className="space-y-2">
          {warnings.map((warning) => (
            <li key={warning} className="border border-amber/30 bg-amber/10 p-3 text-sm text-slate-200">{warning}</li>
          ))}
        </ul>
      ) : (
        <div className="border border-line bg-[#0d1c2a] p-3 text-sm text-muted">No missing-data warnings returned by the score service.</div>
      )}
    </div>
  );
}
