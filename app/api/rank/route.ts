import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// DO NOT new at module scope
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

type RankRequest = { criteria: Record<string, number>; candidates: string[] };

type RankResult = { candidate: string; score: number; reason: string };

type OpenAIResponse = { results?: RankResult[] };

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY?.trim();
  return new Response(JSON.stringify({ ok: true, openai: hasKey ? "configured" : "missing" }), {
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  const client = getOpenAI();
  if (!client) {
    return new Response(JSON.stringify({ ok: false, error: "OPENAI_API_KEY is not set" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  let body: RankRequest;
  try {
    body = (await req.json()) as RankRequest;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const { criteria, candidates } = body ?? {};
  if (!criteria || !Array.isArray(candidates) || candidates.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: "criteria and candidates are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const sys =
    "You are a ranking assistant. Given criteria (weights) and candidates, " +
    "return a JSON object {\"results\":[{candidate,score,reason}...]} sorted by score desc. " +
    "Score range 0-100.";

  const user = `criteria: ${JSON.stringify(criteria)}
candidates: ${JSON.stringify(candidates)}`;

  try {
    const res = await client.responses.create({
      model: "gpt-4o-mini",
      input: [{ role: "system", content: sys }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    });
    const text = res.output_text ?? "{}";

    let parsed: OpenAIResponse;
    try {
      parsed = JSON.parse(text) as OpenAIResponse;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "OpenAI returned invalid JSON" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    const results = Array.isArray(parsed.results) ? parsed.results : [];

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: "OpenAI request failed", detail: e?.message ?? String(e) }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
