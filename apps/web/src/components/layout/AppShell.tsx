"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivitySquare,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  Database,
  FileText,
  Files,
  FolderKanban,
  HelpCircle,
  Map,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  TableProperties
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryWorkflow = [
  { href: "/case-inbox", label: "Case Inbox", icon: TableProperties },
  { href: "/msmes", label: "Credit File", icon: FolderKanban },
  { 
    label: "Evidence Room", 
    icon: Files,
    subItems: [
      { href: "/data-room", label: "Data Room", icon: Database },
      { href: "/evidence-map", label: "Evidence Map", icon: Map }
    ]
  },
  { href: "/copilot", label: "Credit Copilot", icon: MessageSquareText },
  { href: "/portfolio", label: "Portfolio Risk", icon: BarChart3 },
  { href: "/governance", label: "Governance", icon: ShieldCheck }
];

const systemNav = [
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/watchlist", label: "Watchlist", icon: Bell },
  { href: "/data-dictionary", label: "Data Dictionary", icon: BookOpen },
  { href: "/policy-center", label: "Policy Center", icon: FileText }
];

function WorkspaceSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="flex h-screen w-full flex-col bg-ink text-white">
      {/* Brand */}
      <Link href="/" className="flex h-16 shrink-0 items-center gap-3 px-5 transition-colors duration-200 hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-cyan text-sm font-bold text-white shadow-sm">LS</span>
        <div className="flex flex-col">
          <span className="font-serif text-[17px] font-semibold tracking-wide text-white">LendSignal 360</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">Credit Workspace</span>
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Primary Workflow</div>
          <nav className="space-y-0.5">
            {primaryWorkflow.map((item, idx) => {
              if (item.subItems) {
                const isActiveGroup = item.subItems.some(sub => isActive(pathname, sub.href));
                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-white/50">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <div className="ml-5 space-y-0.5 border-l border-white/10 pl-2">
                      {item.subItems.map((subItem) => {
                        const active = isActive(pathname, subItem.href);
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "relative flex h-8 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber",
                              active ? "bg-navy text-white shadow-sm" : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {active && <span className="absolute left-0 top-1.5 h-5 w-0.5 rounded-r bg-amber" />}
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const active = isActive(pathname, item.href!);
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber",
                    active ? "bg-navy text-white shadow-sm" : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active && <span className="absolute left-0 top-2 h-5 w-0.5 rounded-r bg-amber" />}
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-white/40">System</div>
          <nav className="space-y-0.5">
            {systemNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber",
                    active ? "bg-navy text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active && <span className="absolute left-0 top-2 h-5 w-0.5 rounded-r bg-amber" />}
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile */}
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="mb-3 rounded-md border border-white/10 bg-white/5 p-3 text-xs">
          <div className="mb-1 flex items-center gap-2 font-medium text-white/90">
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber" />
            Decision-Support Mode
          </div>
          <p className="text-white/60">Copilot provides reasoning, not final credit decisions.</p>
        </div>
        
        <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors duration-200 hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-medium text-white ring-1 ring-white/20">
            AS
          </div>
          <div className="flex flex-col items-start overflow-hidden text-sm">
            <span className="truncate font-medium text-white">Arjun Singh</span>
            <span className="truncate text-xs text-white/50">Credit Officer</span>
          </div>
          <Settings className="ml-auto h-4 w-4 text-white/40" />
        </button>
      </div>
    </aside>
  );
}

function TopCommandBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/case-inbox" className="font-serif text-lg font-semibold">LendSignal 360</Link>
      </div>
      <label className="ml-auto hidden h-9 w-full max-w-[380px] items-center gap-2 rounded border border-line bg-white px-3 text-sm text-muted md:flex">
        <Search className="h-4 w-4" />
        <input className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted" placeholder="Search credit files or evidence" />
      </label>
      <div className="ml-4 flex items-center gap-3 text-ink">
        <Link href="/alerts" className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-panel2" title="Alerts">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </Link>
        <button className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full opacity-45" title="Help center is not available in this phase" disabled>
          <HelpCircle className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 border-l border-line pl-3 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfe8f5] text-xs">AS</span>
          <span className="hidden sm:inline">Arjun Singh</span>
        </div>
      </div>
    </header>
  );
}

const routeLabels: Record<string, string> = {
  "case-inbox": "Case Inbox",
  msmes: "Credit File",
  "data-room": "Data Room",
  "evidence-map": "Evidence Map",
  copilot: "Credit Copilot",
  dashboard: "Overview",
  watchlist: "Watchlist",
  portfolio: "Portfolio Signals",
  alerts: "Alerts",
  reports: "Reports",
  "data-insights": "Data Insights",
  "model-monitor": "Model Monitor",
  "policy-center": "Policy Center",
  "data-dictionary": "Data Dictionary",
  governance: "Audit Trail"
};

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
};

export function AppShell({ children, title, subtitle, actions, meta }: AppShellProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const pageTitle = title ?? routeLabels[segments[0] ?? "dashboard"] ?? "LendSignal 360";

  return (
    <div className="min-h-screen bg-workspace text-ink">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[240px] lg:flex">
        <WorkspaceSidebar pathname={pathname} />
      </div>
      <div className="min-h-screen lg:pl-[240px]">
        <TopCommandBar />
        <main className="mx-auto min-h-[calc(100vh-104px)] max-w-[1640px] px-4 py-4 sm:px-6">
          <BreadcrumbHeader title={pageTitle} subtitle={subtitle} actions={actions} segments={segments} />
          {children}
        </main>
        <MetaFooter meta={meta} />
      </div>
    </div>
  );
}

function BreadcrumbHeader({ title, subtitle, actions, segments }: { title: string; subtitle?: string; actions?: React.ReactNode; segments: string[] }) {
  return (
    <div className="mb-5">
      <div className="mb-4 flex min-h-8 items-center justify-between gap-4 border-b border-line pb-3 text-xs">
        <div className="flex items-center gap-2 text-muted">
          <Link href="/case-inbox" className="hover:text-ink transition-colors">Case Inbox</Link>
          {segments.map((segment) => (
            <span key={segment} className="flex items-center gap-2">
              <span>/</span>
              <span className="font-medium text-ink">{routeLabels[segment] ?? segment}</span>
            </span>
          ))}
        </div>
        {actions}
      </div>
      <h1 className="font-serif text-3xl font-semibold tracking-normal text-ink">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}

function MetaFooter({ meta }: { meta?: React.ReactNode }) {
  return (
    <footer className="mx-auto flex max-w-[1640px] flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-xs text-muted sm:px-6">
      {meta ?? (
        <>
          <span>Model: deterministic score service</span>
          <span>Rule Version: score_rules_v1</span>
          <span>Provider: backend configured mode</span>
          <span>Mode: decision-support only</span>
        </>
      )}
      <span className="ml-auto flex items-center gap-1 text-ink"><ActivitySquare className="h-3.5 w-3.5" /> Audit Trail</span>
    </footer>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export { WorkspaceSidebar, TopCommandBar, BreadcrumbHeader, MetaFooter };
