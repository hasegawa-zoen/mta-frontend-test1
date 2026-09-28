"use client";

import { Button, Sidebar, SidebarNavItem } from "@hasegawa-zoen/ui-kit";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export function AppSidebar({ tenantName }: { tenantName: string }) {
  const { tenantContext, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = tenantContext?.role === "admin";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <Sidebar tenantName={tenantName}>
      <SidebarNavItem href="/" label="見積作成" active={pathname === "/"} />
      {isAdmin && (
        <SidebarNavItem href="/admin" label="管理" active={Boolean(pathname?.startsWith("/admin"))} />
      )}
      {/* ログアウトは操作ボタン（サイドバー規約のナビリンクではない）なので
          SidebarNavItemではなくButtonを使う。secondaryバリアントを指定するのは、
          デフォルトのButtonがSidebarNavItem--activeと同じアクセントカラーで
          塗られており、選択中のナビ項目に見えてしまうため。 */}
      <Button type="button" className="mta-button--secondary" onClick={handleLogout}>
        ログアウト
      </Button>
    </Sidebar>
  );
}
