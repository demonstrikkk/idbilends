"use client";

import { cn } from "@/lib/utils";

interface ToolCallCardProps {
  tool: string;
  input?: string;
  output?: string;
  durationMs?: number;
  status: "success" | "error" | "running";
}

export function ToolCallCard({ tool, input, output, durationMs, status }: ToolCallCardProps) {
  return (
    <div className="rounded-md border border-line bg-subtle/50 text-xs">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            status === "success" && "bg-positive",
            status === "error" && "bg-danger",
            status === "running" && "bg-cyan animate-pulse"
          )}
        />
        <code className="font-mono text-[11px] font-semibold text-ink">{tool}</code>
        {durationMs !== undefined && (
          <span className="ml-auto text-muted">{durationMs}ms</span>
        )}
      </div>
      {input && (
        <div className="border-b border-line px-3 py-2">
          <div className="mb-1 text-[10px] font-semibold text-muted uppercase tracking-wide">Input</div>
          <code className="block whitespace-pre-wrap font-mono text-[10px] text-ink/80 leading-5">{input}</code>
        </div>
      )}
      {output && (
        <div className="px-3 py-2">
          <div className="mb-1 text-[10px] font-semibold text-muted uppercase tracking-wide">Output</div>
          <code className="block whitespace-pre-wrap font-mono text-[10px] text-ink/80 leading-5">{output}</code>
        </div>
      )}
    </div>
  );
}
