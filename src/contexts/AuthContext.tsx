"use client";

import { getTenantContext, type LoginResult, type TenantContext as MtaTenantContext } from "@hasegawa-zoen/api-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { cognitoAuth } from "../lib/apiClient";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  idToken: string | null;
  tenantContext: MtaTenantContext | null;
  /** Set while a login attempt is waiting on a TOTP code. */
  mfaPending: boolean;
  /** Set while a login attempt is waiting on a new password (every
   * admin_create_user-provisioned account starts in FORCE_CHANGE_PASSWORD,
   * so this fires on every real tenant admin's actual first login). */
  newPasswordRequired: boolean;
  /** Set when the user hit an unenrolled-MFA account (out of scope for this slice). */
  mfaSetupRequired: boolean;
  errorMessage: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  submitMfaCode: (code: string) => Promise<void>;
  submitNewPassword: (newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** submitCode and submitNewPassword share the same (string) => Promise<LoginResult>
 * shape, so one pending-challenge slot covers both -- only one challenge is
 * ever in flight at a time. */
type PendingSubmit = ((value: string) => Promise<LoginResult>) | null;

function applyLoginResult(
  result: LoginResult,
  setState: Dispatch<SetStateAction<AuthState>>,
  setPendingSubmit: Dispatch<SetStateAction<PendingSubmit>>,
) {
  if (result.status === "success") {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      isAuthenticated: true,
      idToken: result.idToken,
      tenantContext: getTenantContext(result.idToken),
      mfaPending: false,
      newPasswordRequired: false,
      mfaSetupRequired: false,
      errorMessage: null,
    }));
    setPendingSubmit(null);
  } else if (result.status === "mfa_code_required") {
    setPendingSubmit(() => result.submitCode);
    setState((prev) => ({
      ...prev,
      isLoading: false,
      mfaPending: true,
      newPasswordRequired: false,
      errorMessage: null,
    }));
  } else if (result.status === "new_password_required") {
    setPendingSubmit(() => result.submitNewPassword);
    setState((prev) => ({
      ...prev,
      isLoading: false,
      newPasswordRequired: true,
      mfaPending: false,
      errorMessage: null,
    }));
  } else if (result.status === "mfa_setup_required") {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      mfaSetupRequired: true,
      errorMessage: "このアカウントはMFA未設定です。管理者に連絡してください。",
    }));
  } else {
    setState((prev) => ({ ...prev, isLoading: false, errorMessage: result.message }));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    idToken: null,
    tenantContext: null,
    mfaPending: false,
    newPasswordRequired: false,
    mfaSetupRequired: false,
    errorMessage: null,
  });
  const [pendingSubmit, setPendingSubmit] = useState<PendingSubmit>(null);

  useEffect(() => {
    cognitoAuth.restoreSession().then((result) => {
      if (result.status === "success") {
        applyLoginResult(result, setState, setPendingSubmit);
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
    const result = await cognitoAuth.login(email, password);
    applyLoginResult(result, setState, setPendingSubmit);
  }, []);

  const submitMfaCode = useCallback(
    async (code: string) => {
      if (!pendingSubmit) return;
      setState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
      const result = await pendingSubmit(code);
      applyLoginResult(result, setState, setPendingSubmit);
    },
    [pendingSubmit],
  );

  const submitNewPassword = useCallback(
    async (newPassword: string) => {
      if (!pendingSubmit) return;
      setState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
      const result = await pendingSubmit(newPassword);
      applyLoginResult(result, setState, setPendingSubmit);
    },
    [pendingSubmit],
  );

  const logout = useCallback(() => {
    cognitoAuth.logout();
    setState({
      isLoading: false,
      isAuthenticated: false,
      idToken: null,
      tenantContext: null,
      mfaPending: false,
      newPasswordRequired: false,
      mfaSetupRequired: false,
      errorMessage: null,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, submitMfaCode, submitNewPassword, logout }),
    [state, login, submitMfaCode, submitNewPassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
