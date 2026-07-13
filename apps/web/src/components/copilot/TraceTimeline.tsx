"use client";

import type { TraceStep } from "@/lib/schemas/copilot";
import { cn } from "@/lib/utils";

interface TraceTimelineProps {
  trace: TraceStep[];
  compact?: boolean;
}

export function TraceTimeline({ trace, compact }: TraceTimelineProps) {
  if (!trace.length) return null;

  return (
    <div className={cn("rounded-md border border-line bg-surface", compact && "border-0 bg-transparent")}>
      {!compact && (
        <div className="border-b border-line px-4 py-2.5">
          <div className="text-xs font-semibold text-muted">
            Agent Trace <span className="font-normal text-muted/70">({trace.length} steps)</span>
          </div>
        </div>
      )}
      <div className={cn(compact ? "py-1" : "px-4 py-3")}>
        {trace.map((step, index) => (
          <TraceStepItem key={step.step_id} step={step} isLast={index === trace.length - 1} compact={compact} />
        ))}
      </div>
    </div>
  );
}

function TraceStepItem({ step, isLast, compact }: { step: TraceStep; isLast: boolean; compact?: boolean }) {
  const isSuccess = step.status === "success";
  return (
    <div className={cn("relative flex items-start gap-3 pl-4", compact ? "pb-2 last:pb-0" : "pb-4 last:pb-0")}>
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[7px] top-3 h-full w-px bg-line" />
      )}
      {/* Dot */}
      <div
        className={cn(
          "relative z-10 shrink-0 rounded-full border-2",
          compact ? "mt-1.5 h-2 w-2" : "mt-1.5 h-3 w-3",
          isSuccess
            ? "border-positive bg-positive/20"
            : "border-danger bg-danger/20"
        )}
      />
      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold text-ink", compact ? "text-[10px]" : "text-xs")}>{step.step_name}</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-semibold",
              isSuccess
                ? "bg-positive/10 text-positive"
                : "bg-danger/10 text-danger"
            )}
          >
            {step.status}
          </span>
          {step.duration_ms !== undefined && step.duration_ms !== null && (
            <span className="ml-auto text-[10px] text-muted">{step.duration_ms}ms</span>
          )}
        </div>
        {step.notes && (
          <p className="mt-0.5 text-xs leading-5 text-muted">{step.notes}</p>
        )}
        {step.error_code && (
          <p className="mt-1 rounded bg-danger/5 px-2 py-1.5 text-[10px] leading-5 text-danger font-mono">
            Error: {step.error_code}
          </p>
        )}
        {step.output_ref && (
          <p className="mt-1 rounded bg-subtle/50 px-2 py-1.5 text-[10px] leading-5 text-ink/60 font-mono">
            Ref: {step.output_ref}
          </p>
        )}
      </div>
    </div>
  );
}
