"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, Server, Shield, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
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
    <AppShell title="Governance & Audit" subtitle="System diagnostics, model readiness, and MSME-scoped compliance audit trail.">
      {loading ? <LoadingState label="Loading governance diagnostics..." /> : error ? <ErrorState label="Unable to load diagnostics. Check backend health and readiness endpoints." /> : (
        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
                <div className="flex items-center gap-2 border-b border-line bg-subtle px-5 py-4">
                  <Activity className="h-4 w-4 text-ink" />
                  <h3 className="text-sm font-semibold text-ink">API Status</h3>
                </div>
                <div className="divide-y divide-line">
                  <StatusRow label="Health" value={healthQuery.data?.status ?? "unknown"} isGood={healthQuery.data?.status === "ok"} />
                  <StatusRow label="Service" value={healthQuery.data?.service ?? "unknown"} />
                  <StatusRow label="Version" value={healthQuery.data?.version ?? "unknown"} />
                  <StatusRow label="Environment" value={healthQuery.data?.environment ?? "unknown"} />
                </div>
              </div>

              <div className="rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
                <div className="flex items-center gap-2 border-b border-line bg-subtle px-5 py-4">
                  <Server className="h-4 w-4 text-ink" />
                  <h3 className="text-sm font-semibold text-ink">Readiness Checks</h3>
                </div>
                <div className="divide-y divide-line">
                  {Object.entries(readyQuery.data?.checks ?? {}).map(([key, value]) => (
                    <StatusRow key={key} label={titleize(key)} value={value} isGood={value === "ok"} />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-amber/30 bg-amber/5 p-5 shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-amber mb-3">
                <Shield className="h-4 w-4" />
                Backend-Limited Audit Scope
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-ink/80">
                <p>Portfolio-wide audit endpoint is not available yet. Current phase reads audit events for the selected or first MSME only.</p>
                <p>Provider mode is exposed through readiness checks when configured by the backend.</p>
                <div className="mt-4 rounded-md border border-amber/20 bg-amber/10 p-4 text-ink font-medium">
                  {decisionSupportCopy}
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-md border border-line bg-surface shadow-cockpit overflow-hidden flex flex-col h-[calc(100vh-190px)]">
            <div className="flex items-center justify-between border-b border-line bg-subtle px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-ink" />
                <h3 className="text-sm font-semibold text-ink">MSME Audit Context</h3>
              </div>
              {selectedId ? (
                <Link href={`/msmes/${selectedId}`} className="text-xs font-semibold text-cyan hover:underline">
                  Open Case
                </Link>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto p-5 bg-workspace">
              {selectedId ? (
                <AuditTimeline events={auditQuery.data?.items ?? []} />
              ) : (
                <EmptyState label="No MSME profile is available for MSME-scoped audit lookup." />
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatusRow({ label, value, isGood }: { label: string; value: string; isGood?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
      <span className="text-muted font-medium">{label}</span>
      <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${isGood ? 'bg-positive/10 border-positive/20 text-positive' : 'bg-subtle border-line text-ink'}`}>
        {value}
      </span>
    </div>
  );
}
