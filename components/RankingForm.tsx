"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { templates, useRankingStore } from "@/lib/store";

const criteriaLabels: Record<string, string> = {
  clarity: "分かりやすさ",
  creativity: "創造性",
  impact: "インパクト",
};

function parseJSON(value: string) {
  try {
    return { data: JSON.parse(value), error: null };
  } catch (error) {
    return { data: null, error: "JSON の形式が正しくありません" } as const;
  }
}

export function RankingForm() {
  const {
    template,
    criteria,
    candidates,
    loading,
    error,
    setTemplate,
    setCriteria,
    updateCriterion,
    addCandidate,
    updateCandidate,
    removeCandidate,
    setLoading,
    setError,
    setResults,
    resetResults,
  } = useRankingStore();

  const [criteriaText, setCriteriaText] = useState(JSON.stringify(criteria, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setCriteriaText(JSON.stringify(criteria, null, 2));
  }, [criteria]);

  const canSubmit = useMemo(() => {
    const hasCandidates = candidates.filter((candidate) => candidate.trim().length > 0).length >= 2;
    return hasCandidates && !loading && !jsonError;
  }, [candidates, loading, jsonError]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    resetResults();

    const payload = {
      criteria,
      candidates: candidates.map((candidate) => candidate.trim()).filter(Boolean),
    };

    try {
      const response = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error ?? data?.message ?? "ランキングのリクエストに失敗しました");
      }

      setResults(data.results ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "予期しないエラーが発生しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const key = event.target.value;
    const templateConfig = templates[key];
    if (!templateConfig) {
      setTemplate("custom", criteria);
      return;
    }
    setTemplate(key, templateConfig.criteria);
  }

  function handleCriteriaBlur() {
    const { data, error: parseError } = parseJSON(criteriaText);
    if (parseError || !data || typeof data !== "object") {
      setJsonError("評価基準は JSON 形式で入力してください");
      return;
    }
    setJsonError(null);
    const normalised = Object.entries(data as Record<string, number>)
      .map(([key, value]) => [key, Number(value)])
      .filter(([, value]) => Number.isFinite(value));
    if (!normalised.length) {
      setJsonError("少なくとも 1 つは数値の重みを設定してください");
      return;
    }
    setCriteria(Object.fromEntries(normalised));
  }

  return (
    <Card className="w-full border-none bg-white/80 shadow-xl ring-1 ring-purple-100/80">
      <form onSubmit={handleSubmit} className="space-y-6">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-bold text-slate-900">評価基準の設定</CardTitle>
          <CardDescription className="text-sm leading-relaxed text-slate-600">
            テンプレートを基に重み付けを調整できます。詳細な調整を行いたい場合は JSON を直接編集してください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template" className="text-sm font-semibold text-slate-800">
                テンプレート
              </Label>
              <select
                id="template"
                value={template}
                onChange={handleTemplateChange}
                className="h-11 w-full rounded-xl border border-purple-100 bg-white/80 px-3 text-sm shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
              >
                {Object.entries(templates).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
                <option value="custom">カスタム</option>
              </select>
              <p className="text-xs text-slate-500">
                {template === "custom" ? "JSON を直接編集して独自の配分を作成できます。" : templates[template]?.description}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800">重みスライダー</Label>
              <div className="space-y-3 rounded-2xl border border-dashed border-purple-200/80 bg-white/70 p-3">
                {Object.entries(criteria).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-600">
                      <span>{criteriaLabels[key] ?? key}</span>
                      <span>{value}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.5}
                      value={value}
                      onChange={(event) => updateCriterion(key, Number(event.target.value))}
                      className="h-2 w-full cursor-pointer rounded-full bg-purple-100 accent-purple-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="criteria" className="text-sm font-semibold text-slate-800">
              評価基準の JSON
            </Label>
            <Textarea
              id="criteria"
              value={criteriaText}
              onChange={(event) => {
                setCriteriaText(event.target.value);
                const { error: parseError } = parseJSON(event.target.value);
                setJsonError(parseError);
              }}
              onBlur={handleCriteriaBlur}
              className="min-h-[160px] rounded-2xl border border-purple-100 bg-white/70 text-sm shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
            />
            <p className="text-xs text-slate-500">
              各項目に数値の重みを設定します。値が大きいほど評価への影響が高まります。
            </p>
            {jsonError && <p className="text-sm font-medium text-red-600">{jsonError}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">候補一覧</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  最低 2 件の候補を入力してください。必要に応じて行を追加できます。
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addCandidate}
                className="rounded-xl border-purple-200 bg-white/70 text-sm font-semibold text-purple-600 hover:bg-purple-50"
              >
                候補を追加
              </Button>
            </div>
            <div className="space-y-3">
              {candidates.map((candidate, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-2xl border border-purple-100 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <Input
                    value={candidate}
                    placeholder={`候補 ${index + 1}`}
                    onChange={(event) => updateCandidate(index, event.target.value)}
                    className="rounded-xl border-purple-100 bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
                  />
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeCandidate(index)}
                      disabled={candidates.length <= 1}
                      className="text-sm font-medium text-slate-500 hover:text-red-500 hover:underline"
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 border-t border-purple-100/60 pt-6 text-left sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-relaxed text-slate-500">
            OpenAI API が重み付けに基づいて候補を採点します。送信前に API キーと必要な環境変数が設定されていることを確認してください。
          </div>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60"
          >
            {loading ? "ランキング中..." : "ランキングを実行"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
