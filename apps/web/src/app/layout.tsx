import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LendSignal 360 — MSME Credit Intelligence",
  description: "AI-powered credit decision-support cockpit for bank-grade MSME assessment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-workspace text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
