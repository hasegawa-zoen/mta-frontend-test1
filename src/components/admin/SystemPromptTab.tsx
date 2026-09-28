"use client";

import { Button } from "@hasegawa-zoen/ui-kit";
import { getSystemPrompt, previewSystemPrompt, putSystemPrompt } from "@hasegawa-zoen/api-client";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { config } from "../../lib/config";

export function SystemPromptTab() {
  const { idToken } = useAuth();
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!idToken) return;
    getSystemPrompt(config.apiBaseUrl, idToken)
      .then((result) => setContent(result.content))
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setIsLoading(false));
  }, [idToken]);

  async function handlePreview() {
    if (!idToken) return;
    setIsPreviewing(true);
    setErrorMessage(null);
    try {
      const result = await previewSystemPrompt(config.apiBaseUrl, idToken, { content });
      setPreview(result.prompt);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "プレビューの生成に失敗しました");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleSave() {
    if (!idToken) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSavedMessage(null);
    try {
      await putSystemPrompt(config.apiBaseUrl, idToken, { content });
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
      <h2>システムプロンプト設定</h2>
      <div>
        <label htmlFor="system-prompt-content">内容（Markdown）</label>
        <br />
        <textarea
          id="system-prompt-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          cols={80}
        />
      </div>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {savedMessage && <p>{savedMessage}</p>}
      <Button type="button" onClick={handlePreview} disabled={isPreviewing}>
        {isPreviewing ? "プレビュー生成中…" : "プレビュー"}
      </Button>
      <Button type="button" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "保存中…" : "保存"}
      </Button>

      {preview !== null && (
        <div>
          <h3>プレビュー（実際に組み立てられる最終プロンプト）</h3>
          <pre>{preview}</pre>
        </div>
      )}
    </div>
  );
}
