import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ランキングAIワークスペース',
  description: '評価基準を定義し、AIで候補をランキングするチーム向けツール',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
