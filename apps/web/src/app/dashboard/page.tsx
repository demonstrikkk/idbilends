"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { getMSMEs } from "@/lib/api/msmes";
import { PortfolioSummaryCards } from "@/components/dashboard/PortfolioSummaryCards";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { MSMETable } from "@/components/dashboard/MSMETable";
import { RiskTierBadge } from "@/components/score/RiskTierBadge";
import { titleize } from "@/lib/formatters";

export default function DashboardPage() {
  const [risk, setRisk] = useState("");
  const [priority, setPriority] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["msmes", { risk, priority }],
    queryFn: () => getMSMEs({ risk_tier: risk, prospect_priority: priority })
  });

  const earlyWarning = useMemo(
    () => (data?.items ?? []).filter((item) => ["high", "elevated"].includes(item.risk_tier ?? "") || (item.data_confidence ?? 100) < 70).slice(0, 5),
    [data?.items]
  );

  return (
    <AppShell>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Assessment queue</h1>
          <p className="mt-2 text-sm text-muted">Portfolio triage by deterministic score outputs, prospect readiness, and verification needs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={risk} onChange={(event) => setRisk(event.target.value)} className="border border-line bg-panel px-3 py-2 text-sm">
            <option value="">All risk tiers</option>
            {["very_low", "moderate_low", "moderate", "elevated", "high"].map((tier) => <option key={tier} value={tier}>{titleize(tier)}</option>)}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="border border-line bg-panel px-3 py-2 text-sm">
            <option value="">All prospect priorities</option>
            {["very_high", "high", "medium", "low", "not_ready"].map((item) => <option key={item} value={item}>{titleize(item)}</option>)}
          </select>
        </div>
      </div>
      {isLoading ? <LoadingState /> : isError ? <ErrorState label="Unable to load MSME queue. Confirm the FastAPI backend is running at the configured API base URL." /> : !data?.items.length ? <EmptyState label="No MSME profiles found. Seed demo data to start the credit intelligence walkthrough." /> : (
        <div className="space-y-5">
          <PortfolioSummaryCards items={data.items} />
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel title="Risk distribution">
              <RiskDistributionChart items={data.items} />
            </Panel>
            <Panel title="Verification pressure">
              <div className="divide-y divide-line">
                {earlyWarning.length ? earlyWarning.map((item) => (
                  <Link key={item.id} href={`/msmes/${item.id}`} className="grid gap-3 px-4 py-4 hover:bg-[#102234] sm:grid-cols-[1fr_auto]">
                    <div>
                      <div className="font-semibold">{item.business_name}</div>
                      <div className="mt-1 text-xs text-muted">{item.city} / {titleize(item.scenario_label)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RiskTierBadge tier={item.risk_tier} />
                      <span className="text-xs text-muted">{item.data_confidence ?? "--"}% confidence</span>
                    </div>
                  </Link>
                )) : <div className="p-4 text-sm text-muted">No elevated risk or low-confidence accounts in the current filter.</div>}
              </div>
            </Panel>
          </div>
          <Panel title="Ranked MSME prospects">
            <MSMETable items={data.items} />
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
