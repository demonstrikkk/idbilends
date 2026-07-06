import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ScoreFactor } from "@/lib/schemas/score";
import { titleize } from "@/lib/formatters";

export function ReasonFactorCard({ factor }: { factor: ScoreFactor }) {
  const positive = factor.direction === "positive";
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <article className="border border-line bg-[#0d1c2a] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon className={positive ? "h-4 w-4 text-cyan" : "h-4 w-4 text-amber"} />
            <h3 className="text-sm font-semibold text-slate-100">{factor.label}</h3>
          </div>
          <div className="mt-1 text-xs text-muted">{titleize(factor.category)} / {titleize(factor.severity)}</div>
        </div>
        <span className={positive ? "text-sm font-semibold text-cyan" : "text-sm font-semibold text-amber"}>{factor.impact > 0 ? "+" : ""}{factor.impact}</span>
      </div>
      <p className="mt-3 text-sm leading-5 text-slate-300">{factor.evidence}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {factor.source_fields.map((field) => (
          <span key={field} className="border border-line px-2 py-1 text-[11px] text-muted">{field}</span>
        ))}
      </div>
    </article>
  );
}
