"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bot, ChevronLeft, ChevronRight, ExternalLink, Eye, FileSearch, FileUp, Play, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/layout/AppShell";
import { CreditCopilotPanel } from "@/components/copilot/CreditCopilotPanel";
import { DataConfidencePill, RiskTierPill } from "@/components/ui/Pills";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { evidenceFileUrl, getEvidenceRecords, updateEvidenceStatus, uploadEvidence } from "@/lib/api/credit-file";
import { createManualMonitoringEvent, getMonitoringStatus, startMonitoring, stopMonitoring } from "@/lib/api/monitoring";
import { getCommandCenterCases, type PortfolioCaseQuery } from "@/lib/api/portfolio";
import type { CommandCenterCase } from "@/lib/schemas/portfolio";
import type { EvidenceRecord } from "@/lib/schemas/credit-file";
import { formatInr, titleize } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const savedViews = [
  ["all_active_files", "All active files"],
  ["score_dropped_today", "Score dropped today"],
  ["missing_evidence", "Missing evidence"],
  ["high_potential_low_confidence", "High potential + low confidence"],
  ["risk_attention", "Risk attention"],
  ["sector_overlay_affected", "Sector overlay affected"],
  ["rm_action_needed", "RM action needed"],
  ["recently_updated", "Recently updated"]
] as const;

const sorts = [
  ["action_priority_desc", "Action priority"],
  ["score_asc", "Score low to high"],
  ["score_desc", "Score high to low"],
  ["delta_asc", "Worst score delta"],
  ["confidence_asc", "Lowest confidence"],
  ["requested_desc", "Largest request"],
  ["business_name_asc", "Business name"]
] as const;

