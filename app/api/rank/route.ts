import { NextResponse } from "next/server";

import { getOpenAI, rankCandidates } from "@/lib/openai";

type RequestPayload = {
  criteria?: Record<string, number>;
  candidates?: string[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  return NextResponse.json({ ok: true, openai: hasKey ? "configured" : "missing" });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestPayload;
    const criteria = body.criteria ?? {};
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];

    if (!candidates.length) {
      return NextResponse.json({ ok: false, error: "At least one candidate is required" }, { status: 400 });
    }

    if (!getOpenAI()) {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY is not set" }, { status: 503 });
    }

    const results = await rankCandidates(criteria, candidates);

    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error while generating ranking";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
