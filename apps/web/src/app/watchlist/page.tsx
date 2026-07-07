"use client";

import { AlertTriangle, FileQuestion, ShieldAlert, Siren } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { HumanActionQueue, MetricTile, RightInspectorPanel, SignalTable } from "@/components/ui/Cockpit";
import { Panel } from "@/components/ui/Panel";
import { DataConfidencePill, RiskTierPill, SeverityPill } from "@/components/ui/Pills";
import { isWatched, usePortfolioCases } from "@/hooks/usePortfolioCases";

export default function WatchlistPage() {
  const { cases, isLoading, isError, seedAndRefresh } = usePortfolioCases();
  const watched = cases.filter(isWatched);
  const selected = watched[0];
  const missingDocs = watched.reduce((sum, item) => sum + (item.score?.missing_data_warnings.length ?? 0), 0);
  const activeSignals = watched.reduce((sum, item) => sum + (item.score?.early_warning_triggers.length ?? 0), 0);
  const escalated = watched.filter((item) => ["high", "elevated"].includes(item.score?.risk_tier ?? "")).length;

  return (
    <AppShell title="Watchlist" subtitle="Monitored MSMEs that need attention based on backend score outputs.">
      {isLoading ? <LoadingState /> : isError ? <ErrorState label="Unable to load watchlist signals from backend-backed score outputs." /> : !cases.length ? (
        <EmptyState label="No MSME profiles found. Seed demo data to start the credit intelligence walkthrough." onSeed={seedAndRefresh} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total Watched Accounts" value={watched.length} icon={<ShieldAlert className="h-5 w-5" />} note="Derived from score warnings and risk" />
            <MetricTile label="Escalated Cases" value={escalated} icon={<Siren className="h-5 w-5" />} note="Elevated or high risk" />
            <MetricTile label="Missing Document Signals" value={missingDocs} icon={<FileQuestion className="h-5 w-5" />} note="From missing_data_warnings" />
            <MetricTile label="Active Risk Signals" value={activeSignals} icon={<AlertTriangle className="h-5 w-5" />} note="From early_warning_triggers" />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
            <SignalTable cases={watched} title="Watchlist Cases" />
            <RightInspectorPanel title={selected?.item.business_name ?? "Watchlist Inspector"} actionHref={selected ? `/msmes/${selected.item.id}` : undefined}>
              {selected ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted">Risk Tier</div>
                      <div className="mt-1"><RiskTierPill tier={selected.score?.risk_tier} /></div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Data Confidence</div>
                      <div className="mt-1"><DataConfidencePill value={selected.score?.data_confidence} /></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-semibold">Key Triggers</div>
                    <div className="space-y-2">
                      {(selected.score?.early_warning_triggers ?? []).map((trigger) => (
                        <div key={trigger.code} className="rounded border border-line p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{trigger.label}</span>
                            <SeverityPill severity={trigger.severity} />
                          </div>
                          <p className="mt-1 text-muted">{trigger.condition}</p>
                        </div>
                      ))}
                      {!selected.score?.early_warning_triggers.length ? <div className="text-sm text-muted">No early warning triggers; watch status comes from confidence, documents, or recommendation.</div> : null}
                    </div>
                  </div>
                </div>
              ) : <div className="text-sm text-muted">No accounts match the watchlist definition.</div>}
            </RightInspectorPanel>
          </div>
          <Panel title="Follow-up Action Queue">
            <HumanActionQueue cases={watched} />
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
