"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { CreditCopilotPanel } from "@/components/copilot/CreditCopilotPanel";
import { AuditTimeline } from "@/components/governance/AuditTimeline";
import { FactorBarList } from "@/components/ui/Cockpit";
import { DataConfidencePill, RecommendationPill, RiskTierPill, SeverityPill } from "@/components/ui/Pills";
import { ErrorState, LoadingState } from "@/components/ui/State";
import { getCreditFile } from "@/lib/api/credit-file";
import { formatInr, formatPercent, titleize } from "@/lib/formatters";
import type { CreditFile } from "@/lib/schemas/credit-file";
import { cn } from "@/lib/utils";

const sections = [
  { id: "identity", label: "Business Identity" },
  { id: "financials", label: "Financial Records" },
  { id: "documents", label: "Evidence & Documents" },
  { id: "signals", label: "Derived Signals" },
  { id: "posture", label: "Credit Posture" },
  { id: "copilot", label: "AI Copilot" },
  { id: "audit", label: "Audit Trail" }
];

export default function CreditFilePage() {
  const params = useParams<{ id: string }>();
  const [activeId, setActiveId] = useState("identity");
  const query = useQuery({ queryKey: ["credit-file", params.id], queryFn: () => getCreditFile(params.id), enabled: Boolean(params.id), staleTime: 60_000 });
  const file = query.data;

  // Simple scroll spy logic
  const observer = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.current?.observe(el);
    });
    return () => observer.current?.disconnect();
  }, [file]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AppShell
      title={file?.profile.business_name ?? "Credit File"}
      subtitle={file ? `${titleize(file.profile.segment)} / ${file.profile.city}, ${file.profile.state} / Requested ${formatInr(file.profile.requested_credit_amount)}` : "Opening backend credit file"}
      meta={file ? <><span>Rule Version: {file.score.rule_version}</span><span>Score ID: {file.score.id}</span><span>Mode: decision-support only</span></> : undefined}
    >
      {query.isLoading ? <LoadingState label="Opening organized credit file..." /> : query.isError || !file ? (
        <ErrorState label="Unable to load the credit file aggregation endpoint." />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)_340px]">
          <TableOfContents activeId={activeId} onSelect={scrollTo} />
          
          <main className="space-y-12 pb-24">
            <HeaderStrip file={file} />
            
            <section id="identity" className="scroll-mt-24 space-y-4">
              <SectionTitle>Business Identity</SectionTitle>
              <IdentitySection file={file} />
            </section>
            
            <section id="financials" className="scroll-mt-24 space-y-4">
              <SectionTitle>Financial Records</SectionTitle>
              <FinancialSection file={file} />
            </section>
            
            <section id="documents" className="scroll-mt-24 space-y-4">
              <SectionTitle>Evidence & Documents</SectionTitle>
              <DocumentsSection file={file} />
            </section>
            
            <section id="signals" className="scroll-mt-24 space-y-4">
              <SectionTitle>Derived Signals</SectionTitle>
              <SignalsSection file={file} />
            </section>
            
            <section id="posture" className="scroll-mt-24 space-y-4">
              <SectionTitle>Credit Posture</SectionTitle>
              <CreditPostureSection file={file} />
            </section>

            <section id="copilot" className="scroll-mt-24 space-y-4">
              <SectionTitle>AI Copilot Assistant</SectionTitle>
              <div className="rounded-md border border-line bg-surface shadow-cockpit">
                <CreditCopilotPanel msmeId={file.profile.id} />
              </div>
            </section>

            <section id="audit" className="scroll-mt-24 space-y-4">
              <SectionTitle>Audit Trail</SectionTitle>
              <div className="rounded-md border border-line bg-surface p-4 shadow-cockpit">
                <AuditTimeline events={file.audit_summary.latest_events} />
              </div>
            </section>
          </main>
          
          <ReviewRail file={file} onAskCopilot={() => scrollTo("copilot")} />
        </div>
      )}
    </AppShell>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b border-line pb-2 font-serif text-2xl font-semibold text-ink">
      {children}
    </h2>
  );
}

