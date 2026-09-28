"use client";

import { useState } from "react";
import { CategorySettingsTab } from "../../components/admin/CategorySettingsTab";
import { RulesTab } from "../../components/admin/RulesTab";
import { SystemPromptTab } from "../../components/admin/SystemPromptTab";
import { UsersTab } from "../../components/admin/UsersTab";
import { RequireAdmin } from "../../components/RequireAdmin";
import { RequireAuth } from "../../components/RequireAuth";

type TabKey = "rules" | "system-prompt" | "category-settings" | "users";

const TABS: { key: TabKey; label: string }[] = [
  { key: "rules", label: "ルール・単価表" },
  { key: "system-prompt", label: "システムプロンプト" },
  { key: "category-settings", label: "分類階層設定" },
  { key: "users", label: "ユーザ管理" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("rules");

  return (
    <RequireAuth>
      <RequireAdmin>
        <h1>管理コンソール</h1>
        <div role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "rules" && <RulesTab />}
        {activeTab === "system-prompt" && <SystemPromptTab />}
        {activeTab === "category-settings" && <CategorySettingsTab />}
        {activeTab === "users" && <UsersTab />}
      </RequireAdmin>
    </RequireAuth>
  );
}
