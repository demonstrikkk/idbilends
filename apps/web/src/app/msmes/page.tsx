"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { MSMETable } from "@/components/dashboard/MSMETable";
import { getMSMEs } from "@/lib/api/msmes";

export default function MSMEListPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["msmes", { search }],
    queryFn: () => getMSMEs({ search })
  });

  return (
    <AppShell>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold">MSME cases</h1>
          <p className="mt-2 text-sm text-muted">Search synthetic MSME profiles and open a credit review case.</p>
        </div>
        <label className="flex w-full max-w-sm items-center gap-2 border border-line bg-panel px-3 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search business or city" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </label>
      </div>
      {isLoading ? <LoadingState /> : isError ? <ErrorState label="Unable to load MSME profiles from the backend." /> : !data?.items.length ? <EmptyState label="No MSME profiles match the current search." /> : (
        <Panel title="Case register">
          <MSMETable items={data.items} />
        </Panel>
      )}
    </AppShell>
  );
}
