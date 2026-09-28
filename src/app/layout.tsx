import "@hasegawa-zoen/ui-kit/tokens.css";
import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import { AppSidebar } from "../components/AppSidebar";
import { AuthProvider } from "../contexts/AuthContext";
import { tenantConfig } from "../lib/tenantConfig";

export const metadata = {
  title: tenantConfig.tenantName || "mta-frontend",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Sidebar renders on every route including /login for this minimal slice
  // -- splitting into an authenticated-only layout is real M3/M5 polish,
  // not needed to prove the end-to-end flow works.
  return (
    <html lang="ja" style={{ "--mta-color-accent": tenantConfig.accentColor } as CSSProperties}>
      <body>
        <AuthProvider>
          <div className="mta-app-shell">
            <AppSidebar tenantName={tenantConfig.tenantName} />
            <main className="mta-main">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
