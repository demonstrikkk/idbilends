"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { SignalTable, HumanActionQueue } from "@/components/ui/Cockpit";
import { Panel } from "@/components/ui/Panel";
import { usePortfolioCases, isReviewRequired } from "@/hooks/usePortfolioCases";

export default function MSMEListPage() {
  const [search, setSearch] = useState("");
  const { cases, isLoading, isError, seedAndRefresh } = usePortfolioCases();
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cases;
    return cases.filter(({ item }) => `${item.business_name} ${item.city} ${item.state} ${item.segment}`.toLowerCase().includes(term));
  }, [cases, search]);
  const actionQueue = filtered.filter(isReviewRequired);

  return (
    <AppShell
      title="Credit File"
      subtitle="Search and open backend-backed MSME credit files for underwriting review."
      actions={
        <label className="flex h-9 w-full max-w-sm items-center gap-2 rounded border border-line bg-white px-3 text-sm">
          <Search className="h-4 w-4 text-muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search business or city" className="w-full border-0 bg-transparent outline-none placeholder:text-muted" />
        </label>
      }
    >
      {isLoading ? <LoadingState /> : isError ? <ErrorState label="Unable to load MSME review cases from the backend." /> : !cases.length ? (
        <EmptyState label="No MSME profiles found. Seed demo data to start the credit intelligence walkthrough." onSeed={seedAndRefresh} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <SignalTable cases={filtered} title="Credit File Register" />
          <Panel title="Recommended Human Action">
            <HumanActionQueue cases={actionQueue.length ? actionQueue : filtered} />
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
