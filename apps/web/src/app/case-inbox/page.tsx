"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronRight, FileQuestion, MapPin, Search, Sparkles, TimerReset } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DataConfidencePill, RiskTierPill } from "@/components/ui/Pills";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { getCaseInbox } from "@/lib/api/credit-file";
import { formatInr, titleize } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const laneIcons = {
  ready_for_review: CheckCircle2,
  missing_evidence: FileQuestion,
  risk_attention: AlertTriangle,
  high_potential: Sparkles,
  low_confidence: TimerReset
};

export default function CaseInboxPage() {
  const query = useQuery({ queryKey: ["case-inbox"], queryFn: getCaseInbox, staleTime: 60_000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hasCases = query.data?.lanes.some((lane) => lane.cases.length);

  return (
    <AppShell title="Case Inbox" subtitle="Underwriting queue grouped by risk, readiness, and missing evidence.">
      {query.isLoading ? <LoadingState label="Loading underwriting queue..." /> : query.isError ? (
        <ErrorState label="Unable to load the case inbox from the backend." />
      ) : !hasCases ? (
        <EmptyState label="No MSME cases are currently in the queue." />
      ) : (
        <InboxWorkspace data={query.data!} selectedId={selectedId} onSelect={setSelectedId} />
      )}
    </AppShell>
  );
}

function InboxWorkspace({ data, selectedId, onSelect }: { data: any, selectedId: string | null, onSelect: (id: string) => void }) {
  const allCases = data.lanes.flatMap((lane: any) => lane.cases.map((c: any) => ({ ...c, lane })));
  const selectedCase = selectedId ? allCases.find((c: any) => c.item.id === selectedId) : allCases[0];

  return (
    <div className="flex h-[calc(100vh-190px)] gap-5">
      {/* Left List Pane */}
      <div className="flex w-2/3 flex-col rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
        <div className="border-b border-line bg-subtle px-4 py-3">
          <div className="flex items-center justify-between text-sm font-semibold text-ink">
            <span>Underwriting Queue</span>
            <span className="rounded bg-line px-2 py-0.5 text-xs text-muted">{allCases.length} files</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-0">
          {data.lanes.map((lane: any) => {
            if (!lane.cases.length) return null;
            const Icon = laneIcons[lane.lane as keyof typeof laneIcons] || Search;
            return (
              <div key={lane.lane} className="border-b border-line last:border-b-0">
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-subtle/95 px-4 py-2 text-xs font-semibold text-muted backdrop-blur">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="uppercase tracking-wider">{lane.label}</span>
                </div>
                <div className="divide-y divide-line">
                  {lane.cases.map((c: any) => {
                    const isSelected = selectedCase?.item.id === c.item.id;
                    const blocker = c.score.missing_data_warnings[0] ?? c.score.early_warning_triggers[0]?.label ?? c.score.recommended_human_action;
                    return (
                      <button
                        key={c.item.id}
                        onClick={() => onSelect(c.item.id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-4 px-4 py-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-amber",
                          isSelected ? "bg-subtle" : "bg-surface hover:bg-subtle/50"
                        )}
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-ink truncate">{c.item.business_name}</span>
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-amber shrink-0" />}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted">
                            <span className="flex items-center gap-1 shrink-0"><MapPin className="h-3 w-3" /> {c.item.city}</span>
                            <span className="shrink-0">/</span>
                            <span className="truncate">{titleize(c.item.segment)}</span>
                            {blocker && (
                              <>
                                <span className="shrink-0">/</span>
                                <span className="truncate text-danger/80">Needs: {blocker}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                           <span className="text-sm font-medium text-ink">{formatInr(c.item.requested_credit_amount)}</span>
                           <RiskTierPill tier={c.score.risk_tier} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Context Pane */}
      {selectedCase ? (
        <div className="flex w-1/3 flex-col rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
          <div className="border-b border-line bg-subtle px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">Credit File Preview</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-serif font-bold text-ink mb-1">{selectedCase.item.business_name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted">
                <MapPin className="h-3.5 w-3.5" />
                <span>{selectedCase.item.city}</span>
                <span>/</span>
                <span>{titleize(selectedCase.item.segment)}</span>
              </div>
            </div>
            
            <div className="mb-8 flex gap-6">
              <div>
                <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Requested</div>
                <div className="text-lg font-semibold text-ink">{formatInr(selectedCase.item.requested_credit_amount)}</div>
              </div>
              <div className="w-px bg-line" />
              <div>
                <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Score</div>
                <div className="text-lg font-semibold text-ink">{selectedCase.score.score}<span className="text-sm text-muted">/100</span></div>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              {/* Blockers & Action */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-ink border-b border-line pb-1.5">Risk & Action</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <RiskTierPill tier={selectedCase.score.risk_tier} />
                  <DataConfidencePill value={selectedCase.score.data_confidence} />
                </div>
                
                {selectedCase.score.missing_data_warnings?.length > 0 && (
                   <div className="rounded-md border border-danger/20 bg-danger/5 p-3 text-sm text-danger flex items-start gap-2">
                     <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                     <div>
                       <span className="font-semibold block mb-0.5">Missing Evidence</span>
                       <span className="opacity-90">{selectedCase.score.missing_data_warnings[0]}</span>
                     </div>
                   </div>
                )}

                <div className="rounded-md bg-subtle p-3 text-sm text-ink flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber shrink-0" />
                  <div>
                    <span className="font-semibold block mb-0.5">Recommended Human Action</span>
                    <span className="text-muted">{selectedCase.prospect.next_best_action}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-line">
              <Link
                href={`/msmes/${selectedCase.item.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy"
              >
                Open Full Credit File
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-1/3 items-center justify-center rounded-md border border-line bg-surface text-sm text-muted shadow-cockpit">
          Select a case to preview
        </div>
      )}
    </div>
  );
}
