import { formatInr, titleize } from "@/lib/formatters";
import type { ScoreOutput } from "@/lib/schemas/score";

export function SuggestedLimitCard({ score }: { score: ScoreOutput }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted">Suggested credit range</div>
        <div className="mt-2 text-2xl font-semibold leading-tight">
          {formatInr(score.suggested_credit_min)} - {formatInr(score.suggested_credit_max)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted">Requested</div>
          <div className="mt-1 font-medium">{formatInr(score.requested_credit_amount)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Recommendation</div>
          <div className="mt-1 font-medium">{titleize(score.recommendation)}</div>
        </div>
      </div>
      <div className="border border-amber/40 bg-amber/10 p-3 text-sm leading-5 text-slate-200">{score.recommended_human_action}</div>
    </div>
  );
}
