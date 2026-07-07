"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BrainCircuit, ExternalLink, FileText, Loader2, Radio, RefreshCw, Send } from "lucide-react";
import { useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { evidenceFileUrl, sendCopilotChat } from "@/lib/api/credit-file";
import { generateCopilotBrief, getCopilotProviderStatus, copilotStreamUrl } from "@/lib/api/copilot";
import { copilotBriefSchema, type CopilotBrief, type TraceStep } from "@/lib/schemas/copilot";
import type { CopilotChatResponse } from "@/lib/schemas/credit-file";
import { decisionSupportCopy } from "@/lib/constants";
import { titleize } from "@/lib/formatters";

type Props = {
  msmeId: string;
  onAuditRefresh?: () => void;
  chatEnabled?: boolean;
};

const bankerPrompts = [
  "Why is this case blocked?",
  "What evidence should I request next?",
  "Explain the score to a branch manager.",
  "Which signal affects confidence most?",
  "Draft an RM follow-up note.",
  "What should be verified before human review?"
];

export function CreditCopilotPanel({ msmeId, onAuditRefresh, chatEnabled = false }: Props) {
  const [brief, setBrief] = useState<CopilotBrief | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "officer" | "copilot"; text: string; response?: CopilotChatResponse }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [streamText, setStreamText] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [providerMode, setProviderMode] = useState<"configured" | "mock" | "groq" | "disabled">("configured");
  const eventSourceRef = useRef<EventSource | null>(null);
  const providerStatusQuery = useQuery({
    queryKey: ["copilot", "provider-status"],
    queryFn: getCopilotProviderStatus,
    staleTime: 60_000,
    refetchOnWindowFocus: false
  });
  const providerStatus = providerStatusQuery.data;

  const mutation = useMutation({
    mutationFn: () => generateCopilotBrief(msmeId),
    onSuccess: (payload) => {
      setBrief(payload);
      setStreamError(null);
      onAuditRefresh?.();
    },
    onError: (error) => {
      setStreamError(providerMessage(error));
      onAuditRefresh?.();
    }
  });

  const chatMutation = useMutation({
    mutationFn: (message: string) => sendCopilotChat(msmeId, message, providerMode === "configured" ? undefined : providerMode),
    onSuccess: (payload, message) => {
      setMessages((current) => [...current, { role: "officer", text: message }, { role: "copilot", text: payload.answer, response: payload }]);
      setChatInput("");
      setStreamError(null);
      onAuditRefresh?.();
    },
    onError: (error) => {
      setStreamError(providerMessage(error));
      onAuditRefresh?.();
    }
  });

  function ask(message: string) {
    const trimmed = message.trim();
    if (!trimmed || chatMutation.isPending) return;
    chatMutation.mutate(trimmed);
  }

  function startStreaming() {
    eventSourceRef.current?.close();
    setStreamText("");
    setStreamError(null);
    setIsStreaming(true);
    const source = new EventSource(copilotStreamUrl(msmeId));
    eventSourceRef.current = source;
    source.addEventListener("status", (event) => {
      const payload = parseEvent(event);
      setStreamText((current) => `${current}${payload.message ?? ""}\n`);
    });
    source.addEventListener("node_update", (event) => {
      const payload = parseEvent(event);
      setStreamText((current) => `${current}${titleize(String(payload.node ?? "node"))}: ${payload.status ?? "done"}\n`);
    });
    source.addEventListener("token", (event) => {
      const payload = parseEvent(event);
      setStreamText((current) => `${current}${payload.text ?? ""}`);
    });
    source.addEventListener("final", (event) => {
      const parsed = copilotBriefSchema.parse(JSON.parse((event as MessageEvent).data));
      setBrief(parsed);
      setIsStreaming(false);
      source.close();
      onAuditRefresh?.();
    });
    source.addEventListener("error", (event) => {
      const data = (event as MessageEvent).data;
      if (data) {
        try {
          const payload = JSON.parse(data) as { message?: string };
          setStreamError(payload.message ?? "Credit Copilot streaming failed safely.");
        } catch {
          setStreamError("Credit Copilot streaming disconnected. Deterministic score remains available.");
        }
      } else {
        setStreamError("Credit Copilot streaming disconnected. Deterministic score remains available.");
      }
      setIsStreaming(false);
      source.close();
      onAuditRefresh?.();
    });
  }

  function stopStreaming() {
    eventSourceRef.current?.close();
    setIsStreaming(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-line bg-subtle px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <BrainCircuit className="h-4 w-4 text-cyan" />
            Credit Copilot
          </div>
          <p className="mt-1 text-xs text-muted">
            Provider: <span className="font-medium text-ink">{brief?.provider ?? providerStatus?.active_default_provider ?? "backend"}</span>
            {" / "}Model: <span className="font-medium text-ink">{brief?.model ?? providerStatus?.structured_model ?? "—"}</span>
          </p>
        </div>
        {brief ? (
          <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${
            brief.confidence === "high" ? "border-positive/20 bg-positive/10 text-positive" :
            brief.confidence === "medium_high" ? "border-amber/20 bg-amber/10 text-amber" :
            "border-line bg-subtle text-muted"
          }`}>{titleize(brief.confidence)} Confidence</span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-b border-line bg-white px-5 py-2 text-xs">
        <span className="font-semibold text-muted">Mode</span>
        <select
          value={providerMode}
          onChange={(event) => setProviderMode(event.target.value as "configured" | "mock" | "groq" | "disabled")}
          className="h-8 rounded border border-line bg-surface px-2 text-xs font-medium text-ink outline-none focus:border-navy"
        >
          <option value="configured">Backend configured</option>
          <option value="mock">Mock</option>
          <option value="groq">Groq</option>
          <option value="disabled">Disabled</option>
        </select>
        <span className="text-muted">Explicit Groq mode returns an error if unavailable.</span>
      </div>

      {/* Decision-support banner */}
      <div className="flex items-center gap-2 border-b border-line bg-navy/5 px-5 py-2 text-xs text-ink/70">
        <AlertTriangle className="h-3.5 w-3.5 text-amber shrink-0" />
        <span><strong>Decision-support only.</strong> Requires human review. Based on available evidence.</span>
      </div>

      {providerStatus?.message ? (
        <div className="mx-5 mt-4 rounded-md border border-amber/30 bg-amber/5 p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber"><AlertTriangle className="h-3.5 w-3.5" />Provider Notice</div>
          <p className="mt-1 text-muted">{providerStatus.message}</p>
        </div>
      ) : null}

      {/* Chat area */}
      {chatEnabled ? (
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5">
          {/* Suggested prompts */}
          <div className="flex flex-wrap gap-1.5">
            {bankerPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => ask(prompt)}
                disabled={chatMutation.isPending || mutation.isPending || isStreaming}
                className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message thread */}
          <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-line bg-workspace p-4">
            {messages.length ? messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "officer" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[88%] rounded-md px-4 py-3 text-sm ${
                  message.role === "officer"
                    ? "bg-navy text-white"
                    : "border border-line bg-surface text-ink"
                }`}>
                  {message.role === "copilot" && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
                      <BrainCircuit className="h-3.5 w-3.5 text-cyan" />
                      <span className="font-semibold text-cyan">Credit Copilot</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-6">{message.text}</p>
                  {message.response ? (
                    <div className="mt-3 space-y-2 border-t border-line pt-2 text-xs text-muted">
                      <div className="flex flex-wrap gap-1">
                        {message.response.cited_internal_inputs.map((input) => <SourceChip key={input} input={input} msmeId={msmeId} />)}
                      </div>
                      <TraceAccordion trace={message.response.trace} />
                    </div>
                  ) : null}
                </div>
              </div>
            )) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                <div className="text-center space-y-1">
                  <BrainCircuit className="mx-auto h-8 w-8 text-line" />
                  <p className="font-medium">Ask a case-aware question.</p>
                  <p className="text-xs">Responses cite internal inputs only.</p>
                </div>
              </div>
            )}
            {chatMutation.isPending ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-cyan" />
                Preparing a grounded answer...
              </div>
            ) : null}
          </div>

          {/* Input */}
          <form onSubmit={(event) => { event.preventDefault(); ask(chatInput); }} className="flex gap-2">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about evidence gaps, risk signals, or human review action..."
              className="h-10 min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-sm outline-none placeholder:text-muted focus:border-navy transition-colors"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Ask
            </button>
          </form>
        </div>
      ) : null}

      {/* Brief generation */}
      <div className="border-t border-line p-5 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || isStreaming}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Generate decision-support brief
          </button>
          <button
            type="button"
            onClick={isStreaming ? stopStreaming : startStreaming}
            disabled={mutation.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStreaming ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
            {isStreaming ? "Stop stream" : "Stream decision-support brief"}
          </button>
        </div>

        {streamText ? (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-ink p-4 text-xs leading-5 text-white/80 font-mono">{streamText}</pre>
        ) : null}

        {streamError ? (
          <div className="rounded-md border border-danger/20 bg-danger/5 p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle className="h-3.5 w-3.5" />Copilot unavailable</div>
            <p className="mt-1 text-muted">{streamError}</p>
          </div>
        ) : null}

        {brief ? <BriefView brief={brief} /> : (
          <p className="text-xs leading-5 text-muted">Generate or stream a grounded decision-support brief from backend score, prospect, risk, evidence, and transaction-summary inputs.</p>
        )}
      </div>
    </div>
  );
}

