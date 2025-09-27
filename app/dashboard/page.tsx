import { redirect } from "next/navigation";
import { RankingForm } from "@/components/RankingForm";
import { RankingResult } from "@/components/RankingResult";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3 rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-purple-100/80">
        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-purple-600">
          <span className="h-1 w-8 rounded-full bg-purple-500" aria-hidden />
          評価ワークスペース
        </p>
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">ランキングダッシュボード</h1>
        <p className="text-sm leading-relaxed text-slate-600 md:text-base">
          評価基準を整えて候補者を登録すると、OpenAI が重み付けに基づいてスコアリングと順位付けを行います。
          結果は理由コメント付きで表示され、合議の材料として活用できます。
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <RankingForm />
        <RankingResult />
      </div>
    </main>
  );
}
