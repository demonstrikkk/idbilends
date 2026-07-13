"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback, useRef } from "react";
import {
  ActivitySquare,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  Database,
  FileText,
  Files,
  FolderKanban,
  HelpCircle,
  Map,
  MessageSquareText,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TableProperties,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const SIDEBAR_COLLAPSED = "w-16";
const SIDEBAR_EXPANDED = "w-56";
const SIDEBAR_TRANSITION = "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

const primaryWorkflow = [
  { href: "/command-center", label: "Command Center", icon: TableProperties },
  { href: "/case-inbox", label: "Case Inbox", icon: TableProperties },
  { href: "/msmes", label: "Credit File", icon: FolderKanban },
  {
    label: "Evidence Room",
    icon: Files,
    subItems: [
      { href: "/data-room", label: "Data Room", icon: Database },
      { href: "/evidence-map", label: "Evidence Map", icon: Map },
    ],
  },
  { href: "/copilot", label: "Credit Copilot", icon: MessageSquareText },
  { href: "/monitoring", label: "Live Monitoring", icon: ActivitySquare },
  { href: "/portfolio", label: "Portfolio Signals", icon: BarChart3 },
  { href: "/governance", label: "Governance", icon: ShieldCheck },
];

const systemNav = [
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/watchlist", label: "Watchlist", icon: Bell },
  { href: "/data-dictionary", label: "Data Dictionary", icon: BookOpen },
  { href: "/policy-center", label: "Policy Center", icon: FileText },
];

function WorkspaceSidebar({ pathname, expanded, onHoverChange }: { pathname: string; expanded: boolean; onHoverChange: (hovering: boolean) => void }) {
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    onHoverChange(true);
  }, [onHoverChange]);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => onHoverChange(false), 150);
  }, [onHoverChange]);

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "flex h-screen flex-col bg-ink text-ivory dark:bg-navy/20 dark:text-ink border-r border-line overflow-hidden",
        SIDEBAR_TRANSITION,
        expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED
      )}
    >
      {/* Brand */}
      <Link
        href="/"
        className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 dark:border-line px-4 transition-colors hover:bg-white/5"
      >
        <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded bg-cyan text-sm font-bold text-ivory shadow-sm transition-transform duration-300 group-hover:scale-110">
          LS
        </span>
        <div className={cn("flex flex-col overflow-hidden", SIDEBAR_TRANSITION, expanded ? "opacity-100" : "opacity-0 w-0")}>
          <span className="whitespace-nowrap font-serif text-[17px] font-semibold tracking-wide text-ivory dark:text-ink">LendSignal 360</span>
          <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-ivory/50 dark:text-muted">Credit Workspace</span>
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-6">
        <div>
          <div className={cn("mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-ivory/40 dark:text-muted overflow-hidden", SIDEBAR_TRANSITION, expanded ? "opacity-100" : "opacity-0 h-0")}>
            Primary Workflow
          </div>
          <nav className="space-y-1">
            {primaryWorkflow.map((item, idx) => {
              if (item.subItems) {
                return (
                  <div key={idx}>
                    <div className="flex h-10 items-center justify-center gap-3 rounded-lg px-2 text-sm font-medium text-ivory/50 dark:text-muted">
                      <item.icon className="h-5 w-5 shrink-0" />
                    </div>
                    {expanded && (
                      <div className="ml-6 space-y-0.5 border-l border-ivory/10 dark:border-line pl-2">
                        {item.subItems.map((subItem) => (
                          <SidebarLink key={subItem.href} href={subItem.href} active={isActive(pathname, subItem.href)} icon={<subItem.icon className="h-4 w-4 shrink-0" />} expanded={expanded}>
                            {subItem.label}
                          </SidebarLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <SidebarLink
                  key={item.href}
                  href={item.href!}
                  active={isActive(pathname, item.href!)}
                  icon={<item.icon className="h-5 w-5 shrink-0" />}
                  expanded={expanded}
                >
                  {item.label}
                </SidebarLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className={cn("mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-ivory/40 dark:text-muted overflow-hidden", SIDEBAR_TRANSITION, expanded ? "opacity-100" : "opacity-0 h-0")}>
            System
          </div>
          <nav className="space-y-1">
            {systemNav.map((item) => (
              <SidebarLink key={item.href} href={item.href} active={isActive(pathname, item.href)} icon={<item.icon className="h-5 w-5 shrink-0" />} expanded={expanded}>
                {item.label}
              </SidebarLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className={cn("mt-auto border-t border-ivory/10 dark:border-line", SIDEBAR_TRANSITION, expanded ? "p-4" : "p-2")}>
        {expanded ? (
          <div className="mb-3 rounded-lg border border-ivory/10 dark:border-line bg-ivory/5 dark:bg-subtle p-3 text-xs">
            <div className="mb-1 flex items-center gap-2 font-medium text-ivory/90 dark:text-ink">
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber" />
              Decision-Support Mode
            </div>
            <p className="text-ivory/60 dark:text-muted">Copilot provides reasoning, not final credit decisions.</p>
          </div>
        ) : null}
        <div className={cn("flex items-center gap-3 rounded-md px-2 py-2", expanded ? "" : "justify-center")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-medium text-ivory ring-1 ring-ivory/20 dark:ring-line transition-transform hover:scale-110">
            AS
          </div>
          <div className={cn("flex flex-col overflow-hidden", SIDEBAR_TRANSITION, expanded ? "opacity-100" : "opacity-0 w-0")}>
            <span className="truncate whitespace-nowrap text-sm font-medium text-ivory dark:text-ink">Arjun Singh</span>
            <span className="truncate whitespace-nowrap text-xs text-ivory/50 dark:text-muted">Credit Officer</span>
          </div>
          <Settings className={cn("ml-auto h-4 w-4 text-ivory/40 dark:text-muted shrink-0", SIDEBAR_TRANSITION, expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden")} />
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ href, active, icon, children, expanded }: { href: string; active: boolean; icon: React.ReactNode; children: React.ReactNode; expanded: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber",
        expanded ? "px-3" : "justify-center px-0",
        active
          ? "bg-navy/80 text-ivory shadow-sm dark:bg-navy/20 dark:text-ink"
          : "text-ivory/60 hover:bg-white/5 hover:text-ivory dark:text-muted dark:hover:text-ink dark:hover:bg-subtle"
      )}
      title={!expanded ? String(children) : undefined}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-amber shadow-[0_0_6px_rgba(217,119,6,0.5)]" />
      )}
      <span className={cn("transition-transform duration-200", !active && "group-hover:scale-110")}>{icon}</span>
      <span className={cn("overflow-hidden whitespace-nowrap", SIDEBAR_TRANSITION, expanded ? "opacity-100" : "opacity-0 w-0")}>{children}</span>
    </Link>
  );
}

function TopCommandBar({ sidebarExpanded }: { sidebarExpanded?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/80 px-4 backdrop-blur-xl sm:px-6 transition-all duration-300">
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/command-center" className="font-serif text-lg font-semibold">LendSignal 360</Link>
      </div>
      <label className="group relative ml-auto hidden h-9 w-full max-w-[380px] items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted transition-all duration-200 focus-within:border-cyan focus-within:shadow-[0_0_0_2px_rgba(3,105,161,0.15)] md:flex">
        <Search className="h-4 w-4 shrink-0 transition-transform duration-200 group-focus-within:scale-110" />
        <input className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted" placeholder="Search credit files or evidence" />
      </label>
      <div className="ml-4 flex items-center gap-2 text-ink">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-subtle transition-all duration-200 hover:scale-110 active:scale-95"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <span className="transition-transform duration-500 rotate-0 dark:-rotate-90">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </span>
        </button>
        <Link
          href="/alerts"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-subtle transition-all duration-200 hover:scale-110 active:scale-95"
          title="Alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger animate-pulse" />
        </Link>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg opacity-40 cursor-default"
          title="Help center"
          disabled
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 border-l border-line pl-3 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-xs text-ink transition-transform hover:scale-110">AS</span>
          <span className="hidden sm:inline">Arjun Singh</span>
        </div>
      </div>
    </header>
  );
}

const routeLabels: Record<string, string> = {
  "command-center": "Command Center",
  "case-inbox": "Case Inbox",
  msmes: "Credit File",
  "data-room": "Data Room",
  "evidence-map": "Evidence Map",
  copilot: "Credit Copilot",
  monitoring: "Live Monitoring",
  dashboard: "Overview",
  watchlist: "Watchlist",
  portfolio: "Portfolio Signals",
  alerts: "Alerts",
  reports: "Reports",
  "data-insights": "Data Insights",
  "model-monitor": "Model Monitor",
  "policy-center": "Policy Center",
  "data-dictionary": "Data Dictionary",
  governance: "Audit Trail",
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
  const [sidebarHover, setSidebarHover] = useState(false);
  const sidebarExpanded = sidebarHover;

  return (
    <div className="min-h-screen bg-workspace text-ink">
      <div className={cn("fixed inset-y-0 left-0 z-40 hidden lg:flex", SIDEBAR_TRANSITION)}>
        <WorkspaceSidebar pathname={pathname} expanded={sidebarExpanded} onHoverChange={setSidebarHover} />
      </div>
      <div className={cn("min-h-screen", SIDEBAR_TRANSITION, sidebarExpanded ? "lg:pl-56" : "lg:pl-16")}>
        <TopCommandBar sidebarExpanded={sidebarExpanded} />
        <main className="mx-auto min-h-[calc(100vh-104px)] max-w-[1640px] px-4 py-4 sm:px-6 animate-fade-in">
          <BreadcrumbHeader title={pageTitle} subtitle={subtitle} actions={actions} segments={segments} />
          <div className="space-y-1">{children}</div>
        </main>
        <MetaFooter meta={meta} />
      </div>
    </div>
  );
}

function BreadcrumbHeader({ title, subtitle, actions, segments }: { title: string; subtitle?: string; actions?: React.ReactNode; segments: string[] }) {
  return (
    <div className="mb-5 animate-slide-up">
      <div className="mb-4 flex min-h-8 items-center justify-between gap-4 border-b border-line pb-3 text-xs">
        <div className="flex items-center gap-2 text-muted">
          <Link href="/command-center" className="relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-ink after:transition-all after:duration-300 hover:after:w-full hover:text-ink transition-colors">
            Command Center
          </Link>
          {segments.map((segment) => (
            <span key={segment} className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-muted/50" />
              <span className="font-medium text-ink">{routeLabels[segment] ?? segment}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 [&>*]:transition-all [&>*]:duration-200 [&>*]:hover:scale-105">{actions}</div>
      </div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}

function MetaFooter({ meta }: { meta?: React.ReactNode }) {
  return (
    <footer className="mx-auto flex max-w-[1640px] flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-xs text-muted sm:px-6 transition-all duration-300">
      {meta ?? (
        <>
          <span className="flex items-center gap-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-positive">Model: deterministic score service</span>
          <span className="flex items-center gap-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-muted/30">Rule Version: score_rules_v1</span>
          <span className="flex items-center gap-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-muted/30">Provider: backend configured mode</span>
          <span className="flex items-center gap-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-amber">Mode: decision-support only</span>
        </>
      )}
      <span className="ml-auto flex items-center gap-1.5 text-ink/60 hover:text-ink transition-colors">
        <ActivitySquare className="h-3.5 w-3.5" /> Audit Trail
      </span>
    </footer>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export { WorkspaceSidebar, TopCommandBar, BreadcrumbHeader, MetaFooter };
