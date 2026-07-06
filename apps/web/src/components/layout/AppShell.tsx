"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Archive, FileSearch, LayoutDashboard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { decisionSupportCopy } from "@/lib/constants";

const nav = [
  { href: "/dashboard", label: "Assessment queue", icon: LayoutDashboard },
  { href: "/msmes", label: "MSME cases", icon: Archive },
  { href: "/governance", label: "Governance", icon: ShieldCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-[#06111d]/95 px-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold tracking-normal">
            LendSignal 360
          </Link>
          <span className="h-5 w-px bg-line" />
          <span className="text-xs text-slate-300">Decision-support only</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Environment <b className="ml-1 border border-cyan/30 bg-cyan/10 px-2 py-1 font-medium text-cyan">Demo</b></span>
          <span>Rule version <b className="ml-1 border border-line px-2 py-1 font-medium text-slate-200">score_rules_v1</b></span>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[236px_1fr]">
        <aside className="border-r border-line bg-[#071522] p-4">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            <Activity className="h-4 w-4" />
            Workflow
          </div>
          <nav className="space-y-1">
            {nav.map((item, index) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 border-l-2 px-3 py-3 text-sm transition",
                    active ? "border-cyan bg-cyan/10 text-cyan" : "border-transparent text-slate-300 hover:bg-panel"
                  )}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-panel2 text-xs">{index + 1}</span>
                  <span className="flex-1">{item.label}</span>
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </nav>
          <div className="mt-10 border border-amber/40 bg-amber/10 p-4 text-xs leading-5 text-slate-200">
            <div className="mb-2 font-semibold text-amber">Human review required</div>
            {decisionSupportCopy}
          </div>
          <div className="mt-8 border-t border-line pt-5 text-xs text-muted">
            <div>Role</div>
            <div className="mt-1 text-slate-200">Branch Analyst</div>
          </div>
        </aside>
        <main className="min-w-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
