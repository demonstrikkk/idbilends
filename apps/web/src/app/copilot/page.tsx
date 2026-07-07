"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CreditCopilotPanel } from "@/components/copilot/CreditCopilotPanel";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/State";
import { getPortfolioCases } from "@/lib/api/portfolio";
import { titleize } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function CopilotPage() {
  const casesQuery = useQuery({ queryKey: ["portfolio", "cases"], queryFn: getPortfolioCases, staleTime: 60_000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const cases = casesQuery.data?.items ?? [];
  const filteredCases = cases.filter(c => c.item.business_name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const activeId = selectedId ?? cases[0]?.item.id ?? "";

  return (
    <AppShell title="Credit Copilot" subtitle="Case-aware decision-support chat grounded in deterministic score, evidence, risk, and prospect inputs.">
      {casesQuery.isLoading ? <LoadingState label="Loading cases for Copilot..." /> : casesQuery.isError ? (
        <ErrorState label="Unable to load backend cases for Copilot." />
      ) : !cases.length ? (
        <EmptyState label="No cases found for Copilot." />
      ) : (
        <div className="flex h-[calc(100vh-190px)] gap-5">
          <CopilotSidebar 
            cases={filteredCases} 
            activeId={activeId} 
            onSelect={setSelectedId} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          <div className="flex-1 flex flex-col rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
             {activeId ? (
                <div className="flex-1 overflow-y-auto p-0">
                  <CreditCopilotPanel msmeId={activeId} chatEnabled />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <ErrorState label="No backend case is available for Copilot." />
                </div>
              )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function CopilotSidebar({ cases, activeId, onSelect, searchQuery, setSearchQuery }: { cases: any[], activeId: string, onSelect: (id: string) => void, searchQuery: string, setSearchQuery: (q: string) => void }) {
  return (
    <div className="flex w-1/4 min-w-[280px] flex-col rounded-md border border-line bg-surface shadow-cockpit overflow-hidden">
      <div className="border-b border-line bg-subtle px-4 py-3 space-y-3">
        <h3 className="text-sm font-semibold text-ink">Active Context</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted" />
          <input 
            type="text" 
            placeholder="Search cases..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded border border-line bg-white pl-8 pr-3 py-1.5 text-sm outline-none placeholder:text-muted focus:border-amber transition-colors"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-line p-0 bg-workspace">
        {cases.map(({ item, score }) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "w-full px-4 py-3 text-left transition-colors hover:bg-subtle/50",
              activeId === item.id ? "bg-white border-l-4 border-l-amber" : "bg-transparent border-l-4 border-l-transparent"
            )}
          >
            <div className={cn("font-semibold truncate", activeId === item.id ? "text-ink" : "text-ink/80")}>{item.business_name}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span className="truncate">{titleize(item.segment)}</span>
              <span className="font-medium">Score: {score.score}</span>
            </div>
          </button>
        ))}
        {cases.length === 0 && (
          <div className="p-4 text-center text-sm text-muted">No matching cases.</div>
        )}
      </div>
    </div>
  );
}
