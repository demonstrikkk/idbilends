import { AlertTriangle, Database, Loader2 } from "lucide-react";
import { seedDemoData } from "@/lib/api/demo";

export function LoadingState({ label = "Loading credit intelligence..." }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-md border border-line bg-surface p-8 text-sm text-muted">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center rounded-md border border-danger/30 bg-danger/5 p-6 text-sm text-ink">
      <AlertTriangle className="mr-3 h-5 w-5 text-danger" />
      {label}
    </div>
  );
}

export function EmptyState({ label, onSeed }: { label: string; onSeed?: () => void }) {
  return (
    <div className="rounded-md border border-line bg-surface p-8 text-sm text-muted">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 text-cyan" />
        <div>
          <p>{label}</p>
          {onSeed ? (
            <button onClick={onSeed} className="mt-4 rounded bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-navy">
              Seed Demo Data
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export async function runSeedDemoData() {
  return seedDemoData({ reset: true, seed: 42, profile_count: 9 });
}
