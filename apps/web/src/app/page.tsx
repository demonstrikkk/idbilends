import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { decisionSupportCopy } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-workspace text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
        <section className="rounded-md border border-line bg-surface p-8 shadow-cockpit">
          <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-5">
            <div className="font-serif text-2xl font-semibold">LendSignal 360</div>
            <span className="rounded border border-amber/25 bg-amber/10 px-3 py-1 text-xs font-semibold text-[#8a5a0a]">Decision-support only</span>
          </div>
          <div className="grid gap-10 lg:grid-cols-[1fr_0.75fr]">
            <div>
              <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                MSME credit intelligence from prospect discovery to governed human review.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
                A bank-grade cockpit for Financial Health Score, Prospect Readiness, suggested credit posture, verification gaps, risk monitoring, and audit context.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/command-center" className="inline-flex items-center gap-2 rounded bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-navy">
                  Open Command Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/msmes" className="inline-flex items-center gap-2 rounded border border-line px-5 py-3 text-sm font-semibold text-ink hover:bg-panel2">
                  Open Credit Files
                </Link>
              </div>
            </div>
            <div className="rounded-md border border-line bg-subtle p-5">
              <div className="text-sm font-semibold">Workflow Boundary</div>
              <div className="mt-4 space-y-4 text-sm leading-6 text-muted">
                <p>Financial health scoring, risk tiers, confidence, suggested credit range, and reason factors come from backend deterministic services.</p>
                <p>Prospect Assist signals and recommended human actions come from the backend Prospect Assist service.</p>
                <p>Credit Copilot is active through backend provider modes: mock, Groq, or disabled.</p>
              </div>
              <div className="mt-5 rounded border border-amber/25 bg-amber/10 p-3 text-sm leading-6 text-ink">
                <ShieldCheck className="mr-2 inline h-4 w-4 text-amber" />
                {decisionSupportCopy}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
