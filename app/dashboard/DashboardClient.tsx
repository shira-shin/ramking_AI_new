"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SliderWithLabel from "@/components/SliderWithLabel";
import { useToast } from "@/components/ui/Toast";

const HAS_OPENAI = !!process.env.NEXT_PUBLIC_HAS_OPENAI;

type Weights = {
  clarity: number;
  creativity: number;
  impact: number;
};

type RankingItem = {
  candidate: string;
  score: number;
  reason?: string;
};

type TemplateKey = "balanced" | "story" | "data" | "custom";

const templates: Record<Exclude<TemplateKey, "custom">, { label: string; description: string; weights: Weights }> = {
  balanced: {
    label: "バランス型",
    description: "明瞭さ・創造性・影響度を均等に重視します。",
    weights: { clarity: 4, creativity: 3, impact: 5 },
  },
  story: {
    label: "ストーリーテリング型",
    description: "創造性と物語性を高めに設定します。",
    weights: { clarity: 3, creativity: 5, impact: 3 },
  },
  data: {
    label: "データ重視型",
    description: "明瞭さと影響度を優先しつつ、創造性を控えめにします。",
    weights: { clarity: 4, creativity: 2, impact: 5 },
  },
};

export default function DashboardClient() {
  const defaultWeights: Weights = { ...templates.balanced.weights };
  const [template, setTemplate] = useState<TemplateKey>("balanced");
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const [criteriaJSON, setCriteriaJSON] = useState<string>(JSON.stringify(defaultWeights, null, 2));
  const [candidates, setCandidates] = useState<string[]>(["", ""]);
  const [results, setResults] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { Toast, notify } = useToast();

  const jsonError = useMemo(() => {
    try {
      const parsed = JSON.parse(criteriaJSON);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return "JSON はオブジェクトで指定してください。";
      }
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
      return "JSON の解析に失敗しました。";
    }
  }, [criteriaJSON]);

  const filledCandidateCount = useMemo(
    () => candidates.filter((candidate) => candidate.trim().length > 0).length,
    [candidates],
  );

  const canRun = HAS_OPENAI && !jsonError && filledCandidateCount >= 2 && !loading;

  function applyTemplate(key: Exclude<TemplateKey, "custom">) {
    const preset = templates[key];
    setTemplate(key);
    const next = { ...preset.weights };
    setWeights(next);
    setCriteriaJSON(JSON.stringify(next, null, 2));
  }

  function handleTemplateChange(event: ChangeEvent<HTMLSelectElement>) {
    const key = event.target.value as TemplateKey;
    if (key === "custom") {
      setTemplate("custom");
      return;
    }
    applyTemplate(key);
  }

  function updateWeight(key: keyof Weights, value: number) {
    setTemplate("custom");
    setWeights((prev) => {
      const next = { ...prev, [key]: value };
      setCriteriaJSON(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function updateCandidate(index: number, value: string) {
    setCandidates((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  }

  function addCandidate() {
    setCandidates((prev) => [...prev, ""]);
  }

  function removeCandidate(index: number) {
    setCandidates((prev) => {
      if (prev.length <= 2) {
        return prev;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  }

  async function runRanking() {
    if (!canRun) return;
    setLoading(true);
    setResults([]);
    try {
      const payload = {
        criteria: JSON.parse(criteriaJSON) as Record<string, number>,
        candidates: candidates.map((candidate) => candidate.trim()).filter(Boolean),
      };

      const response = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { message?: string; error?: string }).message ?? (data as { error?: string }).error ?? `Ranking failed (${response.status})`);
      }

      const data = (await response.json()) as { ok?: boolean; results?: RankingItem[]; message?: string; error?: string };
      if (!data.ok) {
        throw new Error(data.message ?? data.error ?? "ランク生成に失敗しました。");
      }
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ランク生成に失敗しました。";
      notify(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-2">
      {Toast}
      <Card>
        <CardHeader>
          <CardTitle>ランキング基準</CardTitle>
          <CardDescription>テンプレートから始めるか、重みを微調整してください。必要であれば JSON を直接編集できます。</CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="template">
                テンプレート
              </label>
              <select
                id="template"
                value={template}
                onChange={handleTemplateChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {Object.entries(templates).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">カスタム</option>
              </select>
              <p className="text-xs text-gray-500">
                {template === "custom"
                  ? "JSON を直接編集してカスタム重みを設定できます。"
                  : templates[template as Exclude<TemplateKey, "custom">]?.description}
              </p>
            </div>
            <div className="space-y-3">
              <SliderWithLabel
                label="clarity"
                value={weights.clarity}
                onChange={(value) => updateWeight("clarity", value)}
              />
              <SliderWithLabel
                label="creativity"
                value={weights.creativity}
                onChange={(value) => updateWeight("creativity", value)}
              />
              <SliderWithLabel
                label="impact"
                value={weights.impact}
                onChange={(value) => updateWeight("impact", value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="criteria">
              基準（JSON）
            </label>
            <textarea
              id="criteria"
              value={criteriaJSON}
              onChange={(event) => {
                setCriteriaJSON(event.target.value);
                setTemplate("custom");
              }}
              className={`h-28 w-full rounded-lg border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 ${jsonError ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-primary-200"}`}
            />
            {jsonError && <p className="text-sm text-red-600">JSON エラー: {jsonError}</p>}
            {!HAS_OPENAI && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                OPENAI_API_KEY が未設定のため、実行できません（Vercel の環境変数に設定して再デプロイしてください）。
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">候補</label>
            <div className="space-y-2">
              {candidates.map((candidate, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={candidate}
                    onChange={(event) => updateCandidate(index, event.target.value)}
                    placeholder={`候補 ${index + 1}`}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  {candidates.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="px-2 text-sm"
                      onClick={() => removeCandidate(index)}
                    >
                      削除
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="secondary" className="w-full" onClick={addCandidate}>
                候補を追加
              </Button>
              <p className="text-xs text-gray-500">少なくとも 2 件の候補を入力してください。</p>
            </div>
          </div>

          <div className="pt-2">
            <Button type="button" onClick={runRanking} disabled={!canRun} className="min-w-[8rem]">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  生成中…
                </span>
              ) : (
                "ランキングを生成"
              )}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>結果</CardTitle>
          <CardDescription>AI が算出したスコアと説明がここに表示されます。</CardDescription>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="space-y-3">
              <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-500">ランキングを実行すると結果が表示されます。</p>
          ) : (
            <ol className="space-y-3">
              {results.map((item, index) => (
                <li key={item.candidate} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-700">
                      #{index + 1} {item.candidate}
                    </div>
                    <div className="text-xs font-semibold text-primary-600">スコア: {Math.round(item.score)}</div>
                  </div>
                  {item.reason && (
                    <p className="mt-2 text-sm text-gray-600">{item.reason}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
