"use client";

import { Button } from "@hasegawa-zoen/ui-kit";
import { getCategorySettings, putCategorySettings } from "@hasegawa-zoen/api-client";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { config } from "../../lib/config";

// データフォーマット・階層数はM5.1で確定予定（画面仕様§3.4/§6-6）のため、ここでは
// 生JSON編集に留める。ツリーUI等の詳細仕様はフォーマット確定後に別途対応する。
export function CategorySettingsTab() {
  const { idToken } = useAuth();
  const [text, setText] = useState("{}");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!idToken) return;
    getCategorySettings(config.apiBaseUrl, idToken)
      .then((result) => setText(JSON.stringify(result, null, 2)))
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setIsLoading(false));
  }, [idToken]);

  async function handleSave() {
    if (!idToken) return;
    setErrorMessage(null);
    setSavedMessage(null);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      setErrorMessage("JSONとして解釈できません。構文を確認してください。");
      return;
    }

    setIsSaving(true);
    try {
      await putCategorySettings(config.apiBaseUrl, idToken, parsed);
      setSavedMessage("保存しました");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p>読み込み中…</p>;

  return (
    <div>
      <h2>分類階層設定</h2>
      <p>
        大分類・中分類・小分類の対応関係をJSON形式で編集します（フォーマットは今後の確定を待って
        専用UIに置き換え予定）。
      </p>
      <div>
        <label htmlFor="category-settings-json">設定内容（JSON）</label>
        <br />
        <textarea
          id="category-settings-json"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          cols={80}
        />
      </div>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {savedMessage && <p>{savedMessage}</p>}
      <Button type="button" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "保存中…" : "保存"}
      </Button>
    </div>
  );
}
