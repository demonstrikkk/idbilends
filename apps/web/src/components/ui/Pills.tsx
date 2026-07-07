import { cn } from "@/lib/utils";
import { titleize } from "@/lib/formatters";
import type { ReactNode } from "react";

const riskClass: Record<string, string> = {
  very_low: "border-positive/20 bg-positive/10 text-positive",
  moderate_low: "border-positive/20 bg-positive/10 text-positive",
  moderate: "border-amber/25 bg-amber/10 text-[#8a5a0a]",
  elevated: "border-danger/25 bg-danger/10 text-danger",
  high: "border-danger/25 bg-danger/10 text-danger"
};

const recommendationClass: Record<string, string> = {
  consider_with_standard_review: "border-positive/20 bg-positive/10 text-positive",
  consider_with_conditions: "border-amber/25 bg-amber/10 text-[#8a5a0a]",
  review_required: "border-cyan/20 bg-cyan/10 text-cyan",
  consider_lower_limit: "border-amber/25 bg-amber/10 text-[#8a5a0a]",
  insufficient_data: "border-danger/25 bg-danger/10 text-danger",
  not_recommended_without_rework: "border-danger/25 bg-danger/10 text-danger"
};

const severityClass: Record<string, string> = {
  low: "border-cyan/20 bg-cyan/10 text-cyan",
  medium: "border-amber/25 bg-amber/10 text-[#8a5a0a]",
  high: "border-danger/25 bg-danger/10 text-danger",
  critical: "border-danger/25 bg-danger/10 text-danger"
};

export function RiskTierPill({ tier }: { tier: string | null | undefined }) {
  return <Pill className={riskClass[tier ?? ""]}>{titleize(tier)}</Pill>;
}

export function DataConfidencePill({ value }: { value: number | null | undefined }) {
  const level = value == null ? "unknown" : value >= 80 ? "High" : value >= 65 ? "Medium" : "Low";
  const className = value == null ? "" : value >= 80 ? riskClass.very_low : value >= 65 ? severityClass.medium : severityClass.high;
  return <Pill className={className}>{value == null ? "Not available" : `${level} (${value}%)`}</Pill>;
}

export function RecommendationPill({ recommendation }: { recommendation: string | null | undefined }) {
  return <Pill className={recommendationClass[recommendation ?? ""]}>{titleize(recommendation)}</Pill>;
}

export function SeverityPill({ severity }: { severity: string | null | undefined }) {
  return <Pill className={severityClass[severity ?? ""]}>{titleize(severity)}</Pill>;
}

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold", className ?? "border-line bg-panel2 text-muted")}>{children}</span>;
}
