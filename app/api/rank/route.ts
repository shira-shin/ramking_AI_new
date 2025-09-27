import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RankRequest = { criteria: Record<string, number>; candidates: string[] };

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY?.trim();
  return new Response(JSON.stringify({ ok: true, openai: hasKey ? "configured" : "missing" }), {
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  const client = getOpenAI();
  if (!client) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not set" }), {
      status: 503, headers: { "content-type": "application/json" }
    });
  }

  let body: RankRequest;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { criteria, candidates } = body ?? {};
  if (!criteria || !Array.isArray(candidates) || candidates.length === 0) {
    return new Response(JSON.stringify({ error: "criteria and candidates are required" }), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }

  const sys =
    "You are a ranking assistant. Given criteria (weights) and candidates, " +
    "return a JSON object {\"results\":[{candidate,score,reason}...]} sorted by score desc. " +
    "Score 0-100.";

  const user = `criteria: ${JSON.stringify(criteria)}
candidates: ${JSON.stringify(candidates)}`;

  try {
    const res = await client.responses.create({
      model: "gpt-4o-mini",
      input: [{ role: "system", content: sys }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    });
    const text = res.output_text ?? "{}";
    return new Response(text, { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "OpenAI request failed", detail: e?.message ?? String(e) }), {
      status: 502, headers: { "content-type": "application/json" }
    });
  }
}
