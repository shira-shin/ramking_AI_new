import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/session-provider";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ranking AI",
  description: "Rank candidates with structured criteria using OpenAI.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} min-h-full bg-gray-50 text-gray-900`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
