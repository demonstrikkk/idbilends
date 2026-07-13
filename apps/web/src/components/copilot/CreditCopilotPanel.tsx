"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BrainCircuit, Loader2, Radio, SendHorizontal, StopCircle, ChevronDown, X, MessageSquareQuote, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { evidenceFileUrl, sendCopilotChat } from "@/lib/api/credit-file";
import { getCopilotProviderStatus, copilotStreamUrl } from "@/lib/api/copilot";
import { useCopilotStream, NODE_ORDER, NODE_LABELS } from "@/lib/hooks/useCopilotStream";
import type { CopilotBrief, TraceStep } from "@/lib/schemas/copilot";
import type { CopilotChatResponse } from "@/lib/schemas/credit-file";
import { titleize } from "@/lib/formatters";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { ApprovalGate } from "./ApprovalGate";
import { TraceTimeline } from "./TraceTimeline";
import { CopilotMarkdown } from "./CopilotMarkdown";
import { cn } from "@/lib/utils";

type Props = {
  msmeId: string;
  onAuditRefresh?: () => void;
  chatEnabled?: boolean;
};

function useAutoScroll(deps: unknown[]) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, deps);
  return bottomRef;
}

export function CreditCopilotPanel({ msmeId, onAuditRefresh, chatEnabled = false }: Props) {
  const [messages, setMessages] = useState<Array<{ role: "officer" | "copilot"; text: string; response?: CopilotChatResponse }>>([]);
  const [chatInput, setChatInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isStreaming,
    streamMarkdown,
    streamError: hookError,
    brief,
    nodeStatuses,
    startStreaming,
    stopStreaming,
    reset,
  } = useCopilotStream(onAuditRefresh);

  const [localStreamError, setLocalStreamError] = useState<string | null>(null);
  const streamError = hookError ?? localStreamError;

  const providerStatusQuery = useQuery({
    queryKey: ["copilot", "provider-status"],
    queryFn: getCopilotProviderStatus,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const providerStatus = providerStatusQuery.data;
  const isAiAvailable = providerStatus?.user_facing_ai_enabled === true;
  const groqModel = providerStatus?.stream_model ?? providerStatus?.structured_model ?? null;

  const scrollRef = useAutoScroll([messages, streamMarkdown, isStreaming, brief]);

  const chatMutation = useMutation({
    mutationFn: (message: string) => sendCopilotChat(msmeId, message),
    onSuccess: (payload, message) => {
      setMessages((current) => [...current, { role: "officer", text: message }, { role: "copilot", text: payload.answer_markdown, response: payload }]);
      setChatInput("");
      setLocalStreamError(null);
      onAuditRefresh?.();
    },
    onError: (error) => {
      setLocalStreamError(providerMessage(error));
      onAuditRefresh?.();
    },
  });

  function ask(message: string) {
    const trimmed = message.trim();
    if (!trimmed || chatMutation.isPending) return;
    chatMutation.mutate(trimmed);
  }

  function handleStreamToggle() {
    if (isStreaming) {
      stopStreaming();
    } else {
      setLocalStreamError(null);
      startStreaming(copilotStreamUrl(msmeId));
    }
  }

  const providerLabel = isAiAvailable
    ? `Groq${groqModel ? ` / ${groqModel}` : ""}`
    : null;

  const hasBrief = brief || streamMarkdown;

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-navy shadow-sm">
            <BrainCircuit className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">Credit Copilot</span>
              {providerLabel && (
                <>
                  <span className="hidden sm:inline-flex h-1.5 w-1.5 rounded-full bg-line" />
                  <span className="hidden sm:inline text-[10px] font-mono text-muted">{providerLabel}</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-muted leading-none mt-0.5">Decision-support only. Requires human review.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {brief ? (
            <Badge
              variant={
                brief.confidence === "high" ? "positive" :
                brief.confidence === "medium_high" ? "warning" :
                "secondary"
              }
              className="text-[10px]"
            >
              {titleize(brief.confidence)} Confidence
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Provider notice */}
      {!isAiAvailable ? (
        <div className="mx-5 mt-3 rounded-lg border border-line/60 bg-workspace p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-muted">
            <AlertTriangle className="h-3.5 w-3.5 text-amber" />
            Groq API key required
          </div>
          <p className="mt-1 text-muted">Set GROQ_API_KEY to enable Credit Copilot streaming and chat. Deterministic score, evidence, and risk views remain available.</p>
        </div>
      ) : null}

      {/* Main content: Chat + Brief */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat section */}
        {chatEnabled ? (
          <div className={cn(
            "flex flex-col overflow-hidden border-b border-line transition-all duration-300",
            hasBrief ? "flex-[2] min-h-[240px]" : "flex-1"
          )}>
            {/* Messages */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "flex",
                    message.role === "officer" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200",
                      message.role === "officer"
                        ? "bg-gradient-to-br from-navy to-[#1a2a4a] text-white rounded-br-md"
                        : "bg-workspace border border-line text-ink rounded-bl-md"
                    )}
                  >
                    {message.role === "copilot" && (
                      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
                        <BrainCircuit className="h-3.5 w-3.5 text-cyan" />
                        <span className="font-semibold text-cyan">Copilot</span>
                      </div>
                    )}
                      <CopilotMarkdown content={message.text} />
                    {message.response ? (
                      <div className="mt-3 space-y-2 border-t border-line/50 pt-2">
                        {message.response.cited_internal_inputs.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {message.response.cited_internal_inputs.map((input) => (
                              <SourceChip key={input} input={input} msmeId={msmeId} />
                            ))}
                          </div>
                        )}
                        {message.response.trace.length > 0 && (
                          <details className="group">
                            <summary className="flex cursor-pointer items-center gap-1 text-[10px] text-muted hover:text-ink transition-colors">
                              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                              Trace ({message.response.trace.length} steps)
                            </summary>
                            <div className="mt-2">
                              <TraceTimeline trace={message.response.trace} compact />
                            </div>
                          </details>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {chatMutation.isPending && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/10">
                    <BrainCircuit className="h-3.5 w-3.5 text-cyan" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-workspace border border-line px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-line [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-line [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-line [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs text-muted">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="border-t border-line px-5 py-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  ask(chatInput);
                  inputRef.current?.focus();
                }}
                className="flex items-end gap-2"
              >
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Ask about evidence gaps, risk signals, or human review..."
                    className="h-11 w-full rounded-xl border border-line bg-workspace px-4 pr-10 text-sm outline-none transition-all duration-200 placeholder:text-muted/60 focus:border-cyan focus:shadow-[0_0_0_2px_rgba(3,105,161,0.1)]"
                    disabled={chatMutation.isPending}
                  />
                  {chatInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setChatInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                      tabIndex={-1}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!chatInput.trim() || chatMutation.isPending}
                  className="h-11 w-11 shrink-0 rounded-xl"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : null}

        {/* Brief section */}
        <div className={cn(
          "min-h-0 overflow-y-auto transition-all duration-300",
          chatEnabled ? hasBrief ? "flex-[1] min-h-[120px]" : "flex-1" : "flex-1"
        )}>
          <div className="p-5 space-y-4">
            {/* Stream / Generate button */}
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "w-full transition-all duration-200",
                isStreaming && "border-cyan/50 bg-cyan/5"
              )}
              onClick={handleStreamToggle}
              disabled={providerStatusQuery.isLoading}
            >
              {isStreaming ? (
                <StopCircle className="h-4 w-4 text-danger" />
              ) : (
                <Radio className="h-4 w-4 text-cyan" />
              )}
              <span>{isStreaming ? "Stop stream" : "Stream decision-support brief"}</span>
            </Button>

            {/* Node status badges during streaming */}
            {isStreaming ? (
              <div className="flex flex-wrap gap-2 animate-fade-in">
                {NODE_ORDER.map((name) => (
                  <AgentStatusBadge key={name} status={nodeStatuses[name]} label={NODE_LABELS[name]} />
                ))}
                <AgentStatusBadge status="running" label="Streaming from Groq" />
              </div>
            ) : null}

            {/* Streaming indicator (during streaming, before final event) */}
            {isStreaming && !streamMarkdown && (
              <div className="flex items-center gap-3 animate-fade-in rounded-lg border border-line/60 bg-workspace p-4">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-muted">Generating decision-support brief...</span>
              </div>
            )}

            {/* Streamed markdown (only from final event) */}
            {streamMarkdown ? (
              <Card className="border-line/60 shadow-sm animate-slide-up overflow-hidden">
                <CardHeader className="border-b border-line/50 bg-gradient-to-r from-cyan/5 to-transparent px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Copilot Response
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-5 py-4">
                  <CopilotMarkdown content={streamMarkdown} />
                </CardContent>
              </Card>
            ) : null}

            {/* Brief metadata */}
            {brief && !isStreaming ? (
              <div className="animate-slide-up space-y-4">
                {/* Follow-up Questions */}
                {brief.follow_up_questions.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Follow-up Questions</div>
                    <div className="space-y-1.5">
                      {brief.follow_up_questions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setChatInput(item);
                            inputRef.current?.focus();
                          }}
                          className="group flex w-full items-start gap-2 rounded-lg border border-line/60 bg-workspace px-3 py-2 text-left text-xs leading-5 text-muted transition-all duration-150 hover:border-cyan/30 hover:bg-cyan/5 hover:text-ink"
                        >
                          <MessageSquareQuote className="mt-0.5 h-3 w-3 shrink-0 text-cyan/60 group-hover:text-cyan" />
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Recommended Human Action */}
                {brief.recommended_human_action ? (
                  <ApprovalGate action={brief.recommended_human_action} variant="warning" />
                ) : null}

                {/* Analysis Details accordion */}
                <AnalysisDetailsAccordion brief={brief} />

                {/* Agent Trace */}
                <TraceTimeline trace={brief.trace} />
              </div>
            ) : null}

            {/* Error */}
            {streamError ? (
              <div className="animate-fade-in rounded-lg border border-danger/20 bg-danger/5 p-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-danger">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Copilot unavailable
                </div>
                <p className="mt-1 text-muted">{streamError}</p>
              </div>
            ) : null}

            {/* Empty state */}
            {!chatEnabled && !brief && !streamMarkdown && !streamError && !isStreaming ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan/10 to-navy/10 mb-4">
                  <BrainCircuit className="h-6 w-6 text-cyan" />
                </div>
                <p className="text-sm font-medium text-ink">Stream a grounded brief</p>
                <p className="mt-1 text-xs text-muted max-w-sm">
                  Generate a decision-support brief from score, prospect, risk, evidence, and transaction-summary inputs.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisDetailsAccordion({ brief }: { brief: CopilotBrief }) {
  const hasDetails =
    brief.data_quality_observations ||
    brief.credit_analyst_explanation ||
    brief.prospect_assist_recommendation ||
    brief.risk_investigator_findings ||
    brief.final_lending_brief;
  if (!hasDetails) return null;

  return (
    <details className="group rounded-lg border border-line bg-surface overflow-hidden">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-semibold text-muted transition-colors hover:text-ink hover:bg-subtle/50">
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        Analysis Details
      </summary>
      <div className="divide-y divide-line border-t border-line">
        {brief.data_quality_observations ? (
          <div className="px-4 py-3 transition-colors hover:bg-subtle/30">
            <div className="mb-1 text-xs font-semibold text-muted">Data Quality Observations</div>
            <p className="text-xs leading-5 text-ink">{brief.data_quality_observations}</p>
          </div>
        ) : null}
        {brief.credit_analyst_explanation ? (
          <div className="px-4 py-3 transition-colors hover:bg-subtle/30">
            <div className="mb-1 text-xs font-semibold text-muted">Credit Analyst</div>
            <p className="text-xs leading-5 text-ink">{brief.credit_analyst_explanation}</p>
          </div>
        ) : null}
        {brief.prospect_assist_recommendation ? (
          <div className="px-4 py-3 transition-colors hover:bg-subtle/30">
            <div className="mb-1 text-xs font-semibold text-muted">Prospect Assist</div>
            <p className="text-xs leading-5 text-ink">{brief.prospect_assist_recommendation}</p>
          </div>
        ) : null}
        {brief.risk_investigator_findings ? (
          <div className="px-4 py-3 transition-colors hover:bg-subtle/30">
            <div className="mb-1 text-xs font-semibold text-muted">Risk Investigator</div>
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
        className="inline-flex items-center gap-1 rounded-md border border-line/60 bg-subtle/80 px-1.5 py-0.5 font-mono text-[10px] text-navy transition-colors hover:bg-surface hover:border-navy/30"
      >
        {input}
        <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <path d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.77614 2 9.5 2H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z" fill="currentColor" />
        </svg>
      </a>
    );
  }
  if (isScoreHistory) {
    return (
      <span className="cursor-default rounded-md border border-line/60 bg-subtle/80 px-1.5 py-0.5 font-mono text-[10px] text-muted">
        {input}
      </span>
    );
  }
  return <span className="rounded-md border border-line/60 bg-subtle/80 px-1.5 py-0.5 font-mono text-[10px] text-muted">{input}</span>;
}

function providerMessage(error: unknown) {
  if (error instanceof ApiError && typeof error.payload === "object" && error.payload !== null) {
    const payload = error.payload as { detail?: { message?: string }; error?: { message?: string } };
    return payload.detail?.message ?? payload.error?.message ?? "Credit Copilot provider unavailable. Deterministic score remains available.";
  }
  return "Credit Copilot provider unavailable. Deterministic score remains available.";
}
