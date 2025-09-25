export default function Home() {
  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Ranking AI</h1>
      <p className="text-gray-600">
        JSON の評価基準と候補リストからランキングを生成します。
      </p>

      <form action="/api/evaluate-with-search" method="post" className="space-y-3">
        <label className="block">
          <span className="font-medium">Criteria (JSON)</span>
          <textarea name="criteria" required rows={6} className="w-full border p-2 rounded" />
        </label>
        <label className="block">
          <span className="font-medium">Candidates (comma-separated)</span>
          <input name="candidates" required className="w-full border p-2 rounded" />
        </label>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">
          Rank now
        </button>
      </form>
    </main>
  );
}
