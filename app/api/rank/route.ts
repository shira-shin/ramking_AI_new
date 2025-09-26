export const runtime = "nodejs";

type Criteria = Record<string, number>;
type Result = { item: string; score: number; reason?: string };

function parseCandidates(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,，\n]/);
  const cleaned = arr.map((s) => s.trim()).filter(Boolean);
  return Array.from(new Set(cleaned)).slice(0, 200);
}
function parseCriteria(raw: unknown): Criteria {
  if (!raw) return {};
  try {
    return typeof raw === "string" ? JSON.parse(raw) : (raw as Criteria);
  } catch {
    return {};
  }
}
function heuristicScore(item: string, criteria: Criteria): number {
  const weight = Object.values(criteria).reduce((acc, value) => acc + Number(value || 0), 0) || 1;
  const base = [...item].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 101;
  return Math.round(base * weight);
}

function mergeResults(results: Result[], candidates: string[], criteria: Criteria): Result[] {
  const missing = candidates.filter((candidate) => !results.find((r) => r.item === candidate));
  const filled = [
    ...results,
    ...missing.map((item) => ({ item, score: heuristicScore(item, criteria), reason: "fallback" })),
  ];
  return filled;
}

async function rankWithOpenAI(criteria: Criteria, candidates: string[]): Promise<Result[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("NO_OPENAI_KEY");

  const sys = `You are a ranking engine. Return JSON only:
{"results":[{"item":"<candidate>","score":<0..100>,"reason":"<short>"}...]}
- Use weights in "criteria" to score candidates 0..100.
- Higher is better. One-line reason per item.`;

  const user = JSON.stringify({ criteria, candidates });

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
  });
  if (!resp.ok) throw new Error(`OPENAI_${resp.status}`);
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const json = (() => {
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw 0;
      return JSON.parse(match[0]);
    }
  })();
  const listed = (json.results ?? []).map((r: any) => ({
    item: String(r.item),
    score: Math.max(0, Math.min(100, Number(r.score) || 0)),
    reason: r.reason ? String(r.reason) : undefined,
  }));
  return mergeResults(listed, candidates, criteria).sort((a, b) => b.score - a.score);
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    let criteria: Criteria = {}, candidates: string[] = [];
    if (ct.includes("application/json")) {
      const body = await req.json();
      criteria = parseCriteria(body.criteria);
      candidates = parseCandidates(body.candidates);
    } else {
      const fd = await req.formData();
      criteria = parseCriteria(fd.get("criteria")?.toString());
      candidates = parseCandidates(fd.get("candidates")?.toString());
    }
    if (!candidates.length) {
      return Response.json({ ok: false, message: "Candidates required" }, { status: 400 });
    }

    let results: Result[];
    try {
      results = await rankWithOpenAI(criteria, candidates);
    } catch {
      results = candidates
        .map((item) => ({ item, score: heuristicScore(item, criteria), reason: "heuristic" }))
        .sort((a, b) => b.score - a.score);
    }

    return Response.json({ ok: true, criteria, results }, { status: 200 });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, ts: Date.now() });
}
