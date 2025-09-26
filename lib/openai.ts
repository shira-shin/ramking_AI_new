import OpenAI from "openai";

type Criteria = Record<string, number>;

type RankingItem = {
  candidate: string;
  score: number;
  reason: string;
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function rankCandidates(criteria: Criteria, candidates: string[]): Promise<RankingItem[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const prompt = [
    `Criteria: ${JSON.stringify(criteria, null, 2)}`,
    `Candidates: ${candidates.join(", ")}`,
  ].join("\n\n");

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an AI ranking assistant. Rank the given candidates based on the provided criteria. Return JSON with a 'rankings' array where each item includes: candidate (string), score (number from 0 to 100), and reason (string).",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI did not return any content.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error("Failed to parse OpenAI response as JSON.");
  }

  if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as any).rankings)) {
    throw new Error("OpenAI response missing 'rankings' array.");
  }

  return (parsed as any).rankings
    .map((item: any) => ({
      candidate: String(item.candidate),
      score: Number(item.score),
      reason: item.reason ? String(item.reason) : "",
    }))
    .filter((item: RankingItem) => item.candidate.trim().length > 0)
    .sort((a: RankingItem, b: RankingItem) => b.score - a.score);
}