export default function CommandCenterPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [savedView, setSavedView] = useState("all_active_files");
  const [sort, setSort] = useState("action_priority_desc");
  const [riskTier, setRiskTier] = useState("");
  const [segment, setSegment] = useState("");
  const [zone, setZone] = useState("");
  const [confidenceBand, setConfidenceBand] = useState("");
  const [drawer, setDrawer] = useState<"evidence" | "copilot" | null>(null);
  const limit = 50;

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  const params: PortfolioCaseQuery = useMemo(() => ({
    limit,
    offset: page * limit,
    sort,
    saved_view: savedView,
    query: debouncedSearch,
    risk_tier: riskTier,
    segment,
    zone,
    confidence_band: confidenceBand
  }), [page, sort, savedView, debouncedSearch, riskTier, segment, zone, confidenceBand]);

  const casesQuery = useQuery({ queryKey: ["command-center", params], queryFn: () => getCommandCenterCases(params), staleTime: 20_000 });
  const selectedCase = casesQuery.data?.items.find((item) => item.msme_id === selectedId) ?? casesQuery.data?.items[0] ?? null;

  useEffect(() => {
    if (!selectedId && casesQuery.data?.items[0]) setSelectedId(casesQuery.data.items[0].msme_id);
  }, [casesQuery.data?.items, selectedId]);

  const monitoringStatusQuery = useQuery({ queryKey: ["monitoring-status"], queryFn: getMonitoringStatus, staleTime: 10_000, refetchInterval: 10_000 });
  const isMonitoring = monitoringStatusQuery.data?.is_running ?? false;
  const startMutation = useMutation({ mutationFn: startMonitoring, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["monitoring-status"] }); queryClient.invalidateQueries({ queryKey: ["command-center"] }); } });
  const stopMutation = useMutation({ mutationFn: stopMonitoring, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["monitoring-status"] }); queryClient.invalidateQueries({ queryKey: ["command-center"] }); } });
  const injectMutation = useMutation({
    mutationFn: (msmeId: string) => createManualMonitoringEvent("bank_balance_drop", msmeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["command-center"] })
  });

  return (
    <AppShell
      title="Credit Operations Command Center"
      subtitle="Search, triage, inspect evidence, and explain live score movement across 1000+ synthetic MSME credit files."
      actions={<Button variant="outline" size="sm" asChild><Link href="/case-inbox">Legacy inbox</Link></Button>}
    >
      {casesQuery.isLoading ? <LoadingState label="Loading command center cases..." /> : casesQuery.isError ? (
        <ErrorState label="Unable to load command center cases from the backend." />
      ) : !casesQuery.data ? null : (
        <div className="grid h-[calc(100vh-190px)] min-h-[620px] grid-cols-[250px_minmax(0,1fr)_360px] gap-4 overflow-hidden">
          <aside className="overflow-hidden rounded-lg border border-line bg-surface transition-all duration-200 micro-border-glow">
            <div className="border-b border-line bg-subtle px-4 py-3 text-sm font-semibold text-ink">Saved Views</div>
            <div className="space-y-0.5 overflow-y-auto p-2">
              {savedViews.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setSavedView(id); setPage(0); }}
                  className={cn(
                    "group relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-all duration-150",
                    savedView === id
                      ? "bg-navy text-white shadow-sm"
                      : "text-muted hover:bg-subtle hover:text-ink hover:pl-4"
                  )}
                >
                  <span className="transition-all duration-150">{label}</span>
                  <span className={cn(
                    "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold transition-all duration-150",
                    savedView === id ? "bg-white/20 text-white" : "bg-subtle text-muted group-hover:bg-line"
                  )}>
                    {casesQuery.data.counts_by_saved_view[id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface transition-all duration-200 micro-border-glow">
            <div className="border-b border-line bg-subtle p-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="group flex h-9 min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted transition-all duration-200 focus-within:border-cyan focus-within:shadow-[0_0_0_2px_rgba(3,105,161,0.15)]">
                  <Search className="h-4 w-4 shrink-0 transition-transform duration-200 group-focus-within:scale-110" />
                  <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} className="w-full bg-transparent outline-none" placeholder="Search borrower, branch, zone, segment..." />
                </label>
                <Select label="Sort" value={sort} onChange={(value) => setSort(value)} options={sorts.map(([value, label]) => ({ value, label }))} />
                <Select label="Risk" value={riskTier} onChange={(value) => { setRiskTier(value); setPage(0); }} options={(casesQuery.data.facets.risk_tier ?? []).map((value) => ({ value, label: titleize(value) }))} />
                <Select label="Segment" value={segment} onChange={(value) => { setSegment(value); setPage(0); }} options={(casesQuery.data.facets.segment ?? []).map((value) => ({ value, label: titleize(value) }))} />
                <Select label="Zone" value={zone} onChange={(value) => { setZone(value); setPage(0); }} options={(casesQuery.data.facets.zone ?? []).map((value) => ({ value, label: value }))} />
                <Select label="Confidence" value={confidenceBand} onChange={(value) => { setConfidenceBand(value); setPage(0); }} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span><strong className="text-ink">{casesQuery.data.total}</strong> files</span>
                <span><strong className="text-ink">{casesQuery.data.page_summary.needing_action}</strong> need action</span>
                <span><strong className="text-ink">{casesQuery.data.page_summary.missing_evidence}</strong> missing evidence</span>
                <span><strong className="text-ink">{casesQuery.data.page_summary.score_dropped}</strong> score drops</span>
                <span className="ml-auto flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${isMonitoring ? "bg-positive animate-pulse" : "bg-line"}`} />
                  <span className="text-muted">{isMonitoring ? "Monitoring active" : "Monitoring inactive"}</span>
                  <Button variant="outline" size="sm" disabled={isMonitoring || startMutation.isPending} onClick={() => startMutation.mutate()}><Play className="h-3 w-3" /> Start</Button>
                  <Button variant="outline" size="sm" disabled={!isMonitoring || stopMutation.isPending} onClick={() => stopMutation.mutate()}>Stop</Button>
                </span>
              </div>
            </div>

              <div className="min-h-0 flex-1 overflow-auto">
                {casesQuery.data.items.length ? (
                  <table className="min-w-[1050px] w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-surface text-xs uppercase tracking-wide text-muted shadow-sm">
                      <tr>
                        <th className="px-3 py-3">Borrower</th>
                        <th className="px-3 py-3">Score</th>
                        <th className="px-3 py-3">Delta</th>
                        <th className="px-3 py-3">Risk</th>
                        <th className="px-3 py-3">Confidence</th>
                        <th className="px-3 py-3">Blocker</th>
                        <th className="px-3 py-3">RM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {casesQuery.data.items.map((row) => (
                        <tr
                          key={row.msme_id}
                          onClick={() => setSelectedId(row.msme_id)}
                          className={cn(
                            "cursor-pointer align-top transition-all duration-150 hover:bg-subtle/70 hover:shadow-sm active:bg-subtle",
                            selectedCase?.msme_id === row.msme_id && "bg-navy/5 dark:bg-navy/10"
                          )}
                        >
                          <td className="px-3 py-3">
                            <div className="font-semibold text-ink">{row.business_name}</div>
                            <div className="text-xs text-muted">{titleize(row.segment)} / {row.city} / {row.branch}</div>
                          </td>
                          <td className="px-3 py-3 font-semibold">{row.policy_score}</td>
                          <td className={cn("px-3 py-3 font-semibold transition-colors", row.score_delta < 0 ? "text-danger" : row.score_delta > 0 ? "text-positive" : "text-muted")}>{row.score_delta > 0 ? "+" : ""}{row.score_delta}</td>
                          <td className="px-3 py-3"><RiskTierPill tier={row.risk_tier} /></td>
                          <td className="px-3 py-3"><DataConfidencePill value={row.data_confidence} /></td>
                          <td className="max-w-[340px] px-3 py-3 text-xs leading-5 text-muted">{row.top_blocker}</td>
                          <td className="px-3 py-3 text-xs text-muted">{row.relationship_manager}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <EmptyState label="No cases match the selected command center filters." />}
              </div>

              <div className="flex items-center justify-between border-t border-line px-3 py-2 text-xs text-muted">
                <span>Showing {casesQuery.data.offset + 1}-{Math.min(casesQuery.data.offset + casesQuery.data.items.length, casesQuery.data.total)} of {casesQuery.data.total}</span>
                <div className="flex gap-2">
                  <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="micro-scale rounded border border-line px-2 py-1 transition-all disabled:opacity-40 disabled:scale-100"><ChevronLeft className="h-4 w-4" /></button>
                  <button type="button" disabled={(page + 1) * limit >= casesQuery.data.total} onClick={() => setPage((value) => value + 1)} className="micro-scale rounded border border-line px-2 py-1 transition-all disabled:opacity-40 disabled:scale-100"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
          </section>

          <CasePreview
            row={selectedCase}
            onEvidence={() => setDrawer("evidence")}
            onCopilot={() => setDrawer("copilot")}
            onInject={() => selectedCase && injectMutation.mutate(selectedCase.msme_id)}
          />
        </div>
      )}

      {drawer && selectedCase ? <RightDrawer title={drawer === "evidence" ? "Evidence Drawer" : "Ask Copilot"} onClose={() => setDrawer(null)}>
        {drawer === "evidence" ? <EvidenceDrawer msmeId={selectedCase.msme_id} /> : <CreditCopilotPanel msmeId={selectedCase.msme_id} chatEnabled />}
      </RightDrawer> : null}
    </AppShell>
  );
}

function CasePreview({ row, onEvidence, onCopilot, onInject }: { row: CommandCenterCase | null; onEvidence: () => void; onCopilot: () => void; onInject: () => void; }) {
  if (!row) return <aside className="rounded-lg border border-line bg-surface p-4 animate-fade-in"><EmptyState label="Select one case to open the preview." /></aside>;
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-surface transition-all duration-200 micro-border-glow animate-fade-in">
      <div className="border-b border-line bg-subtle px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Selected Case</div>
        <h2 className="mt-1 font-serif text-xl font-semibold text-ink transition-colors hover:text-cyan">{row.business_name}</h2>
        <div className="mt-1 text-xs text-muted">{row.city}, {row.state} / {row.relationship_manager}</div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Score" value={`${row.policy_score}/100`} />
          <Metric label="Delta" value={`${row.score_delta > 0 ? "+" : ""}${row.score_delta}`} danger={row.score_delta < 0} />
          <Metric label="Confidence" value={`${row.data_confidence}%`} />
          <Metric label="Missing Evidence" value={String(row.missing_evidence_count)} danger={row.missing_evidence_count > 0} />
        </div>
        <div className="flex flex-wrap gap-2"><RiskTierPill tier={row.risk_tier} /><DataConfidencePill value={row.data_confidence} /></div>
        <Panel title="Top Blocker" icon={<AlertTriangle className="h-4 w-4 text-amber" />}>{row.top_blocker}</Panel>
        <Panel title="Latest Monitoring Event" icon={<Play className="h-4 w-4 text-cyan" />}>{row.latest_event ? `${row.latest_event} at ${row.latest_event_at}` : "No monitoring event yet. Start monitoring or inject one event for this case."}</Panel>
        <Panel title="Recommended Human Action" icon={<SlidersHorizontal className="h-4 w-4 text-navy" />}>{row.recommended_human_action}</Panel>
      </div>
      <div className="grid gap-2 border-t border-line p-4">
        <Button asChild className="micro-scale">
          <Link href={`/msmes/${row.msme_id}`}>Open Credit File <ExternalLink className="h-4 w-4" /></Link>
        </Button>
        <Button variant="outline" onClick={onEvidence} className="micro-scale"><Eye className="h-4 w-4" /> View Evidence</Button>
        <Button variant="outline" onClick={onCopilot} className="micro-scale"><Bot className="h-4 w-4" /> Ask Copilot</Button>
        <Button variant="outline" size="sm" onClick={onInject} className="micro-scale">Inject Event</Button>
      </div>
    </aside>
  );
}

function EvidenceDrawer({ msmeId }: { msmeId: string }) {
  const queryClient = useQueryClient();
  const evidenceQuery = useQuery({ queryKey: ["evidence", msmeId], queryFn: () => getEvidenceRecords(msmeId), staleTime: 30_000 });
  const [selected, setSelected] = useState<EvidenceRecord | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!selected && evidenceQuery.data?.[0]) setSelected(evidenceQuery.data[0]);
  }, [evidenceQuery.data, selected]);
  const statusMut = useMutation({
    mutationFn: ({ evidenceId, status }: { evidenceId: string; status: string }) => updateEvidenceStatus(msmeId, evidenceId, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["evidence", msmeId] }); }
  });
  const records = (evidenceQuery.data ?? []).filter((r) => (!typeFilter || r.evidence_type === typeFilter) && (!statusFilter || r.status === statusFilter));
  const typeOptions = [...new Set((evidenceQuery.data ?? []).map((r) => r.evidence_type))].sort();
  const statusOptions = [...new Set((evidenceQuery.data ?? []).map((r) => r.status))].sort();
  if (evidenceQuery.isLoading) return <LoadingState label="Loading evidence records..." />;
  if (evidenceQuery.isError) return <ErrorState label="Unable to load evidence records." />;
  return (
    <div className="grid h-full min-h-0 grid-cols-[280px_minmax(0,1fr)] gap-4">
      <div className="flex flex-col gap-3 overflow-hidden">
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-7 rounded border border-line bg-surface px-2 text-[11px] text-ink outline-none">
            <option value="">All types</option>
            {typeOptions.map((t) => <option key={t} value={t}>{titleize(t)}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-7 rounded border border-line bg-surface px-2 text-[11px] text-ink outline-none">
            <option value="">All status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
          </select>
          <input ref={fileRef} type="file" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); try { await uploadEvidence(msmeId, f); queryClient.invalidateQueries({ queryKey: ["evidence", msmeId] }); } finally { setUploading(false); } }} />
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 rounded bg-navy px-2 py-1 text-[11px] font-semibold text-white hover:bg-navy/90"><Upload className="h-3 w-3" /> Upload</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded border border-line">
          {records.map((record) => (
            <button key={record.id} onClick={() => setSelected(record)} className={cn("w-full border-b border-line px-3 py-3 text-left text-xs transition-colors hover:bg-subtle", selected?.id === record.id && "bg-panel2")}>
              <div className="flex items-center gap-2">
                <span className={cn("inline-block h-2 w-2 rounded-full shrink-0", record.status === "available" ? "bg-positive" : record.status === "partial" ? "bg-amber" : "bg-danger")} />
                <span className="font-semibold text-ink truncate">{record.document_name}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] px-1 py-0">{titleize(record.evidence_type)}</Badge>
                <Badge variant="outline" className="text-[10px] px-1 py-0">{titleize(record.status)}</Badge>
                {record.confidence_impact === "high" && <Badge variant="outline" className="text-[10px] px-1 py-0 border-danger text-danger">high impact</Badge>}
              </div>
            </button>
          ))}
          {records.length === 0 && <div className="p-4 text-xs text-muted">No evidence records match the filter.</div>}
        </div>
      </div>
      {selected ? (
        <div className="min-w-0 overflow-y-auto rounded border border-line bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-ink">{selected.document_name}</h3>
              <p className="text-xs text-muted">{selected.id} / {selected.content_type} / {titleize(selected.evidence_type)}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selected.status}
                onChange={(e) => statusMut.mutate({ evidenceId: selected.id, status: e.target.value })}
                disabled={statusMut.isPending}
                className="h-7 rounded border border-line bg-surface px-2 text-[11px] text-ink outline-none"
              >
                {["available", "partial", "missing", "stale", "not_applicable"].map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
              </select>
              <a href={evidenceFileUrl(msmeId, selected.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded bg-navy px-3 py-1.5 text-xs font-semibold text-white">Open file <ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
          </div>
          {selected.lending_question && (
            <div className="mb-3 rounded border border-cyan/20 bg-cyan/5 p-2 text-xs leading-5 text-ink">
              <span className="font-semibold text-navy">Lending question: </span>{selected.lending_question}
            </div>
          )}
          <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap rounded bg-workspace p-3 text-xs leading-5 text-ink">{selected.preview_text}</pre>
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Extracted fields (demo metadata extraction)</div>
            <div className="space-y-2">
              {selected.extracted_signals.map((signal) => (
                <div key={`${signal.field_name}-${signal.value}`} className="rounded border border-line p-2 text-xs">
                  <div className="font-semibold text-ink">{signal.field_name}: {signal.value}</div>
                  <div className="mt-1 text-muted">{signal.source_mapping} / confidence {signal.confidence}%</div>
                </div>
              ))}
            </div>
          </div>
          {selected.related_score_components.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Related score components</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.related_score_components.map((c) => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded border border-line p-2 text-xs">
              <div className="text-muted">Extraction</div>
              <div className="mt-0.5 font-semibold text-ink">{titleize(selected.extraction_status)}</div>
            </div>
            <div className="rounded border border-line p-2 text-xs">
              <div className="text-muted">Confidence impact</div>
              <div className="mt-0.5 font-semibold text-ink">{titleize(selected.confidence_impact)}</div>
            </div>
            <div className="rounded border border-line p-2 text-xs">
              <div className="text-muted">Risk impact</div>
              <div className="mt-0.5 font-semibold text-ink">{titleize(selected.risk_impact)}</div>
            </div>
          </div>
          {selected.audit_event_id && (
            <div className="mt-4 text-xs text-muted">Audit event: {selected.audit_event_id}</div>
          )}
          <div className="mt-2 text-xs text-muted">Source: {selected.source} / Uploaded by: {selected.uploaded_by}</div>
          <div className="mt-1 text-xs text-muted">Source mapping: {selected.source_mapping.join(" -> ")}</div>
        </div>
      ) : <EmptyState label="No evidence record selected." />}
    </div>
  );
}

function RightDrawer({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-[760px] max-w-[92vw] flex-col border-l border-line bg-surface shadow-2xl">
      <div className="flex items-center justify-between border-b border-line bg-subtle px-5 py-3">
        <div className="font-semibold text-ink">{title}</div>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-line"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 flex flex-col p-4 overflow-hidden">{children}</div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-xs text-muted transition-all duration-200 hover:border-cyan/30 focus-within:border-cyan focus-within:shadow-[0_0_0_2px_rgba(3,105,161,0.15)] cursor-pointer">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent font-medium text-ink outline-none cursor-pointer">
        <option value="">All</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-workspace p-3 transition-all duration-200 hover:border-cyan/20 hover:shadow-sm micro-lift">
      <div className="text-xs text-muted">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold transition-colors duration-200", danger ? "text-danger" : "text-ink")}>{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="group rounded-lg border border-line p-3 text-sm transition-all duration-200 hover:border-cyan/20 hover:shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
        {title}
      </div>
      <p className="leading-6 text-ink">{children}</p>
    </div>
  );
}
