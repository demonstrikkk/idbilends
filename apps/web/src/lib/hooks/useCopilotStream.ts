"use client";

import { useState, useRef, useCallback } from "react";
import { copilotBriefSchema, type CopilotBrief } from "@/lib/schemas/copilot";

type NodeName = "data_quality_node" | "credit_analyst_node" | "prospect_assist_node" | "risk_investigator_node";

export const NODE_ORDER: NodeName[] = [
  "data_quality_node",
  "credit_analyst_node",
  "prospect_assist_node",
  "risk_investigator_node",
];

export const NODE_LABELS: Record<NodeName, string> = {
  data_quality_node: "Data Quality",
  credit_analyst_node: "Credit Analyst",
  prospect_assist_node: "Prospect Assist",
  risk_investigator_node: "Risk Investigator",
};

type NodeStatus = "pending" | "running" | "done" | "error";

interface UseCopilotStreamReturn {
  isStreaming: boolean;
  streamMarkdown: string;
  streamError: string | null;
  brief: CopilotBrief | null;
  nodeStatuses: Record<NodeName, NodeStatus>;
  startStreaming: (url: string) => void;
  stopStreaming: () => void;
  reset: () => void;
}

export function useCopilotStream(onComplete?: () => void): UseCopilotStreamReturn {
  const [brief, setBrief] = useState<CopilotBrief | null>(null);
  const [streamMarkdown, setStreamMarkdown] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Record<NodeName, NodeStatus>>(
    Object.fromEntries(NODE_ORDER.map((n) => [n, "pending"])) as Record<NodeName, NodeStatus>
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createInitialNodeStatuses = (): Record<NodeName, NodeStatus> =>
    Object.fromEntries(NODE_ORDER.map((n) => [n, "pending"])) as Record<NodeName, NodeStatus>;

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    eventSourceRef.current?.close();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setBrief(null);
    setStreamMarkdown("");
    setStreamError(null);
    setIsStreaming(false);
    setNodeStatuses(createInitialNodeStatuses());
  }, []);

  const startStreaming = useCallback(
    (url: string) => {
      stopStreaming();
      setStreamMarkdown("");
      setStreamError(null);
      setIsStreaming(true);
      setNodeStatuses(createInitialNodeStatuses());

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const source = new EventSource(url);
      eventSourceRef.current = source;

      let completed = false;

      source.addEventListener("node_update", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { node?: string };
          const nodeName = String(payload.node ?? "") as NodeName;
          if (NODE_ORDER.includes(nodeName)) {
            setNodeStatuses((prev) => ({ ...prev, [nodeName]: "done" }));
          }
        } catch {
          // ignore malformed node update
        }
      });

      source.addEventListener("token", () => {
        // Tokens are streamed for real-time progress but not displayed.
        // The final event provides the clean structured answer_markdown.
      });

      source.addEventListener("final", (event) => {
        completed = true;
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
        onComplete?.();
      });

      source.addEventListener("error", (event) => {
        if (completed) return;
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
        onComplete?.();
      });
    },
    [stopStreaming, onComplete]
  );

  return {
    isStreaming,
    streamMarkdown,
    streamError,
    brief,
    nodeStatuses,
    startStreaming,
    stopStreaming,
    reset,
  };
}
