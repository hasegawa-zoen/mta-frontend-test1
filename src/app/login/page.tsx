"use client";

import { Button } from "@hasegawa-zoen/ui-kit";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

/** IME full-width input (よくある日本語IME残留) makes "153304" become
 * "１５３３０４", which Cognito rejects as a wrong TOTP code even though it
 * looks identical to the user. Normalize to half-width digits and strip
 * anything else (spaces some authenticator apps insert, stray whitespace). */
function normalizeTotpCode(raw: string): string {
  const halfWidth = raw.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30),
  );
  return halfWidth.replace(/\D/g, "");
}

export default function LoginPage() {
  const {
    isAuthenticated,
    isLoading,
    mfaPending,
    newPasswordRequired,
    mfaSetupRequired,
    errorMessage,
    login,
    submitMfaCode,
    submitNewPassword,
  } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [newPasswordMismatch, setNewPasswordMismatch] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  if (mfaSetupRequired) {
    return <p role="alert">{errorMessage}</p>;
  }

  // Every admin_create_user-provisioned account starts in
  // FORCE_CHANGE_PASSWORD, so this is every real tenant admin's actual
  // first login, not an edge case.
  if (newPasswordRequired) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newPassword !== newPasswordConfirm) {
            setNewPasswordMismatch(true);
            return;
          }
          setNewPasswordMismatch(false);
          submitNewPassword(newPassword);
        }}
      >
        <h1>新しいパスワードを設定</h1>
        <div>
          <label htmlFor="new-password">新しいパスワード</label>
          <br />
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="new-password-confirm">新しいパスワード（確認）</label>
          <br />
          <input
            id="new-password-confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
          />
        </div>
        {newPasswordMismatch && <p role="alert">パスワードが一致しません。</p>}
        {errorMessage && <p role="alert">{errorMessage}</p>}
        <Button type="submit" disabled={isLoading || newPassword.length === 0}>
          {isLoading ? "設定中…" : "設定"}
        </Button>
      </form>
    );
  }

  if (mfaPending) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitMfaCode(totpCode);
        }}
      >
        <h1>認証アプリのコードを入力</h1>
        <input
          type="text"
          inputMode="numeric"
          // NOT "one-time-code" -- that autocomplete value tells mobile
          // browsers (notably iOS Safari) to autofill from an incoming SMS,
          // which can silently overwrite what the user typed with an
          // unrelated code if any SMS with a 6-digit number arrives while
          // this field is focused. This field is for an authenticator app
          // TOTP code, not an SMS OTP, so disable autofill entirely.
          autoComplete="off"
          value={totpCode}
          onChange={(e) => setTotpCode(normalizeTotpCode(e.target.value))}
          required
        />
        {errorMessage && <p role="alert">{errorMessage}</p>}
        <Button type="submit" disabled={isLoading || totpCode.length === 0}>
          {isLoading ? "確認中…" : "確認"}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        login(email, password);
      }}
    >
      <h1>ログイン</h1>
      <div>
        <label htmlFor="email">メールアドレス</label>
        <br />
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">パスワード</label>
        <br />
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "ログイン中…" : "ログイン"}
      </Button>
    </form>
  );
}
