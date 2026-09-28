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
  const showWallbounce = isAdmin && latestEstimateId;

  return (
    <RequireAuth>
      <h1>見積作成</h1>
      {/* 壁打ちは旧システム（mitsumori_v2）でも見積もりチャットとは別カラムの
          独立パネルだった（右側、専用の見た目のカード）。同じ1カラムに縦積みすると
          「1つのチャットの続き」に見えてしまう（実機確認で判明）ため、右カラムに
          分離する。旧システムのEstimatePreview独立ペイン・トグル開閉は対象外の
          ままとし、レイアウトの分離のみ踏襲する。 */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <EstimateChat onEstimateReady={isAdmin ? setLatestEstimateId : undefined} />
        </div>
        {showWallbounce && (
          <div
            style={{
              width: "420px",
              flexShrink: 0,
              borderLeft: "1px solid var(--mta-color-border)",
              paddingLeft: "24px",
            }}
          >
            <WallboucePanel estimateId={latestEstimateId} />
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
