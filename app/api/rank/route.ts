import { getOpenAI, rankCandidatesWithClient } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RankRequest = { criteria?: Record<string, number>; candidates?: string[] };

type JsonBody = Record<string, unknown>;

type CriteriaInput = Record<string, unknown>;

type NormalisedCriteria = Record<string, number>;

function json(body: JsonBody, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function normaliseCriteria(value: CriteriaInput): NormalisedCriteria | null {
  const entries = Object.entries(value)
    .map(([key, raw]) => [key, Number(raw)] as const)
    .filter(([, weight]) => Number.isFinite(weight));

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries);
}

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY?.trim();
  return json({ ok: true, openai: hasKey ? "configured" : "missing" });
}

export async function POST(req: Request) {
  let payload: RankRequest;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const criteria = payload.criteria;
  const candidates = payload.candidates;

  if (!criteria || typeof criteria !== "object" || Array.isArray(criteria)) {
    return json({ ok: false, error: "criteria must be an object of weights" }, { status: 400 });
  }

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return json({ ok: false, error: "At least one candidate is required" }, { status: 400 });
  }

  const normalisedCriteria = normaliseCriteria(criteria as CriteriaInput);
  if (!normalisedCriteria) {
    return json({ ok: false, error: "criteria must contain at least one numeric weight" }, { status: 400 });
  }

  const client = getOpenAI();
  if (!client) {
    return json({ ok: false, error: "OPENAI_API_KEY is not set" }, { status: 503 });
  }

  try {
    const results = await rankCandidatesWithClient(client, normalisedCriteria, candidates);
    return json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI request failed";
    return json(
      { ok: false, error: "OpenAI request failed", detail: message },
      { status: 502 },
    );
  }
}
