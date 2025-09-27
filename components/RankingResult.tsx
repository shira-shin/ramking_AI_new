"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useRankingStore } from "@/lib/store";

export function RankingResult() {
  const { results, loading } = useRankingStore();

  return (
    <Card className="w-full border-none bg-white/80 shadow-xl ring-1 ring-purple-100/80">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-bold text-slate-900">ランキング結果</CardTitle>
        <CardDescription className="text-sm leading-relaxed text-slate-600">
          OpenAI が算出したスコアと理由コメントの一覧です。議論の参考情報として共有できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-purple-200/80 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
            「ランキングを実行」を押すと、AI による順位とコメントがここに表示されます。
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-purple-100/80 shadow-sm">
            <Table>
              <THead>
                <TR>
                  <TH className="w-12 text-purple-600">順位</TH>
                  <TH className="text-slate-700">候補</TH>
                  <TH className="w-24 text-center text-slate-700">スコア</TH>
                  <TH className="text-slate-700">理由</TH>
                </TR>
              </THead>
              <TBody>
                {results.map((item, index) => (
                  <TR key={item.candidate}>
                    <TD className="text-base font-semibold text-purple-600">{index + 1}</TD>
                    <TD className="font-medium text-slate-900">{item.candidate}</TD>
                    <TD className="text-center text-sm font-semibold text-slate-700">{Math.round(item.score)}</TD>
                    <TD className="text-sm leading-relaxed text-slate-600">{item.reason || "理由は生成されませんでした"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
