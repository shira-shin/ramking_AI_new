import type { Metadata } from "next";
import { ReactNode } from "react";

import "./globals.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Ranking AI",
  description: "Rank candidates intelligently using AI powered scoring.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