function SourceChip({ input, msmeId }: { input: string; msmeId: string }) {
  const evidenceId = input.startsWith("evidence:") ? input.slice("evidence:".length) : null;
  if (evidenceId) {
    return (
      <a
        href={evidenceFileUrl(msmeId, evidenceId)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-navy hover:bg-white"
      >
        {input}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return <span className="rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px]">{input}</span>;
}

function BriefView({ brief }: { brief: CopilotBrief }) {
  return (
    <div className="space-y-5 text-sm border-t border-line pt-4">
      <div className="rounded-md border border-positive/20 bg-positive/5 p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-positive mb-2">Summary</div>
        <p className="leading-6 text-ink">{brief.summary}</p>
      </div>
      <div className="rounded-md border border-navy/20 bg-navy/5 p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-navy mb-2">Decision-Support Lending Brief</div>
        <p className="leading-6 text-ink">{brief.final_lending_brief}</p>
      </div>
      <BriefSection title="Data Quality Observations" body={brief.data_quality_observations} />
      <BriefSection title="Credit Analyst" body={brief.credit_analyst_explanation} />
      <BriefSection title="Prospect Assist" body={brief.prospect_assist_recommendation} />
      <BriefSection title="Risk Investigator" body={brief.risk_investigator_findings} />
      <div className="rounded-md border border-amber/20 bg-amber/5 p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-amber mb-2">Recommended Human Action</div>
        <p className="leading-6 text-ink">{brief.recommended_human_action}</p>
      </div>
      <BriefListSection title="Assumptions" items={brief.assumptions} />
      <BriefListSection title="Follow-up Questions" items={brief.follow_up_questions} />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Cited Internal Inputs</div>
        <div className="flex flex-wrap gap-1.5">
          {brief.cited_internal_inputs.map((input) => (
            <span key={input} className="rounded border border-line bg-subtle px-2 py-0.5 font-mono text-[10px] text-muted">{input}</span>
          ))}
        </div>
      </div>
      <TraceAccordion trace={brief.trace} />
    </div>
  );
}

function BriefSection({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-line pl-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{title}</div>
      <p className="leading-6 text-ink">{body}</p>
    </div>
  );
}

function BriefListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{title}</div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs leading-5 text-muted">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TraceAccordion({ trace }: { trace: TraceStep[] }) {
  if (!trace.length) return null;
  return (
    <details className="rounded-md border border-line bg-surface">
      <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-muted hover:text-ink transition-colors">
        Agent Trace ({trace.length} steps)
      </summary>
      <div className="divide-y divide-line border-t border-line">
        {trace.map((step) => (
          <div key={step.step_id} className="px-4 py-3 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-ink">{step.step_name}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${step.status === "success" ? "bg-positive/10 text-positive" : "bg-danger/10 text-danger"}`}>
                {step.status}
              </span>
            </div>
            <div className="text-muted leading-5">{step.notes}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

function parseEvent(event: Event): Record<string, unknown> {
  return JSON.parse((event as MessageEvent).data) as Record<string, unknown>;
}

function providerMessage(error: unknown) {
  if (error instanceof ApiError && typeof error.payload === "object" && error.payload !== null) {
    const payload = error.payload as { detail?: { message?: string }; error?: { message?: string } };
    return payload.detail?.message ?? payload.error?.message ?? "Credit Copilot provider unavailable. Deterministic score remains available.";
  }
  return "Credit Copilot provider unavailable. Deterministic score remains available.";
}
