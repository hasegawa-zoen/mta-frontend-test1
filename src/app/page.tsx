"use client";

import { EstimateChat } from "../components/EstimateChat";
import { RequireAuth } from "../components/RequireAuth";

export default function HomePage() {
  return (
    <RequireAuth>
      <h1>見積作成</h1>
      <EstimateChat />
    </RequireAuth>
  );
}
