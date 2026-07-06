import { cn } from "@/lib/utils";
import { titleize } from "@/lib/formatters";

const tierClass: Record<string, string> = {
  very_low: "border-cyan/40 bg-cyan/10 text-cyan",
  moderate_low: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  moderate: "border-amber/40 bg-amber/10 text-amber",
  elevated: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  high: "border-danger/50 bg-danger/10 text-danger"
};

export function RiskTierBadge({ tier }: { tier: string | null | undefined }) {
  return (
    <span className={cn("inline-flex items-center border px-2 py-1 text-xs font-medium", tierClass[tier ?? ""] ?? "border-line bg-panel2 text-muted")}>
      {titleize(tier)}
    </span>
  );
}
