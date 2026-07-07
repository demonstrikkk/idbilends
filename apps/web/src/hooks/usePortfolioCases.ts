"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPortfolioCases } from "@/lib/api/portfolio";
import type { PortfolioCase } from "@/lib/schemas/portfolio";

export type { PortfolioCase } from "@/lib/schemas/portfolio";

export function usePortfolioCases() {
  const queryClient = useQueryClient();
  const casesQuery = useQuery({
    queryKey: ["portfolio", "cases"],
    queryFn: getPortfolioCases,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false
  });

  const cases = useMemo<PortfolioCase[]>(() => casesQuery.data?.items ?? [], [casesQuery.data?.items]);

  const seedAndRefresh = async () => {
    const { seedDemoData } = await import("@/lib/api/demo");
    await seedDemoData({ reset: true, seed: 42, profile_count: 9 });
    await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  };

  return {
    listQuery: casesQuery,
    cases,
    isLoading: casesQuery.isLoading,
    isError: casesQuery.isError,
    seedAndRefresh
  };
}

export function isReviewRequired(caseItem: PortfolioCase) {
  const score = caseItem.score;
  return score?.recommendation === "review_required" || score?.recommendation === "insufficient_data" || score?.risk_tier === "elevated" || score?.risk_tier === "high";
}

export function isWatched(caseItem: PortfolioCase) {
  const score = caseItem.score;
  if (!score) return false;
  return (
    score.early_warning_triggers.length > 0 ||
    score.data_confidence < 70 ||
    ["elevated", "high"].includes(score.risk_tier) ||
    score.missing_data_warnings.some((warning) => /bank|bureau|itr|gst/i.test(warning)) ||
    ["review_required", "insufficient_data"].includes(score.recommendation)
  );
}
