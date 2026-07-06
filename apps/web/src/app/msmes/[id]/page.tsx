"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { ErrorState, LoadingState } from "@/components/ui/State";
import { MSMEIdentityCard } from "@/components/msme/MSMEIdentityCard";
import { ScoreGauge } from "@/components/score/ScoreGauge";
import { DataConfidenceBar } from "@/components/score/DataConfidenceBar";
import { SuggestedLimitCard } from "@/components/score/SuggestedLimitCard";
import { ReasonFactorCard } from "@/components/score/ReasonFactorCard";
import { MissingDataPanel } from "@/components/score/MissingDataPanel";
import { EarlyWarningPanel } from "@/components/risk/EarlyWarningPanel";
import { ProspectPriorityCard } from "@/components/prospect/ProspectPriorityCard";
import { NextBestActionCard } from "@/components/prospect/NextBestActionCard";
import { AuditTimeline } from "@/components/governance/AuditTimeline";
import { CreditCopilotPlaceholder } from "@/components/copilot/CreditCopilotPlaceholder";
import { getAuditEvents } from "@/lib/api/audit";
import { getMSME } from "@/lib/api/msmes";
import { getProspectSignals } from "@/lib/api/prospects";
import { generateScore } from "@/lib/api/scores";
import { formatInr, formatPercent, titleize } from "@/lib/formatters";

export default function MSMEDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const msmeQuery = useQuery({ queryKey: ["msme", id], queryFn: () => getMSME(id), enabled: Boolean(id) });
  const scoreQuery = useQuery({ queryKey: ["score", id], queryFn: () => generateScore(id), enabled: Boolean(id) });
  const prospectQuery = useQuery({ queryKey: ["prospect", id], queryFn: () => getProspectSignals(id), enabled: Boolean(id) });
  const auditQuery = useQuery({ queryKey: ["audit", id], queryFn: () => getAuditEvents(id), enabled: Boolean(id) && scoreQuery.isSuccess && prospectQuery.isSuccess });

  const isLoading = msmeQuery.isLoading || scoreQuery.isLoading || prospectQuery.isLoading;
  const isError = msmeQuery.isError || scoreQuery.isError || prospectQuery.isError;
  const msme = msmeQuery.data;
  const score = scoreQuery.data;
  const prospect = prospectQuery.data;

  return (
    <AppShell>
      {isLoading ? <LoadingState label="Opening credit case and refreshing deterministic outputs..." /> : isError || !msme || !score || !prospect ? (
        <ErrorState label="Unable to load the MSME credit case. Confirm the backend routes for profile, score, and prospect signals are available." />
      ) : (
        <div className="space-y-5">
          <MSMEIdentityCard msme={msme} />
          <div className="grid gap-5 xl:grid-cols-[300px_1fr_360px]">
            <Panel title="Deterministic score spine">
              <div className="space-y-5 p-4">
                <ScoreGauge score={score.score} tier={score.risk_tier} />
                <DataConfidenceBar value={score.data_confidence} />
                <div className="border border-line bg-[#0d1c2a] p-3 text-xs leading-5 text-muted">
                  Rule version: <span className="text-slate-200">{score.rule_version}</span><br />
                  Decision-support flag: <span className="text-slate-200">{String(score.decision_support_only)}</span>
                </div>
              </div>
            </Panel>
            <Panel title="Credit posture">
              <div className="grid gap-5 p-4 lg:grid-cols-[1fr_1fr]">
                <SuggestedLimitCard score={score} />
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <Metric label="Monthly revenue" value={formatInr(msme.financials.monthly_revenue_avg)} />
                    <Metric label="Monthly expenses" value={formatInr(msme.financials.monthly_expense_avg)} />
                    <Metric label="Bank balance" value={formatInr(msme.financials.average_bank_balance)} />
                    <Metric label="Existing debt" value={formatInr(msme.financials.existing_debt)} />
                    <Metric label="Buyer concentration" value={formatPercent(msme.financials.buyer_concentration)} />
                    <Metric label="GST-like regularity" value={formatPercent(msme.financials.gst_filing_regularity)} />
                    <Metric label="Bounce count 3m" value={String(msme.financials.bounce_count_3m)} />
                    <Metric label="Invoice delay" value={`${msme.financials.invoice_delay_avg_days} days`} />
                  </div>
                </div>
              </div>
            </Panel>
            <Panel title="Prospect readiness">
              <div className="space-y-4 p-4">
                <ProspectPriorityCard prospect={prospect} />
                <NextBestActionCard action={prospect.next_best_action} />
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <Panel title="Positive score factors">
              <div className="grid gap-3 p-4">
                {score.positive_factors.map((factor) => <ReasonFactorCard key={factor.code} factor={factor} />)}
              </div>
            </Panel>
            <Panel title="Negative score factors">
              <div className="grid gap-3 p-4">
                {score.negative_factors.length ? score.negative_factors.map((factor) => <ReasonFactorCard key={factor.code} factor={factor} />) : <div className="text-sm text-muted">No negative factors returned by the score service.</div>}
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Panel title="Evidence ledger">
              <div className="space-y-6 p-4">
                <MissingDataPanel warnings={score.missing_data_warnings} />
                <DocumentLedger documents={msme.documents} />
              </div>
            </Panel>
            <Panel title="Risk intelligence">
              <div className="space-y-6 p-4">
                <EarlyWarningPanel triggers={score.early_warning_triggers} />
                <div>
                  <div className="mb-3 text-sm font-semibold">Calculation trace</div>
                  <div className="space-y-2">
                    {score.calculation_trace.map((trace) => (
                      <div key={trace.component} className="border border-line bg-[#0d1c2a] p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{titleize(trace.component)}</span>
                          <span className="text-xs text-muted">{trace.awarded_points}/{trace.max_points}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-300">{trace.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <Panel title="Credit Copilot">
              <div className="p-4">
                <CreditCopilotPlaceholder />
              </div>
            </Panel>
            <Panel title="Audit timeline placeholder">
              <AuditTimeline events={auditQuery.data?.items ?? []} />
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-[#0d1c2a] p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function DocumentLedger({ documents }: { documents: { [key: string]: string | string[] } }) {
  const keys = ["bank_statement", "gst_returns", "udyam", "bureau_report", "itr", "gem_profile"];
  return (
    <div>
      <div className="mb-3 text-sm font-semibold">Document status</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {keys.map((key) => (
          <div key={key} className="flex items-center justify-between border border-line bg-[#0d1c2a] px-3 py-2 text-sm">
            <span>{titleize(key)}</span>
            <span className="text-xs text-muted">{titleize(String(documents[key]))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