function TableOfContents({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <aside className="sticky top-24 h-fit space-y-1">
      <div className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-muted">File Sections</div>
      <nav className="flex flex-col gap-1 border-l-2 border-line">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={cn(
              "flex w-full items-center justify-between border-l-2 py-1.5 pl-4 pr-3 text-left text-sm transition-colors duration-200 -ml-[2px]",
              activeId === section.id ? "border-amber font-medium text-ink bg-subtle" : "border-transparent text-muted hover:text-ink hover:bg-subtle/50"
            )}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function HeaderStrip({ file }: { file: CreditFile }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-md border border-line bg-surface p-4 shadow-cockpit">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">Readiness Score</div>
        <div className="mt-2 text-2xl font-bold text-ink">{file.score.score}<span className="text-sm font-normal text-muted">/100</span></div>
        <div className="mt-3"><RiskTierPill tier={file.score.risk_tier} /></div>
      </div>
      <div className="rounded-md border border-line bg-surface p-4 shadow-cockpit">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">Data Confidence</div>
        <div className="mt-2 text-2xl font-bold text-ink">{file.score.data_confidence}%</div>
        <div className="mt-3"><DataConfidencePill value={file.score.data_confidence} /></div>
      </div>
      <div className="rounded-md border border-line bg-surface p-4 shadow-cockpit">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">Suggested Range</div>
        <div className="mt-2 text-lg font-bold text-ink">{formatInr(file.score.suggested_credit_min)}</div>
        <div className="text-sm font-medium text-muted">to {formatInr(file.score.suggested_credit_max)}</div>
      </div>
      <div className="rounded-md border border-danger/20 bg-danger/5 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-danger">Current Blocker</div>
        <div className="mt-2 text-sm font-medium text-danger">
          {file.missing_evidence[0] ?? file.risk_warnings[0]?.label ?? "No major blockers"}
        </div>
      </div>
    </div>
  );
}

function IdentitySection({ file }: { file: CreditFile }) {
  const p = file.profile;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <div className="text-xs font-medium text-muted uppercase tracking-wider">Business Name</div>
        <div className="mt-1 font-semibold text-ink">{p.business_name}</div>
      </div>
      <div>
        <div className="text-xs font-medium text-muted uppercase tracking-wider">Segment</div>
        <div className="mt-1 font-semibold text-ink">{titleize(p.segment)}</div>
      </div>
      <div>
        <div className="text-xs font-medium text-muted uppercase tracking-wider">Location</div>
        <div className="mt-1 font-semibold text-ink">{p.city}, {p.state}</div>
      </div>
      <div>
        <div className="text-xs font-medium text-muted uppercase tracking-wider">Vintage</div>
        <div className="mt-1 font-semibold text-ink">{p.business_vintage_months} months</div>
      </div>
    </div>
  );
}

