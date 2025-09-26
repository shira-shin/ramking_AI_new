import { NextResponse } from "next/server";
import { rankCandidates } from "@/lib/openai";

type RequestPayload = {
  criteria?: Record<string, number>;
  candidates?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestPayload;
    const criteria = body.criteria ?? {};
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];

    if (!candidates.length) {
      return NextResponse.json({ ok: false, error: "At least one candidate is required" }, { status: 400 });
    }

    const results = await rankCandidates(criteria, candidates);

    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error while generating ranking";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
