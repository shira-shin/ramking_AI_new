import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { auth } from "@/lib/auth";

const requestSchema = z.object({
  criteria: z.record(z.any(), { required_error: "Criteria are required" }),
  candidates: z.array(z.string().min(1, "Candidate name is required"), {
    required_error: "At least one candidate is required",
  }),
});

const openaiClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { criteria, candidates } = parsed.data;

  let responseText: string | null = null;
  try {
    const openai = openaiClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an AI ranking assistant. Rank the given candidates based on the provided criteria. Return JSON with fields: candidate, score, reason. Wrap the array within an object under the key results.",
        },
        {
          role: "user",
          content: [
            "Criteria:",
            JSON.stringify(criteria, null, 2),
            "Candidates:",
            JSON.stringify(candidates, null, 2),
          ].join("\n"),
        },
      ],
    });

    responseText = completion.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    console.error("OpenAI API error", error);
    return NextResponse.json({ error: "Failed to generate ranking" }, { status: 500 });
  }

  if (!responseText) {
    return NextResponse.json({ error: "No response from OpenAI" }, { status: 502 });
  }

  try {
    const parsedResponse = JSON.parse(responseText) as {
      results?: Array<{ candidate: string; score: number; reason?: string }>;
    };
    const results = parsedResponse.results?.map((item) => {
      const numericScore = Number(item.score);
      return {
        candidate: item.candidate,
        score: Number.isFinite(numericScore) ? numericScore : 0,
        reason: item.reason ?? "",
      };
    });

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "Malformed response from model", raw: parsedResponse },
        { status: 502 },
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Failed to parse OpenAI response", error, responseText);
    return NextResponse.json({ error: "Invalid response format" }, { status: 502 });
  }
}
