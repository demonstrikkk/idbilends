import type { ProspectOutput } from "@/lib/schemas/prospect";
import { titleize } from "@/lib/formatters";

export function ProspectPriorityCard({ prospect }: { prospect: ProspectOutput }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
      <div className="border border-cyan/40 bg-cyan/10 p-4 text-center">
        <div className="text-3xl font-semibold text-cyan">{prospect.prospect_score}</div>
        <div className="mt-1 text-xs text-muted">Prospect score</div>
        <div className="mt-3 border border-cyan/30 px-2 py-1 text-xs font-medium text-cyan">{titleize(prospect.priority)}</div>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs text-muted">Likely credit need</div>
          <div className="mt-1 font-medium">{titleize(prospect.likely_credit_need)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Product fit</div>
          <div className="mt-1 font-medium">{titleize(prospect.best_product_fit)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Outreach timing</div>
          <div className="mt-1 font-medium">{titleize(prospect.outreach_timing)}</div>
        </div>
      </div>
    </div>
  );
}
