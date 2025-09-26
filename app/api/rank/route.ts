import { NextResponse } from "next/server";
import { getOpenAIClient, rankCandidates } from "@/lib/openai";

type RequestPayload = {
  criteria?: Record<string, number>;
  candidates?: string[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const hasKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
  return NextResponse.json(
    { ok: true, openai: hasKey ? "configured" : "missing" },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }

  let body: RequestPayload;
  try {
    body = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const criteria = body.criteria ?? {};
  const candidates = Array.isArray(body.candidates) ? body.candidates : [];

  if (!candidates.length) {
    return NextResponse.json(
      { ok: false, error: "At least one candidate is required" },
      { status: 400 }
    );
  }

  try {
    const results = await rankCandidates(criteria, candidates);
    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error while generating ranking";
    const status = message.includes("OpenAI request failed") ? 502 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
