"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BrainCircuit, ExternalLink, Loader2, Radio, RefreshCw, StopCircle } from "lucide-react";
import { useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { evidenceFileUrl, sendCopilotChat } from "@/lib/api/credit-file";
import { getCopilotProviderStatus, copilotStreamUrl } from "@/lib/api/copilot";
import { copilotBriefSchema, type CopilotBrief, type TraceStep } from "@/lib/schemas/copilot";
import type { CopilotChatResponse } from "@/lib/schemas/credit-file";
import { decisionSupportCopy } from "@/lib/constants";
import { titleize } from "@/lib/formatters";
import { CopilotMarkdown } from "./CopilotMarkdown";

type Props = {
  msmeId: string;
  onAuditRefresh?: () => void;
  chatEnabled?: boolean;
};

type NodeName = "data_quality_node" | "credit_analyst_node" | "prospect_assist_node" | "risk_investigator_node";

const NODE_LABELS: Record<NodeName, string> = {
  data_quality_node: "Data Quality",
  credit_analyst_node: "Credit Analyst",
  prospect_assist_node: "Prospect Assist",
  risk_investigator_node: "Risk Investigator",
};

const NODE_ORDER: NodeName[] = ["data_quality_node", "credit_analyst_node", "prospect_assist_node", "risk_investigator_node"];

export function CreditCopilotPanel({ msmeId, onAuditRefresh, chatEnabled = false }: Props) {
  const [brief, setBrief] = useState<CopilotBrief | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "officer" | "copilot"; text: string; response?: CopilotChatResponse }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [streamMarkdown, setStreamMarkdown] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Record<NodeName, "pending" | "running" | "done">>(
    Object.fromEntries(NODE_ORDER.map((n) => [n, "pending"])) as Record<NodeName, "pending" | "running" | "done">
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const providerStatusQuery = useQuery({
    queryKey: ["copilot", "provider-status"],
    queryFn: getCopilotProviderStatus,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const providerStatus = providerStatusQuery.data;
  const isAiAvailable = providerStatus?.user_facing_ai_enabled === true;
  const groqModel = providerStatus?.stream_model ?? providerStatus?.structured_model ?? null;

  const chatMutation = useMutation({
    mutationFn: (message: string) => sendCopilotChat(msmeId, message),
    onSuccess: (payload, message) => {
      setMessages((current) => [...current, { role: "officer", text: message }, { role: "copilot", text: payload.answer, response: payload }]);
      setChatInput("");
      setStreamError(null);
      onAuditRefresh?.();
    },
    onError: (error) => {
      setStreamError(providerMessage(error));
      onAuditRefresh?.();
    },
  });

  function ask(message: string) {
    const trimmed = message.trim();
    if (!trimmed || chatMutation.isPending) return;
    chatMutation.mutate(trimmed);
  }

  function startStreaming() {
    eventSourceRef.current?.close();
    setStreamMarkdown("");
    setStreamError(null);
    setIsStreaming(true);
    setNodeStatuses(
      Object.fromEntries(NODE_ORDER.map((n) => [n, "pending"])) as Record<NodeName, "pending" | "running" | "done">
    );

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const source = new EventSource(copilotStreamUrl(msmeId));
    eventSourceRef.current = source;

    source.addEventListener("status", () => {});

    source.addEventListener("node_update", (event) => {
      const payload = parseEvent(event);
      const nodeName = String(payload.node ?? "") as NodeName;
      if (NODE_ORDER.includes(nodeName)) {
        setNodeStatuses((prev) => ({ ...prev, [nodeName]: "done" }));
      }
    });

    source.addEventListener("token", (event) => {
      const payload = parseEvent(event);
      const md = payload.markdown ?? payload.text ?? "";
      if (md) {
        setStreamMarkdown((current) => `${current}${md}`);
      }
    });

    source.addEventListener("final", (event) => {
      try {
        const parsed = copilotBriefSchema.parse(JSON.parse((event as MessageEvent).data));
        setBrief(parsed);
        if (parsed.answer_markdown) {
          setStreamMarkdown(parsed.answer_markdown);
        }
      } catch {
        setStreamError("Credit Copilot final response could not be parsed.");
      }
      setIsStreaming(false);
      source.close();
      onAuditRefresh?.();
    });

    source.addEventListener("error", (event) => {
      const data = (event as MessageEvent).data;
      if (data) {
        try {
          const payload = JSON.parse(data) as { message?: string };
          setStreamError(payload.message ?? "Live Credit Copilot is unavailable. Deterministic score remains available.");
        } catch {
          setStreamError("Live Credit Copilot is unavailable. Deterministic score remains available.");
        }
      } else {
        setStreamError("Live Credit Copilot is unavailable. Deterministic score remains available.");
      }
      setIsStreaming(false);
      source.close();
      onAuditRefresh?.();
    });
  }

  function stopStreaming() {
    abortControllerRef.current?.abort();
    eventSourceRef.current?.close();
    setIsStreaming(false);
  }

  const providerLabel = isAiAvailable
    ? `Live AI: Groq${groqModel ? ` / ${groqModel}` : ""}`
    : "AI unavailable";

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
            {providerLabel}
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

      {/* Decision-support banner */}
      <div className="flex items-center gap-2 border-b border-line bg-navy/5 px-5 py-2 text-xs text-ink/70">
        <AlertTriangle className="h-3.5 w-3.5 text-amber shrink-0" />
        <span><strong>Decision-support only.</strong> Requires human review. Based on available evidence.</span>
      </div>

      {providerStatus?.message && !isAiAvailable ? (
        <div className="mx-5 mt-4 rounded-md border border-amber/30 bg-amber/5 p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber"><AlertTriangle className="h-3.5 w-3.5" />Provider Notice</div>
          <p className="mt-1 text-muted">{providerStatus.message}</p>
          <p className="mt-2 text-muted">Deterministic score, evidence, and risk views remain available.</p>
        </div>
      ) : null}

      {/* Chat area */}
      {chatEnabled ? (
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5">
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
              Ask
            </button>
          </form>
        </div>
      ) : null}

      {/* Brief area */}
      <div className="border-t border-line p-5 space-y-4">
        <button
          type="button"
          onClick={isStreaming ? stopStreaming : startStreaming}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isStreaming ? <StopCircle className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
          {isStreaming ? "Stop stream" : "Stream decision-support brief"}
        </button>

        {/* Node status chips during streaming */}
        {isStreaming ? (
          <div className="flex flex-wrap gap-2">
            {NODE_ORDER.map((name) => {
              const status = nodeStatuses[name];
              return (
                <span
                  key={name}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    status === "done"
                      ? "bg-positive/10 text-positive border border-positive/20"
                      : status === "running"
                      ? "bg-cyan/10 text-cyan border border-cyan/20"
                      : "bg-subtle text-muted border border-line"
                  }`}
                >
                  {status === "done" ? "✓" : status === "running" ? <Loader2 className="h-3 w-3 animate-spin" /> : "○"}
                  {NODE_LABELS[name]}
                </span>
              );
            })}
            {isStreaming && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan border border-cyan/20">
                <Loader2 className="h-3 w-3 animate-spin" />
                Streaming from Groq...
              </span>
            )}
          </div>
        ) : null}

        {/* Streamed Markdown answer */}
        {streamMarkdown ? (
          <div className="rounded-md border border-line bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <BrainCircuit className="h-3.5 w-3.5 text-cyan" />
              Credit Copilot Answer
            </div>
            <div className="prose-sm max-w-none">
              <CopilotMarkdown content={streamMarkdown} />
            </div>
          </div>
        ) : null}

        {/* Final brief metadata (only after streaming completes with a final event) */}
        {brief && !isStreaming ? (
          <div className="space-y-4">
            {/* Supporting Evidence */}
            {brief.cited_internal_inputs.length > 0 ? (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Supporting Evidence</div>
                <div className="flex flex-wrap gap-1.5">
                  {brief.cited_internal_inputs.map((input) => (
                    <SourceChip key={input} input={input} msmeId={msmeId} />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Assumptions */}
            {brief.assumptions.length > 0 ? (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Assumptions</div>
                <ul className="space-y-1">
                  {brief.assumptions.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs leading-5 text-muted">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Follow-up Questions */}
            {brief.follow_up_questions.length > 0 ? (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Follow-up Questions</div>
                <ol className="list-decimal space-y-1 pl-5">
                  {brief.follow_up_questions.map((item) => (
                    <li key={item} className="text-xs leading-5 text-muted">{item}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* Recommended Human Action */}
            {brief.recommended_human_action ? (
              <div className="rounded-md border border-amber/20 bg-amber/5 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-amber mb-2">Recommended Human Action</div>
                <p className="text-sm leading-6 text-ink">{brief.recommended_human_action}</p>
              </div>
            ) : null}

            {/* Analysis Details accordion - collapsed, contains node outputs */}
            <AnalysisDetailsAccordion brief={brief} />

            {/* Agent Trace */}
            <TraceAccordion trace={brief.trace} />
          </div>
        ) : null}

        {streamError ? (
          <div className="rounded-md border border-danger/20 bg-danger/5 p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle className="h-3.5 w-3.5" />Copilot unavailable</div>
            <p className="mt-1 text-muted">{streamError}</p>
          </div>
        ) : null}

        {!brief && !streamMarkdown && !streamError && !isStreaming ? (
          <p className="text-xs leading-5 text-muted">Generate or stream a grounded decision-support brief from backend score, prospect, risk, evidence, and transaction-summary inputs.</p>
        ) : null}
      </div>
    </div>
  );
}

function AnalysisDetailsAccordion({ brief }: { brief: CopilotBrief }) {
  const hasDetails = brief.data_quality_observations || brief.credit_analyst_explanation || brief.prospect_assist_recommendation || brief.risk_investigator_findings || brief.final_lending_brief;
  if (!hasDetails) return null;
  return (
    <details className="rounded-md border border-line bg-surface">
      <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-muted hover:text-ink transition-colors">
        Analysis Details
      </summary>
      <div className="divide-y divide-line border-t border-line">
        {brief.data_quality_observations ? (
          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-muted mb-1">Data Quality Observations</div>
            <p className="text-xs leading-5 text-ink">{brief.data_quality_observations}</p>
          </div>
        ) : null}
        {brief.credit_analyst_explanation ? (
          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-muted mb-1">Credit Analyst</div>
            <p className="text-xs leading-5 text-ink">{brief.credit_analyst_explanation}</p>
          </div>
        ) : null}
        {brief.prospect_assist_recommendation ? (
          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-muted mb-1">Prospect Assist</div>
            <p className="text-xs leading-5 text-ink">{brief.prospect_assist_recommendation}</p>
          </div>
        ) : null}
        {brief.risk_investigator_findings ? (
          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-muted mb-1">Risk Investigator</div>
            <p className="text-xs leading-5 text-ink">{brief.risk_investigator_findings}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function SourceChip({ input, msmeId }: { input: string; msmeId: string }) {
  const evidenceId = input.startsWith("evidence:") ? input.slice("evidence:".length) : null;
  const isScoreHistory = input.startsWith("score_history:") || input.startsWith("score_delta_event:");
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
  if (isScoreHistory) {
    return (
      <span className="rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-muted cursor-default">
        {input}
      </span>
    );
  }
  return <span className="rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-muted">{input}</span>;
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
