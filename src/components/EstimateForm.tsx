"use client";

import { Button } from "@hasegawa-zoen/ui-kit";
import { createEstimate } from "@hasegawa-zoen/api-client";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../lib/config";

export function EstimateForm({ onCreated }: { onCreated: (estimateId: string) => void }) {
  const { idToken } = useAuth();
  const [query, setQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idToken || !query.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await createEstimate(config.apiBaseUrl, idToken, {
        query,
        customer_name: customerName,
      });
      onCreated(result.id);
      setQuery("");
      setCustomerName("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "見積もりの送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
        <label htmlFor="estimate-query">見積もり依頼内容</label>
        <br />
        <textarea
          id="estimate-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          required
        />
      </div>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      <Button type="submit" disabled={isSubmitting || !query.trim()} icon={<span>+</span>}>
        {isSubmitting ? "送信中…" : "見積もりを送信"}
      </Button>
    </form>
  );
}
