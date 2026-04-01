import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ProgressProvider } from "@/components/providers/progress-provider";
import { SessionGate } from "@/components/session-gate";

import "./globals.css";

export const metadata: Metadata = {
  title: "Revision OS",
  description: "T Level Digital Software Development revision platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProgressProvider>
            <AppShell>
              <SessionGate>{children}</SessionGate>
            </AppShell>
          </ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
