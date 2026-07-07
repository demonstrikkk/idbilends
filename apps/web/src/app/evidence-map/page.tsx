"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Link2, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/State";
import { getEvidenceMap } from "@/lib/api/credit-file";
import { getPortfolioCases } from "@/lib/api/portfolio";
import { titleize } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function EvidenceMapPage() {
  const casesQuery = useQuery({ queryKey: ["portfolio", "cases"], queryFn: () => getPortfolioCases(), staleTime: 60_000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? casesQuery.data?.items[0]?.item.id ?? "";
  const mapQuery = useQuery({ queryKey: ["evidence-map", activeId], queryFn: () => getEvidenceMap(activeId), enabled: Boolean(activeId), staleTime: 60_000 });
  const cases = casesQuery.data?.items ?? [];
  const activeCase = cases.find((item) => item.item.id === activeId);

  return (
    <AppShell title="Evidence Map" subtitle="Source data to derived signal to score component to lending question to human action.">
      {casesQuery.isLoading ? <LoadingState label="Loading evidence map cases..." /> : casesQuery.isError ? (
        <ErrorState label="Unable to load cases for evidence mapping." />
      ) : !cases.length ? (
        <EmptyState label="No cases found for evidence mapping." />
      ) : (
        <div className="flex h-[calc(100vh-190px)] gap-5">
          <MapSidebar cases={cases} activeId={activeId} onSelect={setSelectedId} />
          
          {mapQuery.isLoading ? (
            <div className="flex-1 flex flex-col rounded-md border border-line bg-surface shadow-cockpit items-center justify-center">
              <LoadingState label="Building evidence map from backend outputs..." />
            </div>
          ) : mapQuery.isError || !mapQuery.data ? (
             <div className="flex-1 flex flex-col rounded-md border border-line bg-surface shadow-cockpit items-center justify-center">
              <ErrorState label="Unable to load evidence map endpoint." />
            </div>
          ) : (
            <MapContent data={mapQuery.data} activeCase={activeCase} />
          )}
        </div>
      )}
    </AppShell>
  );
}

function MapSidebar({ cases, activeId, onSelect }: { cases: any[], activeId: string, onSelect: (id: string) => void }) {
  return (
    <div className="flex w-1/4 min-w-[280px] flex-col rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
      <div className="border-b border-line bg-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Active Files</h3>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-line p-0">
        {cases.map(({ item }) => (
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
            <div className="mt-1 text-xs text-muted truncate">{titleize(item.segment)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MapContent({ data, activeCase }: { data: any, activeCase: any }) {
  return (
    <div className="flex flex-1 flex-col rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-subtle px-6 py-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">{activeCase?.item.business_name ?? "Credit File"} / Traceability Map</h2>
          <div className="mt-1 text-xs text-muted">
            End-to-end evidence chain for underwriting review.
          </div>
        </div>
        <Link href={`/msmes/${data.msme_id}`} className="flex items-center gap-2 rounded bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm border border-line hover:bg-subtle transition-colors">
          Open Credit File
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-workspace space-y-6">
        {data.rows.map((row: any, index: number) => (
          <div key={`${row.source_type}-${index}`} className="relative rounded-md border border-line bg-surface p-5 shadow-sm">
            <div className="absolute top-5 right-5 text-muted opacity-50">
              <Link2 className="h-4 w-4" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Node 1: Source */}
              <div className="space-y-1 relative">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">1. Source Data</div>
                <div className="font-semibold text-ink text-sm">{row.source_label}</div>
                <div className="text-xs text-muted">{titleize(row.source_status)}</div>
                <div className="hidden md:block absolute right-[-14px] top-8 text-line"><ArrowRight className="h-4 w-4" /></div>
              </div>
              
              {/* Node 2: Signal */}
              <div className="space-y-1 relative">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">2. Derived Signal</div>
                <div className="text-sm font-medium text-ink">{row.derived_signal}</div>
                <div className="hidden md:block absolute right-[-14px] top-8 text-line"><ArrowRight className="h-4 w-4" /></div>
              </div>

              {/* Node 3: Component */}
              <div className="space-y-1 relative">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">3. Score Component</div>
                <div className="text-sm font-medium text-ink">{titleize(row.score_component)}</div>
                <div className="hidden md:block absolute right-[-14px] top-8 text-line"><ArrowRight className="h-4 w-4" /></div>
              </div>

              {/* Node 4: Question */}
              <div className="space-y-1 relative">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">4. Lending Question</div>
                <div className="text-xs leading-5 text-muted italic">&quot;{row.lending_question}&quot;</div>
                <div className="hidden md:block absolute right-[-14px] top-8 text-line"><ArrowRight className="h-4 w-4" /></div>
              </div>

              {/* Node 5: Action */}
              <div className="space-y-1 relative">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber mb-2">5. Human Action</div>
                <div className="text-sm font-medium text-amber">{row.recommended_action}</div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted mt-2 border-t border-line pt-2">Impact</div>
                <div className="text-xs text-muted">{row.confidence_impact} / {row.risk_impact}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
