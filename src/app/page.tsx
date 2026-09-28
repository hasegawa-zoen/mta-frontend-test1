"use client";

import { useState } from "react";
import { EstimateChat } from "../components/EstimateChat";
import { RequireAuth } from "../components/RequireAuth";
import { WallboucePanel } from "../components/WallboucePanel";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const { tenantContext } = useAuth();
  const [latestEstimateId, setLatestEstimateId] = useState<string | null>(null);
  const isAdmin = tenantContext?.role === "admin";

  return (
    <RequireAuth>
      <h1>見積作成</h1>
      <EstimateChat onEstimateReady={isAdmin ? setLatestEstimateId : undefined} />
      {isAdmin && latestEstimateId && <WallboucePanel estimateId={latestEstimateId} />}
    </RequireAuth>
  );
}
