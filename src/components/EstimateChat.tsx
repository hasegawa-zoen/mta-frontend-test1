"use client";

import { Button } from "@hasegawa-zoen/ui-kit";
import {
  createEstimate,
  getEstimateStatus,
  type ChatMessage,
  type EstimateStatusResponse,
} from "@hasegawa-zoen/api-client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../lib/config";

const POLL_INTERVAL_MS = 5000;

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  resultUrl?: string;
}

/** Builds the assistant's chat-bubble text from a completed/failed
 * EstimateStatusResponse. result_url is deliberately kept out of this text
 * (rendered as a separate link instead) -- this same `content` string is
 * what gets resent as chat_history on the next turn, and a long,
 * hour-lived presigned URL has no business being replayed as conversation
 * context. */
function buildAssistantReply(result: EstimateStatusResponse): string {
  const hasItems = Array.isArray(result.items) && result.items.length > 0;
  const lines: string[] = [
    hasItems
      ? "見積もりを作成しました。"
      : "見積もり作成に必要な情報が不足しています。以下について教えてください。",
  ];

  if (result.missing_infos && result.missing_infos.length > 0) {
    lines.push("", "【確認事項】");
    for (const info of result.missing_infos) {
      const prefix = info.item_name ? `${info.item_name}: ` : "";
      lines.push(`- ${prefix}${info.question}`);
    }
  }

  if (result.missing_rules && result.missing_rules.length > 0) {
    lines.push("", "【ルール不足】一部の単価は暫定値、または未計上です。");
    for (const rule of result.missing_rules) {
      if (rule.description) lines.push(`- ${rule.description}`);
    }
  }

  return lines.join("\n");
}

export function EstimateChat({
  onEstimateReady,
}: {
  /** Called with the most recently generated estimate's id, once each turn
   * finishes (regardless of items being empty) -- lets a parent page show a
   * wallbounce panel for the estimate currently being discussed. */
  onEstimateReady?: (estimateId: string) => void;
}) {
  const { idToken } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [lastItems, setLastItems] = useState<Record<string, unknown>[] | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Short, generic in-progress text ("考え中...", "ツールを実行中...") --
  // never contains RAG search terms/filenames (backend's progress_label
  // contract, see mta-backend-api's anthropic_runtime._public_progress_label).
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  async function pollUntilDone(estimateId: string): Promise<EstimateStatusResponse> {
    for (;;) {
      const result = await getEstimateStatus(config.apiBaseUrl, idToken!, estimateId);
      if (result.status !== "queued") return result;
      if (mountedRef.current) setProgressLabel(result.progress_label);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!idToken || !draft.trim() || isBusy) return;

    const userMessage = draft.trim();
    // Everything sent so far, BEFORE this turn -- query carries the new
    // message separately (mirrors mitsumori_v2's history_text + latest
    // request split, see mta-backend-api's estimate_agent.run()).
    const chatHistory: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setDraft("");
    setIsBusy(true);
    setErrorMessage(null);
    setProgressLabel(null);

    try {
      const created = await createEstimate(config.apiBaseUrl, idToken, {
        query: userMessage,
        customer_name: customerName,
        chat_history: chatHistory.length > 0 ? chatHistory : undefined,
        existing_items: lastItems ?? undefined,
      });
      const result = await pollUntilDone(created.id);
      if (!mountedRef.current) return;

      onEstimateReady?.(created.id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: buildAssistantReply(result),
          resultUrl: result.result_url ?? undefined,
        },
      ]);
      setLastItems(result.items ?? lastItems);
    } catch (err) {
      if (mountedRef.current) {
        setErrorMessage(err instanceof Error ? err.message : "見積もりの送信に失敗しました");
      }
    } finally {
      if (mountedRef.current) {
        setIsBusy(false);
        setProgressLabel(null);
      }
    }
  }

  return (
    <div>
      <div>
        <label htmlFor="customer-name">顧客名（任意）</label>
        <br />
        <input
          id="customer-name"
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      <div>
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.role === "user" ? "あなた" : "AI"}:</strong>{" "}
            {m.content.split("\n").map((line, j) => (
              <span key={j}>
                {line}
                <br />
              </span>
            ))}
            {m.resultUrl && (
              <a href={m.resultUrl} target="_blank" rel="noreferrer">
                見積もり結果を開く
              </a>
            )}
          </p>
        ))}
        {isBusy && (
          <p>
            <strong>AI:</strong>{" "}
            <span style={{ fontSize: "0.85em", color: "#888" }}>
              {progressLabel ?? "生成中…"}
            </span>
          </p>
        )}
      </div>

      {errorMessage && <p role="alert">{errorMessage}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="estimate-query">見積もり依頼内容</label>
        <br />
        <textarea
          id="estimate-query"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          required
        />
        <br />
        <Button type="submit" disabled={isBusy || !draft.trim()}>
          {isBusy ? "送信中…" : "送信"}
        </Button>
      </form>
    </div>
  );
}
