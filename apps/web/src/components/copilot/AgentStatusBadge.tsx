"use client";

import { cn } from "@/lib/utils";

type AgentStatus = "pending" | "running" | "done" | "error";

interface AgentStatusBadgeProps {
  status: AgentStatus;
  label: string;
  animated?: boolean;
}

const STATUS_CONFIG: Record<AgentStatus, { bg: string; border: string; text: string; icon: string }> = {
  pending: { bg: "bg-subtle", border: "border-line", text: "text-muted", icon: "○" },
  running: { bg: "bg-cyan/10", border: "border-cyan/20", text: "text-cyan", icon: "►" },
  done: { bg: "bg-positive/10", border: "border-positive/20", text: "text-positive", icon: "✓" },
  error: { bg: "bg-danger/10", border: "border-danger/20", text: "text-danger", icon: "✕" },
};

export function AgentStatusBadge({ status, label, animated = true }: AgentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide border transition-all duration-300",
        config.bg,
        config.border,
        config.text,
        status === "running" && animated && "animate-pulse-subtle"
      )}
    >
      <span className="text-[11px] leading-none">{config.icon}</span>
      {label}
    </span>
  );
}
