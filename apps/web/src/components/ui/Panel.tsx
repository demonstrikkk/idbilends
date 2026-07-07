import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  action?: ReactNode;
};

export function Panel({ title, action, className, children, ...props }: PanelProps) {
  return (
    <section className={cn("rounded-md border border-line bg-surface shadow-cockpit", className)} {...props}>
      {(title || action) && (
        <div className="flex min-h-12 items-center justify-between border-b border-line px-4 py-3">
          {title ? <h2 className="text-sm font-semibold text-ink">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
