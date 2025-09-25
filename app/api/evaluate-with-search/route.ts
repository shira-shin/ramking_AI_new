import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const criteria = form.get("criteria")?.toString() ?? "{}";
  const candidates = (form.get("candidates")?.toString() ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // TODO: ここで実際の評価ロジック/モデル呼び出しを行う
  const scores = candidates.map((c, i) => ({ item: c, score: candidates.length - i }));

  return Response.json({ ok: true, criteria: JSON.parse(criteria), result: scores }, { status: 200 });
}

export async function GET() {
  return Response.json({ ok: true, ts: Date.now() });
}
