import Link from "next/link";
import { ArrowRight, FileSearch, ShieldCheck } from "lucide-react";
import { decisionSupportCopy } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <section>
            <div className="mb-6 text-sm font-medium text-cyan">LendSignal 360</div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              One controlled workflow for MSME prospect triage, financial health scoring, and credit-case review.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
              Built for bank officers who need deterministic score outputs, prospect readiness signals, reason evidence, missing-data visibility, and auditable next human actions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-cyan px-5 py-3 text-sm font-semibold text-ink">
                Open assessment queue
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/governance" className="inline-flex items-center gap-2 border border-line px-5 py-3 text-sm font-semibold text-slate-100">
                View diagnostics
              </Link>
            </div>
          </section>
          <section className="border border-line bg-panel shadow-cockpit">
            <div className="border-b border-line px-5 py-4 text-sm font-semibold">Credit workflow boundary</div>
            <div className="divide-y divide-line">
              {[
                ["Financial Health Score", "Deterministic score, risk tier, confidence, credit range, and reason factors come from the backend score engine."],
                ["Prospect Readiness", "Relationship prioritization uses backend Prospect Assist signals, not frontend scoring."],
                ["Credit Copilot", "Phase 2 shows only a placeholder. AI brief generation is deferred to the controlled agent phase."]
              ].map(([title, body]) => (
                <div key={title} className="flex gap-4 px-5 py-5">
                  <FileSearch className="mt-1 h-5 w-5 shrink-0 text-cyan" />
                  <div>
                    <div className="font-semibold">{title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-amber/40 bg-amber/10 px-5 py-4 text-sm leading-6 text-slate-200">
              <ShieldCheck className="mr-2 inline h-4 w-4 text-amber" />
              {decisionSupportCopy}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
