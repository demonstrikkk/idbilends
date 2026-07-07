import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { DataConfidencePill, RecommendationPill, RiskTierPill, SeverityPill } from "@/components/ui/Pills";
import type { PortfolioCase } from "@/hooks/usePortfolioCases";
import { formatInr, titleize } from "@/lib/formatters";

export function MetricTile({ label, value, note, icon }: { label: string; value: ReactNode; note?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-surface p-4 shadow-cockpit">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-muted">{label}</div>
        {icon ? <div className="text-cyan">{icon}</div> : null}
      </div>
      <div className="mt-3 text-2xl font-semibold text-ink">{value}</div>
      {note ? <div className="mt-2 text-xs text-muted">{note}</div> : null}
    </div>
  );
}

export function SignalTable({ cases, title = "Cases" }: { cases: PortfolioCase[]; title?: string }) {
  return (
    <Panel title={title}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
          <thead className="bg-subtle text-[11px] uppercase tracking-[0.04em] text-muted">
            <tr>
              <th className="border-b border-line px-4 py-3 font-semibold">MSME</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Segment</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Score</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Risk Tier</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Confidence</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Requested</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Suggested Range</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Recommendation</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Recommended Human Action</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(({ item, score, prospect }) => (
              <tr key={item.id} className="border-b border-line hover:bg-[#f2f6fb]">
                <td className="px-4 py-3">
                  <Link href={`/msmes/${item.id}`} className="font-semibold text-ink hover:text-cyan">{item.business_name}</Link>
                  <div className="text-xs text-muted">{item.city}, {item.state}</div>
                </td>
                <td className="px-4 py-3">{titleize(item.segment)}</td>
                <td className="px-4 py-3 font-semibold">{score?.score ?? item.health_score ?? "--"}</td>
                <td className="px-4 py-3"><RiskTierPill tier={score?.risk_tier ?? item.risk_tier} /></td>
                <td className="px-4 py-3"><DataConfidencePill value={score?.data_confidence ?? item.data_confidence} /></td>
                <td className="px-4 py-3">{formatInr(item.requested_credit_amount)}</td>
                <td className="px-4 py-3">{score ? `${formatInr(score.suggested_credit_min)} - ${formatInr(score.suggested_credit_max)}` : "Not available"}</td>
                <td className="px-4 py-3"><RecommendationPill recommendation={score?.recommendation} /></td>
                <td className="max-w-[300px] px-4 py-3 text-xs leading-5 text-muted">{prospect?.next_best_action ?? item.recommended_human_action ?? "Backend signal unavailable."}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function RightInspectorPanel({ title, children, actionHref }: { title: string; children: ReactNode; actionHref?: string }) {
  return (
    <aside className="rounded-md border border-line bg-surface shadow-cockpit">
      <div className="flex min-h-12 items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {actionHref ? (
          <Link href={actionHref} className="inline-flex items-center gap-1 text-xs font-semibold text-cyan">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </aside>
  );
}

export function FactorBarList({ factors }: { factors: { label: string; value: number; severity?: string }[] }) {
  return (
    <div className="space-y-3">
      {factors.map((factor) => (
        <div key={factor.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-ink">{factor.label}</span>
            <span className="text-muted">{factor.value}</span>
          </div>
          <div className="h-2 rounded-full bg-panel2">
            <div className="h-2 rounded-full bg-positive" style={{ width: `${Math.min(100, Math.max(0, factor.value))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocumentGapStrip({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return <div className="text-sm text-muted">No missing-evidence warnings returned by the backend score service.</div>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {warnings.map((warning) => (
        <div key={warning} className="rounded border border-amber/25 bg-amber/10 px-3 py-2 text-xs text-ink">
          {warning}
        </div>
      ))}
    </div>
  );
}

export function HumanActionQueue({ cases }: { cases: PortfolioCase[] }) {
  return (
    <div className="divide-y divide-line">
      {cases.slice(0, 6).map(({ item, score, prospect }) => (
        <Link key={item.id} href={`/msmes/${item.id}`} className="block px-4 py-3 hover:bg-[#f2f6fb]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-ink">{item.business_name}</div>
              <div className="mt-1 text-xs text-muted">{prospect?.next_best_action ?? score?.recommended_human_action ?? "Open case for backend-backed review."}</div>
            </div>
            <SeverityPill severity={score?.risk_tier === "high" ? "high" : score?.data_confidence && score.data_confidence < 65 ? "medium" : "low"} />
          </div>
        </Link>
      ))}
      {!cases.length ? <div className="p-4 text-sm text-muted">No cases require action in the current backend-backed view.</div> : null}
    </div>
  );
}
