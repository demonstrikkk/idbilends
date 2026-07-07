"use client";

import Link from "next/link";
import { AlertOctagon, AlertTriangle, FileQuestion, UserCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricTile, RightInspectorPanel } from "@/components/ui/Cockpit";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { SeverityPill } from "@/components/ui/Pills";
import { usePortfolioCases } from "@/hooks/usePortfolioCases";
import { titleize } from "@/lib/formatters";

type AlertRow = {
  id: string;
  msmeId: string;
  business: string;
  location: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  action: string;
  evidence: string;
};

export default function AlertsPage() {
  const { cases, isLoading, isError, seedAndRefresh } = usePortfolioCases();
  const alerts: AlertRow[] = cases.flatMap(({ item, score }) => {
    if (!score) return [];
    const warningAlerts = score.early_warning_triggers.map((trigger) => ({
      id: `${item.id}-${trigger.code}`,
      msmeId: item.id,
      business: item.business_name,
      location: `${item.city}, ${item.state}`,
      type: trigger.code,
      severity: severityFor(trigger.code, trigger.severity),
      action: score.recommended_human_action,
      evidence: trigger.condition
    }));
    const missingAlerts = score.missing_data_warnings.map((warning, index) => ({
      id: `${item.id}-missing-${index}`,
      msmeId: item.id,
      business: item.business_name,
      location: `${item.city}, ${item.state}`,
      type: "document_gap",
      severity: warningSeverity(warning, score.data_confidence),
      action: "Request missing or incomplete documents before relying on the signal.",
      evidence: warning
    }));
    return [...warningAlerts, ...missingAlerts];
  });
  const selected = alerts[0];
  const critical = alerts.filter((alert) => alert.severity === "critical" || alert.severity === "high").length;
  const medium = alerts.filter((alert) => alert.severity === "medium").length;
  const low = alerts.filter((alert) => alert.severity === "low").length;
  const review = cases.filter((item) => item.score?.recommendation === "review_required" || item.score?.recommendation === "insufficient_data").length;

  return (
    <AppShell title="Alerts" subtitle="Risk signals and data quality issues requiring human attention.">
      {isLoading ? <LoadingState /> : isError ? <ErrorState label="Unable to load alerts from backend score outputs." /> : !cases.length ? (
        <EmptyState label="No MSME profiles found. Seed demo data to start the credit intelligence walkthrough." onSeed={seedAndRefresh} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Critical / High Alerts" value={critical} icon={<AlertOctagon className="h-5 w-5" />} note="Immediate human attention" />
            <MetricTile label="Medium Alerts" value={medium} icon={<AlertTriangle className="h-5 w-5" />} note="Monitor and act soon" />
            <MetricTile label="Low-Confidence Flags" value={low} icon={<FileQuestion className="h-5 w-5" />} note="Review before credit action" />
            <MetricTile label="Cases Requiring Human Review" value={review} icon={<UserCheck className="h-5 w-5" />} note="From recommendation output" />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <div className="rounded-md border border-line bg-surface shadow-cockpit">
              <div className="border-b border-line px-4 py-3 text-sm font-semibold">Alert Register</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-subtle text-[11px] uppercase tracking-[0.04em] text-muted">
                    <tr>
                      <th className="border-b border-line px-4 py-3">Severity</th>
                      <th className="border-b border-line px-4 py-3">Alert Type</th>
                      <th className="border-b border-line px-4 py-3">Related MSME</th>
                      <th className="border-b border-line px-4 py-3">Recommended Human Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert.id} className="border-b border-line hover:bg-[#f2f6fb]">
                        <td className="px-4 py-3"><SeverityPill severity={alert.severity} /></td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{titleize(alert.type)}</div>
                          <div className="text-xs text-muted">{alert.evidence}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/msmes/${alert.msmeId}`} className="font-semibold text-ink hover:text-cyan">{alert.business}</Link>
                          <div className="text-xs text-muted">{alert.location}</div>
                        </td>
                        <td className="max-w-[360px] px-4 py-3 text-xs leading-5 text-muted">{alert.action}</td>
                      </tr>
                    ))}
                    {!alerts.length ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-sm text-muted">No alert rows can be derived from current backend score outputs.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
            <RightInspectorPanel title={selected ? titleize(selected.type) : "Alert Inspector"} actionHref={selected ? `/msmes/${selected.msmeId}` : undefined}>
              {selected ? (
                <div className="space-y-4 text-sm">
                  <SeverityPill severity={selected.severity} />
                  <div>
                    <div className="text-xs text-muted">MSME</div>
                    <div className="font-semibold">{selected.business}</div>
                    <div className="text-xs text-muted">{selected.location}</div>
                  </div>
                  <div className="rounded border border-line bg-subtle p-3">
                    <div className="text-xs font-semibold text-muted">Supporting Evidence</div>
                    <p className="mt-2 leading-6">{selected.evidence}</p>
                  </div>
                  <div className="rounded border border-line bg-subtle p-3">
                    <div className="text-xs font-semibold text-muted">Next Step (Human Action)</div>
                    <p className="mt-2 leading-6">{selected.action}</p>
                  </div>
                </div>
              ) : <div className="text-sm text-muted">No alert selected.</div>}
            </RightInspectorPanel>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function severityFor(code: string, severity: string): AlertRow["severity"] {
  if (code.includes("suspicious") || code.includes("debt_stress")) return "critical";
  if (code.includes("revenue_drop")) return severity === "high" ? "critical" : "medium";
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

function warningSeverity(warning: string, confidence: number): AlertRow["severity"] {
  if (/bank statement/i.test(warning)) return "medium";
  if (/gst/i.test(warning)) return "medium";
  if (confidence < 60) return "medium";
  return "low";
}
