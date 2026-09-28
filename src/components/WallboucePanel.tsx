"use client";

import { Button } from "@hasegawa-zoen/ui-kit";
import { askWallbounce, getWallbounceSession, type WallbounceMessage } from "@hasegawa-zoen/api-client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../lib/config";

const POLL_INTERVAL_MS = 3000;

/** 画面仕様設計書v1 §3.3の壁打ちチャット（管理者専用、生成済み見積もりについて
 * 対話的に単価根拠等を質問する）。EstimateChat.tsxと同じ「送信→ポーリングで
 * 待つ→結果を追加する」構造だが、状態はDynamoDBのセッション（estimateIdごとに
 * 独立、EstimateChatの会話履歴とは別物）に保持される。
 *
 * スコープ境界: 画面仕様設計書が想定する「見積もりプレビュー」独立ペインの新設は
 * 対象外（EstimateChat内に結果がインライン表示される現状の構成を維持し、壁打ち
 * パネルの追加のみ行う）。
 */
export function WallboucePanel({ estimateId }: { estimateId: string }) {
  const { idToken } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<WallbounceMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // estimateIdが変わったら別の見積もりについての会話なので、セッションを
    // 引き継がず新規に発番し直す。
    setSessionId(null);
    setMessages([]);
    setErrorMessage(null);
  }, [estimateId]);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  async function pollUntilAnswered(
    sid: string,
    expectedLength: number,
  ): Promise<WallbounceMessage[]> {
    for (;;) {
      const result = await getWallbounceSession(config.apiBaseUrl, idToken!, sid);
      if (result.chat_history.length >= expectedLength) return result.chat_history;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!idToken || !draft.trim() || isBusy) return;

    const question = draft.trim();
    const expectedLength = messages.length + 2; // このターンの質問+回答の分
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setDraft("");
    setIsBusy(true);
    setErrorMessage(null);

    try {
      const created = await askWallbounce(config.apiBaseUrl, idToken, {
        estimate_id: estimateId,
        question,
        session_id: sessionId ?? undefined,
      });
      if (!mountedRef.current) return;
      setSessionId(created.session_id);

      const chatHistory = await pollUntilAnswered(created.session_id, expectedLength);
      if (!mountedRef.current) return;
      setMessages(chatHistory);
    } catch (err) {
      if (mountedRef.current) {
        setErrorMessage(err instanceof Error ? err.message : "質問の送信に失敗しました");
      }
    } finally {
      if (mountedRef.current) setIsBusy(false);
    }
  }

  return (
    <div>
      <h2>壁打ち</h2>

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
            {m.suggested_questions && m.suggested_questions.length > 0 && (
              <span>
                <br />
                関連する質問: {m.suggested_questions.join(" / ")}
              </span>
            )}
          </p>
        ))}
        {isBusy && (
          <p>
            <strong>AI:</strong> 回答を生成しています…
          </p>
        )}
      </div>

      {errorMessage && <p role="alert">{errorMessage}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="wallbounce-question">質問</label>
        <br />
        <textarea
          id="wallbounce-question"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          required
        />
        <br />
        <Button type="submit" disabled={isBusy || !draft.trim()}>
          {isBusy ? "送信中…" : "質問する"}
        </Button>
      </form>
    </div>
  );
}
