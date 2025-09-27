import "./globals.css";
import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";

export const metadata: Metadata = {
  title: "ランキングAIワークスペース",
  description: "評価基準を定義し、AIで候補をランキングするチーム向けツール",
};

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} min-h-screen bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
