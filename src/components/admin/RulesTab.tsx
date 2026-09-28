"use client";

import { Button } from "@hasegawa-zoen/ui-kit";
import {
  deleteRule,
  getRuleContent,
  listRules,
  uploadRule,
  type RuleDocument,
} from "@hasegawa-zoen/api-client";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { config } from "../../lib/config";

export function RulesTab() {
  const { idToken } = useAuth();
  const [rules, setRules] = useState<RuleDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openContent, setOpenContent] = useState<{ filename: string; content: string } | null>(null);

  async function reload() {
    if (!idToken) return;
    setIsLoading(true);
    try {
      setRules(await listRules(config.apiBaseUrl, idToken));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "ルール一覧の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idToken]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!idToken) return;
    const input = e.currentTarget.elements.namedItem("rule-file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
    try {
      await uploadRule(config.apiBaseUrl, idToken, file);
      input.value = "";
      await reload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleViewContent(rule: RuleDocument) {
    if (!idToken) return;
    try {
      const result = await getRuleContent(config.apiBaseUrl, idToken, rule.id);
      setOpenContent(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "内容の取得に失敗しました");
    }
  }

  async function handleDelete(rule: RuleDocument) {
    if (!idToken) return;
    try {
      await deleteRule(config.apiBaseUrl, idToken, rule.id);
      if (openContent?.filename === rule.filename) setOpenContent(null);
      await reload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  return (
    <div>
      <h2>ルール・単価表</h2>
      <form onSubmit={handleUpload}>
        <label htmlFor="rule-file">ファイルを選択（.md / .txt）</label>
        <br />
        <input id="rule-file" name="rule-file" type="file" accept=".md,.txt" required />
        <Button type="submit" disabled={isUploading}>
          {isUploading ? "アップロード中…" : "アップロード"}
        </Button>
      </form>

      {errorMessage && <p role="alert">{errorMessage}</p>}

      {isLoading ? (
        <p>読み込み中…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ファイル名</th>
              <th>サイズ</th>
              <th>アップロード者</th>
              <th>アップロード日時</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>
                  <button type="button" onClick={() => handleViewContent(rule)}>
                    {rule.filename}
                  </button>
                </td>
                <td>{rule.size_bytes}</td>
                <td>{rule.uploaded_by ?? "-"}</td>
                <td>{rule.uploaded_at}</td>
                <td>
                  <Button type="button" onClick={() => handleDelete(rule)}>
                    削除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openContent && (
        <div>
          <h3>{openContent.filename}</h3>
          <pre>{openContent.content}</pre>
        </div>
      )}
    </div>
  );
}
