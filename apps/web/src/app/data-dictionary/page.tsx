"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";

const rows = [
  ["score", "ScoreOutput", "Backend-owned deterministic 0-100 financial health score."],
  ["risk_tier", "ScoreOutput", "Backend-derived tier: very_low, moderate_low, moderate, elevated, high."],
  ["data_confidence", "ScoreOutput", "Backend-owned data-quality score after document and signal penalties."],
  ["suggested_credit_min/max", "ScoreOutput", "Backend-owned suggested credit range for human review."],
  ["early_warning_triggers", "ScoreOutput", "Backend risk service triggers based on financial signals."],
  ["prospect_score", "ProspectSignalOutput", "Backend Prospect Assist credit-readiness score."],
  ["next_best_action", "ProspectSignalOutput", "Backend-generated relationship manager action guidance."],
  ["audit events", "AuditEvent", "Backend audit trail for seed, score, prospect, and future Copilot actions."]
];

export default function DataDictionaryPage() {
  return (
    <AppShell title="Data Dictionary" subtitle="Current frontend-facing backend fields and ownership boundaries.">
      <Panel title="Frontend-Visible Fields">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-subtle text-[11px] uppercase tracking-[0.04em] text-muted">
              <tr>
                <th className="border-b border-line px-4 py-3">Field</th>
                <th className="border-b border-line px-4 py-3">Source</th>
                <th className="border-b border-line px-4 py-3">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-b border-line">
                  <td className="px-4 py-3 font-semibold">{row[0]}</td>
                  <td className="px-4 py-3">{row[1]}</td>
                  <td className="px-4 py-3 text-muted">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
