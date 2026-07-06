import { BrainCircuit } from "lucide-react";
import { decisionSupportCopy } from "@/lib/constants";

export function CreditCopilotPlaceholder() {
  return (
    <div className="border border-line bg-[#0d1c2a] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <BrainCircuit className="h-4 w-4 text-muted" />
        Credit Copilot placeholder
      </div>
      <p className="mt-3 text-sm leading-5 text-slate-300">
        Phase 2 does not generate AI lending briefs. Phase 3 will add a controlled Credit Copilot workflow that cites internal inputs, shows trace steps, and keeps deterministic scoring as the source of truth.
      </p>
      <p className="mt-3 text-xs text-muted">{decisionSupportCopy}</p>
    </div>
  );
}
