import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
import AppBootstrap from "./app-bootstrap";
import { AppBootstrapFallback } from "./app-bootstrap-fallback";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "DSD revision hub",
  description:
    "Shared revision for Digital Software Development: diagnostics, topics, quizzes, and resources.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#10131a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: set theme class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("wf-revision-theme");if(t==="light"){document.documentElement.classList.remove("dark")}else if(!t&&window.matchMedia("(prefers-color-scheme:light)").matches){document.documentElement.classList.remove("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased relative bg-background text-foreground`}>
        {/* Ambient violet light — fixed, non-interactive */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
          <div
            className="absolute -top-[40%] -right-[20%] w-[68%] aspect-square rounded-full opacity-[0.09] blur-[150px]"
            style={{ background: "radial-gradient(circle, rgba(103, 92, 241, 0.22) 0%, transparent 72%)" }}
          />
          <div
            className="absolute -bottom-[30%] -left-[15%] w-[52%] aspect-square rounded-full opacity-[0.07] blur-[130px]"
            style={{ background: "radial-gradient(circle, rgba(245, 158, 11, 0.14) 0%, transparent 72%)" }}
          />
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/35 to-transparent dark:from-white/4" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col">
          <ThemeProvider>
            <Suspense fallback={<AppBootstrapFallback />}>
              <AppBootstrap>{children}</AppBootstrap>
            </Suspense>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
