"use client";
import { useState } from "react";

type Result = { item: string; score: number; reason?: string };

export default function Home() {
  const [criteria, setCriteria] = useState('{\n  "clarity": 1,\n  "creativity": 1\n}');
  const [candidates, setCandidates] = useState('A,B,C');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      // API に JSON で投げる（フォームPOSTより確実）
      const res = await fetch("/api/evaluate-with-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: JSON.parse(criteria || "{}"),
          candidates: candidates.split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      setResults(data.results as Result[]);
    } catch (err: any) {
      setError(err?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Ranking AI</h1>
      <p className="text-gray-600">JSON の評価基準と候補リストからランキングを生成します。</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="font-medium">Criteria (JSON)</span>
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            rows={8}
            className="w-full border p-2 rounded"
          />
        </label>
        <label className="block">
          <span className="font-medium">Candidates (comma-separated)</span>
          <input
            value={candidates}
            onChange={(e) => setCandidates(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Ranking..." : "Rank now"}
        </button>
      </form>

      {error && (
        <div className="text-red-600">Error: {error}</div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold mt-6">Results</h2>
          <ol className="list-decimal pl-6">
            {results.map((r, i) => (
              <li key={r.item} className="leading-7">
                <span className="font-semibold">{i + 1}. {r.item}</span>
                <span className="ml-2 text-sm text-gray-500">score: {r.score}</span>
                {r.reason ? <span className="ml-2 text-sm text-gray-400">({r.reason})</span> : null}
              </li>
            ))}
          </ol>
        </div>
      )}
    </main>
  );
}
