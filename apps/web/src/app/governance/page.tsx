"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { ErrorState, LoadingState } from "@/components/ui/State";
import { getHealth, getReadiness } from "@/lib/api/system";
import { getMSMEs } from "@/lib/api/msmes";
import { getAuditEvents } from "@/lib/api/audit";
import { AuditTimeline } from "@/components/governance/AuditTimeline";
import { decisionSupportCopy } from "@/lib/constants";
import { titleize } from "@/lib/formatters";

export default function GovernancePage() {
  const healthQuery = useQuery({ queryKey: ["health"], queryFn: getHealth });
  const readyQuery = useQuery({ queryKey: ["ready"], queryFn: getReadiness });
  const msmesQuery = useQuery({ queryKey: ["msmes", "governance"], queryFn: () => getMSMEs({ limit: 1 }) });
  const selectedId = msmesQuery.data?.items[0]?.id;
  const auditQuery = useQuery({ queryKey: ["audit", selectedId], queryFn: () => getAuditEvents(selectedId as string), enabled: Boolean(selectedId) });

  const loading = healthQuery.isLoading || readyQuery.isLoading || msmesQuery.isLoading;
  const error = healthQuery.isError || readyQuery.isError || msmesQuery.isError;

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Governance diagnostics</h1>
        <p className="mt-2 text-sm text-muted">Operational status, rule visibility, provider mode, and audit trail context for the Phase 2 cockpit.</p>
      </div>
      {loading ? <LoadingState label="Loading governance diagnostics..." /> : error ? <ErrorState label="Unable to load diagnostics. Check backend health and readiness endpoints." /> : (
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <Panel title="API status">
              <div className="divide-y divide-line">
                <StatusRow label="Health" value={healthQuery.data?.status ?? "unknown"} />
                <StatusRow label="Service" value={healthQuery.data?.service ?? "unknown"} />
                <StatusRow label="Version" value={healthQuery.data?.version ?? "unknown"} />
                <StatusRow label="Environment" value={healthQuery.data?.environment ?? "unknown"} />
              </div>
            </Panel>
            <Panel title="Readiness checks">
              <div className="divide-y divide-line">
                {Object.entries(readyQuery.data?.checks ?? {}).map(([key, value]) => (
                  <StatusRow key={key} label={titleize(key)} value={value} />
                ))}
              </div>
            </Panel>
            <Panel title="Governance placeholders">
              <div className="space-y-3 p-4 text-sm leading-6 text-slate-300">
                <p>Score rule version is surfaced from score responses on MSME detail pages.</p>
                <p>Prompt version, provider trace, and agent-node audit will be populated in Phase 3 when Credit Copilot is implemented.</p>
                <p className="border border-amber/40 bg-amber/10 p-3 text-slate-200">{decisionSupportCopy}</p>
              </div>
            </Panel>
          </div>
          <Panel title="Latest MSME audit context" action={selectedId ? <Link href={`/msmes/${selectedId}`} className="text-xs text-cyan">Open case</Link> : null}>
            <AuditTimeline events={auditQuery.data?.items ?? []} />
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="border border-line bg-[#0d1c2a] px-2 py-1 text-xs font-medium text-slate-200">{value}</span>
    </div>
  );
}
