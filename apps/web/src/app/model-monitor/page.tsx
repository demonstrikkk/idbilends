"use client";

import { Activity, Gauge, ShieldCheck, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FactorBarList, MetricTile, RightInspectorPanel } from "@/components/ui/Cockpit";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { Panel } from "@/components/ui/Panel";
import { usePortfolioCases } from "@/hooks/usePortfolioCases";

export default function ModelMonitorPage() {
  const { cases, isLoading, isError, seedAndRefresh } = usePortfolioCases();
  const scored = cases.filter((item) => item.score);
  const avgScore = avg(scored.map((item) => item.score?.score ?? 0));
  const avgConfidence = avg(scored.map((item) => item.score?.data_confidence ?? 0));
  const highRiskPct = scored.length ? Math.round((scored.filter((item) => item.score?.risk_tier === "high" || item.score?.risk_tier === "elevated").length / scored.length) * 100) : 0;
  const ruleVersion = scored[0]?.score?.rule_version ?? "score_rules_v1";

  return (
    <AppShell
      title="Model Monitor"
      subtitle="Latest deterministic score outputs, data quality, and governance signals."
      meta={<><span>Rule Version: {ruleVersion}</span><span>Provider: backend configured mode</span><span>Mode: decision-support only</span></>}
    >
      {isLoading ? <LoadingState /> : isError ? <ErrorState label="Unable to load model monitor snapshot from backend score outputs." /> : !cases.length ? (
        <EmptyState label="No MSME profiles found. Seed demo data to start the credit intelligence walkthrough." onSeed={seedAndRefresh} />
      ) : (
        <div className="space-y-5">
          <div className="rounded-md border border-amber/25 bg-amber/10 px-4 py-3 text-sm text-ink">
            Historical monitoring requires persistent score history. Current view uses latest deterministic score outputs.
          </div>
          <Panel title="Governance Header">
            <div className="grid gap-px bg-line md:grid-cols-5">
              <HeaderCell label="Model" value="Deterministic MSME risk engine" />
              <HeaderCell label="Rule Version" value={ruleVersion} />
              <HeaderCell label="Prompt Version" value="credit_copilot_v1 placeholder" />
              <HeaderCell label="Provider Mode" value="Backend readiness value" />
              <HeaderCell label="Mode" value="decision-support only" />
            </div>
          </Panel>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricTile label="Applications Scored" value={scored.length} icon={<Activity className="h-5 w-5" />} note="Latest score outputs" />
            <MetricTile label="Average Score" value={`${avgScore}/100`} icon={<Gauge className="h-5 w-5" />} note="No historical delta shown" />
            <MetricTile label="High / Elevated Risk" value={`${highRiskPct}%`} icon={<TrendingDown className="h-5 w-5" />} note="Risk tier distribution" />
            <MetricTile label="Data Confidence (Avg.)" value={`${avgConfidence}%`} note="Score output field" />
            <MetricTile label="Decision Support Used" value={scored.filter((item) => item.score?.decision_support_only).length} icon={<ShieldCheck className="h-5 w-5" />} note="decision_support_only flag" />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr_390px]">
            <Panel title="Data Confidence Distribution">
              <div className="p-4"><FactorBarList factors={confidenceDistribution(scored)} /></div>
            </Panel>
            <Panel title="Reason Code Prevalence">
              <div className="p-4"><FactorBarList factors={reasonCodePrevalence(cases)} /></div>
            </Panel>
            <RightInspectorPanel title="Governance Overview">
              <div className="space-y-4 text-sm">
                <KV label="Current Rule Set" value={ruleVersion} />
                <KV label="Provider Mode" value="Readiness endpoint exposes ai_provider; no model-history service exists yet." />
                <KV label="Decision Authority" value="Decision-support only; final human review required." />
                <KV label="Documentation" value="SCORING_DESIGN, SECURITY_CHECKLIST, AGENTIC_AI_DESIGN" />
              </div>
            </RightInspectorPanel>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function HeaderCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line pb-3 last:border-0">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 leading-6">{value}</div>
    </div>
  );
}

function avg(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function confidenceDistribution(cases: ReturnType<typeof usePortfolioCases>["cases"]) {
  const buckets = [
    { label: "Very High (90-100)", min: 90, max: 100 },
    { label: "High (75-89)", min: 75, max: 89 },
    { label: "Medium (50-74)", min: 50, max: 74 },
    { label: "Low (0-49)", min: 0, max: 49 }
  ];
  return buckets.map((bucket) => ({
    label: bucket.label,
    value: Math.round((cases.filter((item) => {
      const confidence = item.score?.data_confidence ?? 0;
      return confidence >= bucket.min && confidence <= bucket.max;
    }).length / Math.max(cases.length, 1)) * 100)
  }));
}

function reasonCodePrevalence(cases: ReturnType<typeof usePortfolioCases>["cases"]) {
  const counts = new Map<string, number>();
  for (const item of cases) {
    for (const factor of [...(item.score?.positive_factors ?? []), ...(item.score?.negative_factors ?? [])]) {
      counts.set(factor.label, (counts.get(factor.label) ?? 0) + 1);
    }
  }
  return Array.from(counts, ([label, count]) => ({ label, value: Math.round((count / Math.max(cases.length, 1)) * 100) })).sort((a, b) => b.value - a.value).slice(0, 8);
}
