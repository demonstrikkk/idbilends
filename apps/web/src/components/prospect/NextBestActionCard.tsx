import { ClipboardCheck } from "lucide-react";

export function NextBestActionCard({ action }: { action: string }) {
  return (
    <div className="border border-cyan/30 bg-cyan/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan">
        <ClipboardCheck className="h-4 w-4" />
        Next best human action
      </div>
      <p className="text-sm leading-5 text-slate-200">{action}</p>
    </div>
  );
}
