"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";

/** Admin console access is admin-only (画面仕様§1・§3.2: 壁打ち・管理はadmin限定).
 * RequireAuth already guarantees isAuthenticated by the time this runs, so
 * this only needs to additionally gate on role. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isLoading, tenantContext } = useAuth();
  const router = useRouter();
  const isAdmin = tenantContext?.role === "admin";

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return <p>読み込み中…</p>;
  }

  return <>{children}</>;
}
