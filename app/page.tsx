"use client";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import AuthButton from "@/components/AuthButton";

type Result = { item: string; score: number; reason?: string };

const PRESETS = [
  { name: "文章評価", criteria: { clarity: 2, creativity: 1, accuracy: 2 }, candidates: ["案A", "案B", "案C"] },
  {
    name: "商品比較",
    criteria: { price: 2, quality: 3, popularity: 1 },
    candidates: ["A社", "B社", "C社", "D社"],
  },
  { name: "採用選考", criteria: { skill: 3, culture: 2, potential: 2 }, candidates: ["山田", "佐藤", "田中"] },
];

export default function Home() {
  const { data: session } = useSession();
  const [criteriaText, setCriteriaText] = useState(
    JSON.stringify(PRESETS[0].criteria, null, 2),
  );
  const [candidateInput, setCandidateInput] = useState("");
  const [cands, setCands] = useState<string[]>(PRESETS[0].candidates);
  const [results, setResults] = useState<Result[]>([]);
  const [sortBy, setSortBy] = useState<"rank" | "score" | "name">("rank");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const criteriaObj = useMemo(() => {
    try {
      return JSON.parse(criteriaText || "{}");
    } catch {
      return null;
    }
  }, [criteriaText]);

  function addFromInput(force?: boolean) {
    const parts = candidateInput.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length && !force) return;
    setCands(Array.from(new Set([...cands, ...parts])));
    setCandidateInput("");
  }
  function removeCand(x: string) {
    setCands(cands.filter((c) => c !== x));
  }
  function applyPreset(p: (typeof PRESETS)[number]) {
    setCriteriaText(JSON.stringify(p.criteria, null, 2));
    setCands(p.candidates);
    setResults([]);
    setErr(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setResults([]);
    if (!session) {
      setErr("ログインが必要です（右上の Sign in）。");
      return;
    }
    if (!criteriaObj) {
      setErr("Criteria JSON が不正です。");
      return;
    }
    if (!cands.length) {
      setErr("候補を1件以上追加してください。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria: criteriaObj, candidates: cands }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      setResults(data.results as Result[]);
    } catch (e: any) {
      setErr(e?.message || "リクエストに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(() => {
    const arr = [...results];
    if (sortBy === "score") arr.sort((a, b) => b.score - a.score);
    if (sortBy === "name") arr.sort((a, b) => a.item.localeCompare(b.item));
    return arr;
  }, [results, sortBy]);

  const total = results.reduce((a, r) => a + r.score, 0);

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Ranking AI</h1>
          <p className="text-gray-600">Google ログイン後に、OpenAI を使って候補を格付けします。</p>
        </div>
        <AuthButton />
      </div>

      <section className="card">
        <div className="card-body space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="pill hover:bg-gray-200"
              >
                {p.name}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-500">
              候補追加: <span className="kbd">Enter</span> / <span className="kbd">,</span>
            </span>
          </div>

          <form className="grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={onSubmit}>
            <div>
              <label className="label">Criteria (JSON)</label>
              <textarea
                value={criteriaText}
                onChange={(e) => setCriteriaText(e.target.value)}
                className="textarea font-mono"
                placeholder='{"clarity":1,"creativity":1}'
              />
              {!criteriaObj && <div className="mt-2 notice-err">JSON を復元できませんでした。</div>}
            </div>

            <div className="space-y-2">
              <label className="label">Candidates</label>
              <input
                className="input"
                placeholder="候補を入力して Enter または ,"
                value={candidateInput}
                onChange={(e) => setCandidateInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addFromInput(true);
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                {cands.map((c) => (
                  <span className="pill" key={c}>
                    {c}
                    <button
                      type="button"
                      className="pill-x"
                      onClick={() => removeCand(c)}
                      aria-label={`${c}を削除`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <button
                className="btn-primary"
                type="submit"
                disabled={loading || !criteriaObj || !cands.length}
              >
                {loading ? "Ranking..." : "Rank now"}
              </button>
              {err && <div className="notice-err">{err}</div>}
            </div>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Results</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort:</span>
              <select
                className="input h-9"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "rank" | "score" | "name")}
              >
                <option value="rank">Rank</option>
                <option value="score">Score</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">まだ結果はありません。上で実行してください。</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="th">#</th>
                      <th className="th">Candidate</th>
                      <th className="th">Score</th>
                      <th className="th">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r, i) => (
                      <tr key={r.item}>
                        <td className="td">{i + 1}</td>
                        <td className="td font-medium">{r.item}</td>
                        <td className="td">{r.score}</td>
                        <td className="td text-gray-600">{r.reason ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-sm text-gray-600">
                {results.length} items ・ Total score: {total}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
