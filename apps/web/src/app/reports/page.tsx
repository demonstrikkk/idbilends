"use client";

import { Download, FileBarChart, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricTile, SignalTable } from "@/components/ui/Cockpit";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { Panel } from "@/components/ui/Panel";
import { usePortfolioCases } from "@/hooks/usePortfolioCases";

const templates = [
  "Financial Health Review",
  "Prospect Priority Summary",
  "Weekly Alert Digest",
  "Audit Trail Export",
  "Model Governance Snapshot",
  "Credit Review Pack"
];

export default function ReportsPage() {
  const { cases, isLoading, isError, seedAndRefresh } = usePortfolioCases();

  return (
    <AppShell title="Reports" subtitle="Live API-backed exports and backend-limited report history.">
      {isLoading ? <LoadingState /> : isError ? <ErrorState label="Unable to load report source data from backend-backed views." /> : !cases.length ? (
        <EmptyState label="No MSME profiles found. Seed demo data to start the credit intelligence walkthrough." onSeed={seedAndRefresh} />
      ) : (
        <div className="space-y-5">
          <div className="rounded-md border border-amber/25 bg-amber/10 px-4 py-3 text-sm text-ink">
            Report history requires a backend report service. Current phase supports exporting live API-backed views only.
          </div>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {templates.map((template) => (
              <div key={template} className="rounded-md border border-line bg-surface p-4 shadow-cockpit">
                <FileBarChart className="h-5 w-5 text-cyan" />
                <div className="mt-3 text-sm font-semibold">{template}</div>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted"><Lock className="h-3 w-3" /> Backend service required</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricTile label="Current API-Backed Cases" value={cases.length} note="Export source: /msmes + score/prospect outputs" />
            <MetricTile label="Export JSON" value={<ExportButton label="Download" filename="lendsignal-live-cases.json" payload={JSON.stringify(cases, null, 2)} mime="application/json" />} icon={<Download className="h-5 w-5" />} />
            <MetricTile label="Export CSV" value={<ExportButton label="Download" filename="lendsignal-live-cases.csv" payload={toCsv(cases)} mime="text/csv" />} icon={<Download className="h-5 w-5" />} />
          </div>
          <SignalTable cases={cases} title="Live API-Backed Export Preview" />
        </div>
      )}
    </AppShell>
  );
}

function ExportButton({ label, filename, payload, mime }: { label: string; filename: string; payload: string; mime: string }) {
  const href = `data:${mime};charset=utf-8,${encodeURIComponent(payload)}`;
  return <a href={href} download={filename} className="inline-flex rounded bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-navy">{label}</a>;
}

function toCsv(cases: ReturnType<typeof usePortfolioCases>["cases"]) {
  const rows = [
    ["id", "business_name", "segment", "score", "risk_tier", "data_confidence", "requested_credit_amount", "suggested_credit_min", "suggested_credit_max", "recommendation", "prospect_score", "priority"],
    ...cases.map(({ item, score, prospect }) => [
      item.id,
      item.business_name,
      item.segment,
      String(score?.score ?? ""),
      score?.risk_tier ?? "",
      String(score?.data_confidence ?? ""),
      String(item.requested_credit_amount),
      String(score?.suggested_credit_min ?? ""),
      String(score?.suggested_credit_max ?? ""),
      score?.recommendation ?? "",
      String(prospect?.prospect_score ?? item.prospect_score ?? ""),
      prospect?.priority ?? item.prospect_priority ?? ""
    ])
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
}
