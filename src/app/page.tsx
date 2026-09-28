"use client";

import { useState } from "react";
import { EstimateForm } from "../components/EstimateForm";
import { EstimateStatusPanel } from "../components/EstimateStatusPanel";
import { RequireAuth } from "../components/RequireAuth";

export default function HomePage() {
  const [estimateId, setEstimateId] = useState<string | null>(null);

  return (
    <RequireAuth>
      <h1>見積作成</h1>
      <EstimateForm onCreated={setEstimateId} />
      {estimateId && (
        <>
          <h2>ステータス</h2>
          <EstimateStatusPanel key={estimateId} estimateId={estimateId} />
        </>
      )}
    </RequireAuth>
  );
}
