"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowDownRight, ArrowUpRight, Pause, Play, RadioTower, Send, ShieldAlert } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { createManualMonitoringEvent, getMonitoringBoard, monitoringWebSocketUrl, startMonitoring, stopMonitoring } from "@/lib/api/monitoring";
import type { MonitoringEvent, MonitoringEventType, ScoreMovement } from "@/lib/schemas/monitoring";
import { titleize } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const eventOptions: MonitoringEventType[] = [
  "bank_balance_drop",
  "revenue_growth_change",
  "gst_filing_delayed",
  "bank_statement_received",
  "itr_received",
  "bureau_report_received",
  "invoice_delay_increased",
  "buyer_concentration_increased",
  "bounce_event_recorded",
  "emi_burden_increased",
  "gem_order_completed",
  "suspicious_revenue_spike",
  "sector_stress_changed",
  "market_overlay_changed"
];

export default function MonitoringPage() {
  const queryClient = useQueryClient();
  const [liveEvents, setLiveEvents] = useState<Array<{ event: string; data: any; at: string }>>([]);
  const [manualType, setManualType] = useState<MonitoringEventType>("bank_balance_drop");
  const boardQuery = useQuery({ queryKey: ["monitoring", "board"], queryFn: getMonitoringBoard, refetchInterval: 10_000 });
  const startMutation = useMutation({ mutationFn: startMonitoring, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring"] }) });
  const stopMutation = useMutation({ mutationFn: stopMonitoring, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring"] }) });
  const manualMutation = useMutation({
    mutationFn: () => createManualMonitoringEvent(manualType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring"] })
  });

  useEffect(() => {
    const socket = new WebSocket(monitoringWebSocketUrl());
    socket.onmessage = (message) => {
      const parsed = JSON.parse(message.data);
      setLiveEvents((current) => [{ event: parsed.event, data: parsed.data, at: new Date().toISOString() }, ...current].slice(0, 50));
      if (["score_delta", "alert_created", "feature_event"].includes(parsed.event)) {
        queryClient.invalidateQueries({ queryKey: ["monitoring"] });
      }
    };
    socket.onerror = () => {
      setLiveEvents((current) => [{ event: "error", data: { message: "WebSocket unavailable. Polling remains active." }, at: new Date().toISOString() }, ...current].slice(0, 50));
    };
    return () => socket.close();
  }, [queryClient]);

  const chartData = useMemo(() => {
    return (boardQuery.data?.score_movements ?? []).slice(0, 20).reverse().map((item, index) => ({
      name: `${index + 1}`,
      score: item.new_score,
      delta: item.delta
    }));
  }, [boardQuery.data?.score_movements]);

  return (
    <AppShell title="Live Credit Monitoring" subtitle="Simulated borrower events, deterministic score recomputation, score deltas, and officer action queues.">
      {boardQuery.isLoading ? <LoadingState label="Loading monitoring workbench..." /> : boardQuery.isError ? (
        <ErrorState label="Unable to load backend monitoring board." />
      ) : !boardQuery.data ? (
        <EmptyState label="No monitoring data available." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Session" value={boardQuery.data.status.running ? "Running" : "Stopped"} tone={boardQuery.data.status.running ? "good" : "muted"} icon={<RadioTower className="h-5 w-5" />} />
            <Metric label="Events Recorded" value={boardQuery.data.status.event_count} icon={<Activity className="h-5 w-5" />} />
            <Metric label="Adverse Movements" value={boardQuery.data.top_deteriorating.length} tone="danger" icon={<ArrowDownRight className="h-5 w-5" />} />
            <Metric label="Improving Cases" value={boardQuery.data.top_improving.length} tone="good" icon={<ArrowUpRight className="h-5 w-5" />} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <Panel title="Monitoring Controls">
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => startMutation.mutate()} className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-ink">
                    <Play className="h-4 w-4" /> Start
                  </button>
                  <button onClick={() => stopMutation.mutate()} className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-subtle">
                    <Pause className="h-4 w-4" /> Stop
                  </button>
                  <select value={manualType} onChange={(event) => setManualType(event.target.value as MonitoringEventType)} className="h-10 rounded-md border border-line bg-white px-3 text-sm">
                    {eventOptions.map((item) => <option key={item} value={item}>{titleize(item)}</option>)}
                  </select>
                  <button onClick={() => manualMutation.mutate()} className="inline-flex items-center gap-2 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-ink hover:bg-amber/90">
                    <Send className="h-4 w-4" /> Inject Event
                  </button>
                </div>
              </Panel>

              <Panel title="Score Trend">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#114b7a" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <div className="grid gap-6 lg:grid-cols-2">
                <MovementList title="Largest Deterioration" items={boardQuery.data.top_deteriorating} negative />
                <MovementList title="Largest Improvement" items={boardQuery.data.top_improving} />
              </div>
            </div>

            <div className="space-y-6">
              <Panel title="Live Event Stream">
                <div className="max-h-[420px] space-y-2 overflow-y-auto">
                  {liveEvents.length ? liveEvents.map((item, index) => <LiveEventRow key={`${item.at}-${index}`} item={item} />) : (
                    <div className="rounded-md bg-subtle p-3 text-sm text-muted">Connects over WebSocket and falls back to periodic board refresh.</div>
                  )}
                </div>
              </Panel>

              <Panel title="Drift Indicators">
                <KeyValueGrid data={boardQuery.data.drift_indicators} />
              </Panel>

              <Panel title="Evidence Missingness">
                <KeyValueGrid data={boardQuery.data.feature_missingness_summary} />
              </Panel>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Metric({ label, value, icon, tone = "muted" }: { label: string; value: string | number; icon: React.ReactNode; tone?: "muted" | "good" | "danger" }) {
  return (
    <div className="rounded-md border border-line bg-surface p-5 shadow-cockpit">
      <div className={cn("mb-3 inline-flex rounded-md p-2", tone === "good" ? "bg-success/10 text-success" : tone === "danger" ? "bg-danger/10 text-danger" : "bg-subtle text-muted")}>{icon}</div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-line bg-surface shadow-cockpit">
      <div className="border-b border-line bg-subtle px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function MovementList({ title, items, negative = false }: { title: string; items: ScoreMovement[]; negative?: boolean }) {
  return (
    <Panel title={title}>
      <div className="space-y-2">
        {items.length ? items.map((item) => (
          <div key={`${item.event_id}-${item.msme_id}`} className="rounded-md border border-line p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{item.business_name}</div>
                <div className="text-xs text-muted">{item.city} / {titleize(item.segment)}</div>
              </div>
              <div className={cn("text-lg font-bold", negative ? "text-danger" : "text-success")}>{item.delta > 0 ? `+${item.delta}` : item.delta}</div>
            </div>
            <div className="mt-2 text-xs text-muted">{item.reason}</div>
          </div>
        )) : <div className="text-sm text-muted">No score movements in this bucket yet.</div>}
      </div>
    </Panel>
  );
}

function KeyValueGrid({ data }: { data: Record<string, number> }) {
  return (
    <div className="grid gap-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between rounded-md bg-subtle px-3 py-2 text-sm">
          <span className="text-muted">{titleize(key)}</span>
          <span className="font-semibold text-ink">{value}</span>
        </div>
      ))}
    </div>
  );
}

function LiveEventRow({ item }: { item: { event: string; data: MonitoringEvent | any; at: string } }) {
  const severity = item.data?.severity;
  return (
    <div className="rounded-md border border-line p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-ink">{titleize(item.event)}</span>
        <span className={cn("rounded px-2 py-0.5 text-xs", severity === "high" ? "bg-danger/10 text-danger" : "bg-subtle text-muted")}>{severity ?? "info"}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>{item.data?.msme_id ?? item.data?.message ?? "Monitoring session event"}</span>
      </div>
    </div>
  );
}