function FinancialSection({ file }: { file: CreditFile }) {
  const f = file.profile.financials;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider">Monthly Rev Avg</div>
          <div className="mt-1 font-semibold text-ink">{formatInr(f.monthly_revenue_avg)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider">Monthly Exp Avg</div>
          <div className="mt-1 font-semibold text-ink">{formatInr(f.monthly_expense_avg)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider">Net Surplus</div>
          <div className="mt-1 font-semibold text-ink">{formatInr(file.transaction_summary.net_monthly_surplus_estimate)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider">Avg Bank Balance</div>
          <div className="mt-1 font-semibold text-ink">{formatInr(f.average_bank_balance)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider">EMI / Revenue</div>
          <div className="mt-1 font-semibold text-ink">{formatPercent(file.transaction_summary.emi_to_revenue_ratio)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider">Digital Payment %</div>
          <div className="mt-1 font-semibold text-ink">{formatPercent(f.digital_payment_ratio)}</div>
        </div>
      </div>
      <div className="rounded-md border border-line bg-surface p-4 shadow-cockpit">
        <h3 className="mb-4 text-sm font-semibold text-ink">Score Calculation Trace</h3>
        <FactorBarList factors={file.score.calculation_trace.map((trace) => ({ label: titleize(trace.component), value: Math.round((trace.awarded_points / trace.max_points) * 100) }))} />
      </div>
    </div>
  );
}

function DocumentsSection({ file }: { file: CreditFile }) {
  return (
    <div className="rounded-md border border-line bg-surface shadow-cockpit">
      <div className="divide-y divide-line">
        {file.evidence_status.map((item) => (
          <div key={item.source_type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
            <div className="flex-1">
              <div className="font-semibold text-ink">{item.source_label}</div>
              <div className="mt-1 text-xs text-muted">{item.why_it_matters}</div>
              <div className="mt-2 text-xs font-medium text-amber">Score Component: {titleize(item.related_score_component)}</div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="text-sm font-medium text-ink">{titleize(item.status)}</div>
              <button type="button" disabled={!item.action_enabled} title={item.disabled_reason ?? item.action_label} className="rounded border border-line bg-subtle px-4 py-1.5 text-xs font-semibold text-ink hover:bg-line disabled:cursor-not-allowed disabled:opacity-50">
                {item.action_label}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalsSection({ file }: { file: CreditFile }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-md border border-line bg-surface shadow-cockpit">
        <div className="border-b border-line bg-subtle/50 px-4 py-3 text-sm font-semibold text-positive">Positive Score Drivers</div>
        <FactorList factors={file.score.positive_factors} />
      </div>
      <div className="rounded-md border border-line bg-surface shadow-cockpit">
        <div className="border-b border-line bg-subtle/50 px-4 py-3 text-sm font-semibold text-danger">Negative Score Drivers</div>
        <FactorList factors={file.score.negative_factors} empty="No negative factors returned." />
      </div>
    </div>
  );
}

function CreditPostureSection({ file }: { file: CreditFile }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 rounded-md border border-line bg-surface p-5 shadow-cockpit">
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider">Recommendation</div>
          <div className="mt-2"><RecommendationPill recommendation={file.score.recommendation} /></div>
        </div>
        <div className="h-10 w-px bg-line"></div>
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider">Requested</div>
          <div className="mt-1 font-semibold text-ink">{formatInr(file.score.requested_credit_amount)}</div>
        </div>
        <div className="h-10 w-px bg-line"></div>
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider">Suggested Range</div>
          <div className="mt-1 font-semibold text-ink">{formatInr(file.score.suggested_credit_min)} - {formatInr(file.score.suggested_credit_max)}</div>
        </div>
      </div>
      
      <div className="rounded-md border border-line bg-surface shadow-cockpit">
        <div className="border-b border-line bg-subtle/50 px-4 py-3 text-sm font-semibold text-ink">Action Queue</div>
        <div className="divide-y divide-line">
          {file.recommended_human_actions.map((action) => (
            <div key={action.label} className="px-5 py-4">
              <div className="font-semibold text-ink">{action.label}</div>
              <p className="mt-1 text-sm text-muted">{action.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewRail({ file, onAskCopilot }: { file: CreditFile; onAskCopilot: () => void }) {
  return (
    <aside className="sticky top-24 h-fit space-y-5 rounded-md border border-line bg-surface p-5 shadow-cockpit">
      <div className="border-b border-line pb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">Final Decision Summary</div>
        <div className="mt-4 text-5xl font-bold text-ink">{file.score.score}<span className="text-xl font-normal text-muted">/100</span></div>
        <div className="mt-4 flex flex-wrap gap-2"><RiskTierPill tier={file.score.risk_tier} /><DataConfidencePill value={file.score.data_confidence} /></div>
      </div>
      
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-muted">Next Best Action</div>
        <p className="mt-2 rounded-md bg-amber/10 p-3 text-sm font-medium text-amber">{file.prospect.next_best_action}</p>
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-muted">Risk Exceptions</div>
        <div className="mt-2 space-y-2">
          {file.risk_warnings.length ? file.risk_warnings.map((warning) => (
            <div key={warning.code} className="rounded border border-line p-3 text-xs bg-subtle">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-ink">{warning.label}</span>
                <SeverityPill severity={warning.severity} />
              </div>
              <p className="text-muted leading-snug">{warning.condition}</p>
            </div>
          )) : (
            <div className="text-sm text-muted italic">No risk exceptions found.</div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button type="button" onClick={onAskCopilot} className="flex h-11 w-full items-center justify-center rounded-md bg-navy text-sm font-medium text-white transition-colors hover:bg-ink shadow-sm">
          Ask AI Copilot
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          AI Copilot is for investigation and drafting only. It cannot approve or reject loans. Final authority remains with the credit officer.
        </p>
      </div>
    </aside>
  );
}

function FactorList({ factors, empty }: { factors: CreditFile["score"]["positive_factors"]; empty?: string }) {
  if (!factors.length) return <div className="p-5 text-sm italic text-muted">{empty}</div>;
  return (
    <div className="divide-y divide-line">
      {factors.map((factor) => (
        <div key={factor.code} className="px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-ink">{factor.label}</div>
            <SeverityPill severity={factor.severity} />
          </div>
          <p className="mt-2 text-sm text-muted">{factor.evidence}</p>
          <div className="mt-3 text-xs font-medium text-muted bg-subtle/50 px-2 py-1 rounded inline-block">Inputs: {factor.source_fields.join(", ")}</div>
        </div>
      ))}
    </div>
  );
}
