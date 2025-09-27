import Link from 'next/link';

import { SignOutButton } from '@/components/SignOutButton';

const hasGoogleAuth = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="section">
        <div className="container-narrow">
          <div className="text-center space-y-6">
            <p className="text-sm font-medium text-indigo-600">ランキングAIワークスペース</p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              AIアシストスコアで <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">候補者を比較</span>
            </h1>
            <p className="text-gray-600 text-base md:text-lg">
              評価基準を定義して、AIが各候補を採点。説明可能な理由とともにチームで共有できます。
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-white font-medium shadow transition hover:bg-indigo-700"
              >
                ダッシュボードへ移動
              </Link>
              {hasGoogleAuth ? <SignOutButton /> : null}
            </div>
          </div>
        </div>
      </section>

      {/* 3つの特徴 */}
      <section className="section">
        <div className="container-narrow grid gap-6 md:grid-cols-3">
          <div className="card">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="text-lg font-semibold mb-2">ガイド付き基準</h3>
            <p className="text-gray-600">
              バランス型・ストーリーテリング型・データ重視型のテンプレートから開始し、重みを調整して自分たちの評価軸に。
            </p>
          </div>
          <div className="card">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="text-lg font-semibold mb-2">共同入力</h3>
            <p className="text-gray-600">
              共有状態で候補のメモや補足を同期。Zustand ストアで UI と計算を分離しスムーズに更新。
            </p>
          </div>
          <div className="card">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="text-lg font-semibold mb-2">説明可能なランキング</h3>
            <p className="text-gray-600">
              各スコアには理由文が付くため、利害関係者にトレードオフを説明しやすく、合意形成が速い。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
