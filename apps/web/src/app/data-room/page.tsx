"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, Clock, Search, ExternalLink, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/State";
import { getCreditFile } from "@/lib/api/credit-file";
import { getPortfolioCases } from "@/lib/api/portfolio";
import { formatInr, titleize } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function DataRoomPage() {
  const casesQuery = useQuery({ queryKey: ["portfolio", "cases"], queryFn: getPortfolioCases, staleTime: 60_000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? casesQuery.data?.items[0]?.item.id ?? "";
  const fileQuery = useQuery({ queryKey: ["credit-file", activeId], queryFn: () => getCreditFile(activeId), enabled: Boolean(activeId), staleTime: 60_000 });
  const cases = casesQuery.data?.items ?? [];
  const activeCase = cases.find((item) => item.item.id === activeId);

  return (
    <AppShell title="Data Room" subtitle="Organized borrower evidence records and source verification status for the selected credit file.">
      {casesQuery.isLoading ? <LoadingState label="Loading evidence repository..." /> : casesQuery.isError ? (
        <ErrorState label="Unable to load portfolio cases for the data room." />
      ) : !cases.length ? (
        <EmptyState label="No cases found in the repository." />
      ) : (
        <div className="flex h-[calc(100vh-190px)] gap-5">
          <VaultSidebar cases={cases} activeId={activeId} onSelect={setSelectedId} />
          
          {fileQuery.isLoading ? (
            <div className="flex-1 flex flex-col rounded-md border border-line bg-surface shadow-cockpit items-center justify-center">
              <LoadingState label="Opening selected data vault..." />
            </div>
          ) : fileQuery.isError || !fileQuery.data ? (
            <div className="flex-1 flex flex-col rounded-md border border-line bg-surface shadow-cockpit items-center justify-center">
              <ErrorState label="Unable to load selected credit file evidence." />
            </div>
          ) : (
            <VaultContent data={fileQuery.data} activeCase={activeCase} />
          )}
        </div>
      )}
    </AppShell>
  );
}

function VaultSidebar({ cases, activeId, onSelect }: { cases: any[], activeId: string, onSelect: (id: string) => void }) {
  return (
    <div className="flex w-1/4 min-w-[280px] flex-col rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
      <div className="border-b border-line bg-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Active Files</h3>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-line p-0">
        {cases.map(({ item, score }) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "w-full px-4 py-3 text-left transition-colors hover:bg-subtle",
              activeId === item.id ? "bg-panel2" : "bg-surface"
            )}
          >
            <div className="font-semibold text-ink truncate">{item.business_name}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span className="truncate">{titleize(item.segment)}</span>
              <span className="font-medium text-ink">Score: {score.score}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function VaultContent({ data, activeCase }: { data: any, activeCase: any }) {
  return (
    <div className="flex flex-1 flex-col rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-subtle px-6 py-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">{data.profile.business_name} / Evidence Vault</h2>
          <div className="mt-1 text-xs text-muted">
            Requested: <span className="font-medium text-ink">{formatInr(data.profile.requested_credit_amount)}</span>
            <span className="mx-2">/</span>
            Readiness Score: <span className="font-medium text-ink">{activeCase?.score.score ?? data.score.score}</span>
          </div>
        </div>
        <Link href={`/msmes/${data.profile.id}`} className="flex items-center gap-2 rounded bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm border border-line hover:bg-subtle transition-colors">
          Open Credit File
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-workspace">
        {data.evidence_status.map((record: any) => {
          const statusLower = record.status.toLowerCase();
          const isMissing = statusLower.includes("missing");
          const isStale = statusLower.includes("stale") || statusLower.includes("expired");
          const isVerified = statusLower.includes("verified") || statusLower.includes("active");
          
          return (
            <div key={record.source_type} className="flex flex-col rounded-md border border-line bg-surface p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between gap-5">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-ink text-base">{record.source_label}</div>
                  <div className={cn(
                    "flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wider",
                    isMissing ? "bg-danger/10 text-danger" :
                    isStale ? "bg-amber/10 text-amber" :
                    isVerified ? "bg-positive/10 text-positive" :
                    "bg-line text-muted"
                  )}>
                    {isMissing && <ShieldAlert className="h-3 w-3" />}
                    {isStale && <Clock className="h-3 w-3" />}
                    {isVerified && <CheckCircle2 className="h-3 w-3" />}
                    {!isMissing && !isStale && !isVerified && <AlertCircle className="h-3 w-3" />}
                    {titleize(record.status)}
                  </div>
                </div>
                
                <p className="text-sm text-muted leading-relaxed">{record.why_it_matters}</p>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted pt-2">
                  <span className="flex items-center gap-1.5 bg-subtle px-2 py-1 rounded">
                    Score Component: <span className="text-ink">{titleize(record.related_score_component)}</span>
                  </span>
                </div>
              </div>
              
              <div className="shrink-0 pt-1">
                <button 
                  type="button" 
                  disabled={!record.action_enabled} 
                  title={record.disabled_reason ?? record.action_label} 
                  className="w-full sm:w-auto rounded bg-navy px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-navy shadow-sm"
                >
                  {record.action_label}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
