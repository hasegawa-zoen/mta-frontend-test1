"use client";

import { Button } from "@hasegawa-zoen/ui-kit";
import {
  createTenantUser,
  deleteTenantUser,
  listTenantUsers,
  type TenantUser,
} from "@hasegawa-zoen/api-client";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { config } from "../../lib/config";

export function UsersTab() {
  const { idToken } = useAuth();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function reload() {
    if (!idToken) return;
    setIsLoading(true);
    try {
      setUsers(await listTenantUsers(config.apiBaseUrl, idToken));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "ユーザー一覧の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idToken]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!idToken || !email.trim()) return;
    setIsCreating(true);
    setErrorMessage(null);
    try {
      await createTenantUser(config.apiBaseUrl, idToken, { email, role });
      setEmail("");
      await reload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "ユーザーの追加に失敗しました");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(user: TenantUser) {
    if (!idToken) return;
    try {
      await deleteTenantUser(config.apiBaseUrl, idToken, user.username);
      await reload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "ユーザーの削除に失敗しました");
    }
  }

  return (
    <div>
      <h2>サイトユーザ管理</h2>
      <form onSubmit={handleCreate}>
        <div>
          <label htmlFor="new-user-email">メールアドレス</label>
          <br />
          <input
            id="new-user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="new-user-role">ロール</label>
          <br />
          <select
            id="new-user-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <Button type="submit" disabled={isCreating || !email.trim()}>
          {isCreating ? "追加中…" : "追加"}
        </Button>
      </form>

      {errorMessage && <p role="alert">{errorMessage}</p>}

      {isLoading ? (
        <p>読み込み中…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>メールアドレス</th>
              <th>ロール</th>
              <th>ステータス</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td>{user.email ?? user.username}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>
                  <Button type="button" onClick={() => handleDelete(user)}>
                    削除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
