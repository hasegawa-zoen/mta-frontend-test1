"use client";

import { StatusBadge, type EstimateStatus } from "@hasegawa-zoen/ui-kit";
import { getEstimateStatus, type EstimateStatusResponse } from "@hasegawa-zoen/api-client";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../lib/config";

const POLL_INTERVAL_MS = 5000;

export function EstimateStatusPanel({ estimateId }: { estimateId: string }) {
  const { idToken } = useAuth();
  const [status, setStatus] = useState<EstimateStatusResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;

    async function poll() {
      try {
        const result = await getEstimateStatus(config.apiBaseUrl, idToken!, estimateId);
        if (cancelled) return;
        setStatus(result);
        // Backend only ever reports queued -> completed | failed -- no
        // interim states exist, so "still queued" is the only reason to
        // keep polling.
        if (result.status === "queued") {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!cancelled) setErrorMessage(err instanceof Error ? err.message : "状態取得に失敗しました");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [estimateId, idToken]);

  if (errorMessage) return <p role="alert">{errorMessage}</p>;
  if (!status) return <p>読み込み中…</p>;

  const badgeStatus: EstimateStatus = status.status;

  return (
    <div>
      <p>
        見積もりID: {status.id} <StatusBadge status={badgeStatus} />
      </p>
      {/* result_url is populated whenever the worker uploaded artifacts,
          regardless of status -- a "failed" estimate (missing_infos, not an
          exception) still has an estimate.md with the actual explanation
          (see mta-backend-api's GET /v1/estimates/{id}), so this link isn't
          gated on status === "completed". */}
      {status.result_url && (
        <p>
          <a href={status.result_url} target="_blank" rel="noreferrer">
            見積もり結果を開く
          </a>
        </p>
      )}
      {status.status === "failed" && (
        <p role="alert">
          見積もりを生成できませんでした。
          {status.result_url ? "情報が不足している可能性があります。上のリンクから詳細をご確認ください。" : ""}
        </p>
      )}
    </div>
  );
}
