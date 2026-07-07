"use client";

import { BarChart3, FileQuestion, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { HumanActionQueue, MetricTile, SignalTable } from "@/components/ui/Cockpit";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { isReviewRequired, usePortfolioCases } from "@/hooks/usePortfolioCases";
import { formatInr, titleize } from "@/lib/formatters";

export default function PortfolioPage() {
  const { cases, isLoading, isError, seedAndRefresh } = usePortfolioCases();
  const requestedExposure = cases.reduce((sum, item) => sum + item.item.requested_credit_amount, 0);
  const activeReviews = cases.filter((item) => item.score).length;
  const verification = cases.filter((item) => (item.score?.missing_data_warnings.length ?? 0) > 0).length;
  const recommended = cases.filter((item) => item.score?.recommendation === "consider_with_conditions").length;
  const needsAttention = cases.filter(isReviewRequired);

  return (
    <AppShell title="Portfolio Exposure & Risk" subtitle="Overview of active MSME credit cases across the lending workflow.">
      {isLoading ? <LoadingState /> : isError ? <ErrorState label="Unable to load portfolio from backend-backed profile and score outputs." /> : !cases.length ? (
        <EmptyState label="No MSME profiles found. Seed demo data to start the credit intelligence walkthrough." onSeed={seedAndRefresh} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total Requested Exposure" value={formatInr(requestedExposure)} icon={<BarChart3 className="h-5 w-5" />} note={`Across ${cases.length} active files`} />
            <MetricTile label="Active Credit Reviews" value={activeReviews} icon={<Users className="h-5 w-5" />} note="Score endpoint returned output" />
            <MetricTile label="Verification Cases" value={verification} icon={<FileQuestion className="h-5 w-5" />} note="Missing-data warnings present" />
            <MetricTile label="Conditionally Considered" value={recommended} icon={<ShieldCheck className="h-5 w-5" />} note="Human review still required" />
          </div>
          
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <div className="rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
                <div className="border-b border-line bg-subtle px-5 py-4">
                  <h3 className="text-sm font-semibold text-ink">Portfolio by Workflow Stage</h3>
                </div>
                <div className="grid gap-px bg-line md:grid-cols-4">
                  {workflowStages(cases).map((stage) => (
                    <div key={stage.label} className="bg-surface p-5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted">{stage.label}</div>
                      <div className="mt-2 text-3xl font-bold text-ink">{stage.count}</div>
                      <div className="mt-1 text-sm font-medium text-muted">{formatInr(stage.exposure)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
                <div className="border-b border-line bg-subtle px-5 py-4">
                  <h3 className="text-sm font-semibold text-ink">Active Portfolio Cases</h3>
                </div>
                <div className="p-0">
                  <SignalTable cases={cases} />
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
                <div className="border-b border-line bg-danger/10 px-5 py-4">
                  <h3 className="text-sm font-semibold text-danger">Needs Immediate Attention</h3>
                </div>
                <div className="p-0">
                  <HumanActionQueue cases={needsAttention} />
                </div>
              </div>
              
              <div className="rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
                <div className="border-b border-line bg-subtle px-5 py-4">
                  <h3 className="text-sm font-semibold text-ink">Decision Mix</h3>
                </div>
                <div className="space-y-1 p-4 text-sm">
                  {recommendationMix(cases).map((row) => (
                    <div key={row.label} className="flex items-center justify-between rounded p-2 hover:bg-subtle/50 transition-colors">
                      <span className="text-muted">{titleize(row.label)}</span>
                      <span className="font-semibold text-ink">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function workflowStages(cases: ReturnType<typeof usePortfolioCases>["cases"]) {
  const stageFor = (recommendation?: string, confidence?: number) => {
    if (confidence != null && confidence < 65) return "Verification";
    if (recommendation === "consider_with_conditions") return "Credit Assessment";
    if (recommendation === "review_required" || recommendation === "consider_lower_limit") return "Human Review";
    if (recommendation === "not_recommended_without_rework" || recommendation === "insufficient_data") return "Rework";
    return "Intake";
  };
  return ["Intake", "Verification", "Credit Assessment", "Human Review"].map((label) => {
    const filtered = cases.filter((item) => stageFor(item.score?.recommendation, item.score?.data_confidence) === label);
    return { label, count: filtered.length, exposure: filtered.reduce((sum, item) => sum + item.item.requested_credit_amount, 0) };
  });
}

function recommendationMix(cases: ReturnType<typeof usePortfolioCases>["cases"]) {
  const counts = new Map<string, number>();
  for (const item of cases) counts.set(item.score?.recommendation ?? "score_unavailable", (counts.get(item.score?.recommendation ?? "score_unavailable") ?? 0) + 1);
  return Array.from(counts, ([label, count]) => ({ label, count }));
}
