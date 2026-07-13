"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalGateProps {
  action: string;
  variant?: "warning" | "info";
  className?: string;
}

export function ApprovalGate({ action, variant = "warning", className }: ApprovalGateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3",
        variant === "warning"
          ? "border-amber/20 bg-amber/[0.03]"
          : "border-cyan/20 bg-cyan/[0.03]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            variant === "warning" ? "bg-amber/10 text-amber" : "bg-cyan/10 text-cyan"
          )}
        >
          {variant === "warning" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-wider",
              variant === "warning" ? "text-amber" : "text-cyan"
            )}
          >
            {variant === "warning" ? "Recommended Human Action" : "Decision-Support Input"}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-ink">{action}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-md bg-subtle px-3 py-2 text-[10px] text-muted">
        <ShieldCheck className="h-3 w-3 shrink-0" />
        <span>
          <strong>Governance:</strong> This is an AI-suggested action. Final approval requires
          authorized human review.
        </span>
      </div>
    </div>
  );
}
