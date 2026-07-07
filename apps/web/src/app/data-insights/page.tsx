"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FactorBarList, MetricTile } from "@/components/ui/Cockpit";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { Panel } from "@/components/ui/Panel";
import { usePortfolioCases } from "@/hooks/usePortfolioCases";
import { formatInr, titleize } from "@/lib/formatters";

export default function DataInsightsPage() {
  const { cases, isLoading, isError, seedAndRefresh } = usePortfolioCases();
  const scored = cases.filter((item) => item.score);
  const avgScore = avg(scored.map((item) => item.score?.score ?? 0));
  const avgProspect = avg(cases.map((item) => item.prospect?.prospect_score ?? item.item.prospect_score ?? 0));
  const avgConfidence = avg(scored.map((item) => item.score?.data_confidence ?? 0));
  const warningIncidence = cases.length ? Math.round((cases.filter((item) => (item.score?.early_warning_triggers.length ?? 0) > 0).length / cases.length) * 100) : 0;
  const exposure = cases.reduce((sum, item) => sum + item.item.requested_credit_amount, 0);

  return (
    <AppShell title="Data Insights" subtitle="Portfolio-level analytics derived from backend profile, score, and prospect outputs.">
      {isLoading ? <LoadingState /> : isError ? <ErrorState label="Unable to load backend-backed data insights." /> : !cases.length ? (
        <EmptyState label="No MSME profiles found. Seed demo data to start the credit intelligence walkthrough." onSeed={seedAndRefresh} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricTile label="Total Borrowers" value={cases.length} note="GET /msmes" />
            <MetricTile label="Avg. Health Score" value={avgScore} note="Score outputs" />
            <MetricTile label="Avg. Prospect Score" value={avgProspect} note="Prospect outputs" />
            <MetricTile label="Avg. Data Confidence" value={`${avgConfidence}%`} note="Score outputs" />
            <MetricTile label="Total Requested Exposure" value={formatInr(exposure)} note="Profile requested amounts" />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.9fr]">
            <Panel title="Average Health Score by Segment">
              <div className="p-4"><FactorBarList factors={segmentStats(cases, "score")} /></div>
            </Panel>
            <Panel title="Document Completeness by Segment">
              <div className="p-4"><FactorBarList factors={segmentStats(cases, "confidence")} /></div>
            </Panel>
            <Panel title="Portfolio Insights (Ranked)">
              <div className="divide-y divide-line">
                {rankedInsights(cases).map((insight, index) => (
                  <div key={insight} className="flex gap-3 px-4 py-3 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-panel2 text-xs font-semibold">{index + 1}</span>
                    <p className="leading-6">{insight}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <Panel title="Early Warning Incidence by Segment">
              <div className="p-4"><FactorBarList factors={segmentStats(cases, "warnings")} /></div>
            </Panel>
            <Panel title="Top Negative Factor Prevalence">
              <div className="p-4"><FactorBarList factors={negativeFactorPrevalence(cases)} /></div>
            </Panel>
            <Panel title="Prospect Score vs Data Confidence">
              <div className="space-y-2 p-4">
                {cases.map((item) => (
                  <div key={item.item.id} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-xs">
                    <span className="truncate font-medium">{item.item.business_name}</span>
                    <div className="h-2 rounded-full bg-panel2">
                      <div className="h-2 rounded-full bg-cyan" style={{ width: `${item.prospect?.prospect_score ?? item.item.prospect_score ?? 0}%` }} />
                    </div>
                    <span className="text-muted">{item.score?.data_confidence ?? item.item.data_confidence ?? "--"}%</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <div className="rounded-md border border-line bg-surface px-4 py-3 text-xs text-muted">
            Early warning incidence is {warningIncidence}% of current backend profiles. Historical trend analytics are not shown because the backend does not persist score-history series in this phase.
          </div>
        </div>
      )}
    </AppShell>
  );
}

function avg(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 0;
}

function segmentStats(cases: ReturnType<typeof usePortfolioCases>["cases"], mode: "score" | "confidence" | "warnings") {
  const groups = new Map<string, typeof cases>();
  for (const item of cases) groups.set(item.item.segment, [...(groups.get(item.item.segment) ?? []), item]);
  return Array.from(groups, ([segment, rows]) => {
    const value = mode === "score"
      ? avg(rows.map((item) => item.score?.score ?? item.item.health_score ?? 0))
      : mode === "confidence"
        ? avg(rows.map((item) => item.score?.data_confidence ?? item.item.data_confidence ?? 0))
        : Math.round((rows.filter((item) => (item.score?.early_warning_triggers.length ?? 0) > 0).length / rows.length) * 100);
    return { label: titleize(segment), value };
  }).sort((a, b) => b.value - a.value);
}

function negativeFactorPrevalence(cases: ReturnType<typeof usePortfolioCases>["cases"]) {
  const counts = new Map<string, number>();
  for (const item of cases) for (const factor of item.score?.negative_factors ?? []) counts.set(factor.label, (counts.get(factor.label) ?? 0) + 1);
  return Array.from(counts, ([label, count]) => ({ label, value: Math.round((count / Math.max(cases.length, 1)) * 100) })).sort((a, b) => b.value - a.value).slice(0, 6);
}

function rankedInsights(cases: ReturnType<typeof usePortfolioCases>["cases"]) {
  const lowConfidence = cases.filter((item) => (item.score?.data_confidence ?? 100) < 70).length;
  const warningCases = cases.filter((item) => (item.score?.early_warning_triggers.length ?? 0) > 0).length;
  const topSegment = segmentStats(cases, "score")[0]?.label ?? "No segment";
  return [
    `${topSegment} leads current average health score among available segments.`,
    `${lowConfidence} cases have data confidence below 70% and should be verified before credit discussions.`,
    `${warningCases} cases have at least one early-warning trigger returned by the scoring service.`,
    "Top negative factors are counted directly from score reason codes, not from frontend scoring logic."
  ];
}
