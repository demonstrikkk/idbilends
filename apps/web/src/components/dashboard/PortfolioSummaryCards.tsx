import { AlertCircle, BarChart3, FileQuestion, Users } from "lucide-react";
import type { MSMEListItem } from "@/lib/schemas/msme";

export function PortfolioSummaryCards({ items }: { items: MSMEListItem[] }) {
  const scored = items.filter((item) => item.health_score != null);
  const avg = scored.length ? Math.round(scored.reduce((sum, item) => sum + (item.health_score ?? 0), 0) / scored.length) : null;
  const highPriority = items.filter((item) => item.prospect_priority === "very_high" || item.prospect_priority === "high").length;
  const reviewRequired = items.filter((item) => ["elevated", "high"].includes(item.risk_tier ?? "")).length;
  const lowConfidence = items.filter((item) => (item.data_confidence ?? 100) < 70).length;

  const rows = [
    { label: "Cases in queue", value: items.length, icon: Users },
    { label: "Average health score", value: avg ?? "--", icon: BarChart3 },
    { label: "High-priority prospects", value: highPriority, icon: AlertCircle },
    { label: "Low-confidence files", value: lowConfidence, icon: FileQuestion },
    { label: "Risk review required", value: reviewRequired, icon: AlertCircle }
  ];

  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-5">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div key={row.label} className="bg-panel p-4">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs">{row.label}</span>
              <Icon className="h-4 w-4" />
            </div>
            <div className="mt-3 text-2xl font-semibold">{row.value}</div>
          </div>
        );
      })}
    </div>
  );
}
