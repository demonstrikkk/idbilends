"use client";

import { BookOpen, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { MetricTile, RightInspectorPanel } from "@/components/ui/Cockpit";
import { decisionSupportCopy } from "@/lib/constants";

const references = [
  { label: "Scoring Design", href: "/docs/SCORING_DESIGN.md", note: "Risk tier thresholds, confidence penalties, suggested range logic." },
  { label: "Security Checklist", href: "/docs/SECURITY_CHECKLIST.md", note: "AI safety, secrets, audit, and responsible AI guardrails." },
  { label: "Agentic AI Design", href: "/docs/AGENTIC_AI_DESIGN.md", note: "Phase 3 controlled Credit Copilot graph and tool allowlist." }
];

export default function PolicyCenterPage() {
  return (
    <AppShell title="Policy Center" subtitle="Docs-backed governance view for current backend phase.">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile label="Score Rule Set" value="score_rules_v1" icon={<ShieldCheck className="h-5 w-5" />} note="Returned by score outputs" />
          <MetricTile label="Credit Copilot Policy" value="Phase 3" icon={<BookOpen className="h-5 w-5" />} note="Placeholder only in this phase" />
          <MetricTile label="Decision Authority" value="Human Review" note="No final automated credit decision" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <Panel title="Implemented Governance Rules">
            <div className="divide-y divide-line">
              <PolicyRow title="score_rules_v1" body="Deterministic scoring service owns score, risk tier, data confidence, suggested credit range, reason factors, and early-warning triggers." />
              <PolicyRow title="credit_copilot_v1 placeholder" body="Credit Copilot is not enabled in Phase 2.5. Detail pages show deterministic score, prospect, risk, and audit outputs only." />
              <PolicyRow title="Decision-support-only policy" body={decisionSupportCopy} />
              <PolicyRow title="Backend-limited policy store" body="The current backend does not expose a policy database, policy versions table, policy owners, approvals, or changelog service. This page does not fabricate those records." />
            </div>
          </Panel>
          <RightInspectorPanel title="Documentation References">
            <div className="space-y-3">
              {references.map((reference) => (
                <div key={reference.label} className="rounded border border-line bg-subtle p-3 text-sm">
                  <div className="font-semibold">{reference.label}</div>
                  <p className="mt-1 text-xs leading-5 text-muted">{reference.note}</p>
                  <div className="mt-2 text-xs text-cyan">{reference.href}</div>
                </div>
              ))}
            </div>
          </RightInspectorPanel>
        </div>
      </div>
    </AppShell>
  );
}

function PolicyRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[260px_1fr]">
      <div className="font-semibold">{title}</div>
      <p className="leading-6 text-muted">{body}</p>
    </div>
  );
}
