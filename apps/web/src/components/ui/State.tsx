import { AlertTriangle, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading credit intelligence..." }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center border border-line bg-panel/70 p-8 text-sm text-muted">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center border border-danger/40 bg-danger/10 p-6 text-sm text-slate-200">
      <AlertTriangle className="mr-3 h-5 w-5 text-danger" />
      {label}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <div className="border border-line bg-panel/60 p-8 text-sm text-muted">{label}</div>;
}
