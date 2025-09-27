import OpenAI from "openai";

type Criteria = Record<string, number>;

type RankingItem = {
  candidate: string;
  score: number;
  reason: string;
};

export class MissingOpenAIKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured.");
    this.name = "MissingOpenAIKeyError";
  }
}

/** Never instantiate at module scope. */
export function getOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const SYSTEM_PROMPT =
  "You are a ranking assistant. Given weighted criteria and a list of candidates, " +
  "respond with strict JSON of the form {\"results\":[{\"candidate\":string,\"score\":number,\"reason\":string},...]}. " +
  "Scores must be numbers between 0 and 100 inclusive and the array must be sorted descending by score.";

function normaliseResults(results: any[]): RankingItem[] {
  return results
    .map((item) => ({
      candidate: typeof item?.candidate === "string" ? item.candidate : String(item?.candidate ?? ""),
      score: Number.isFinite(Number(item?.score)) ? Number(item.score) : 0,
      reason: typeof item?.reason === "string" ? item.reason : String(item?.reason ?? ""),
    }))
    .filter((item) => item.candidate.trim().length > 0)
    .map((item) => ({
      ...item,
      score: Math.max(0, Math.min(100, item.score)),
    }))
    .sort((a, b) => b.score - a.score);
}

export async function rankCandidatesWithClient(
  client: OpenAI,
  criteria: Criteria,
  candidates: string[],
): Promise<RankingItem[]> {
  const user = `criteria: ${JSON.stringify(criteria)}\ncandidates: ${JSON.stringify(candidates)}`;

  const response = await client.responses.create({
    model: DEFAULT_MODEL,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const text = response.output_text?.trim();
  if (!text) {
    throw new Error("OpenAI did not return any content.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error("Failed to parse OpenAI response as JSON.");
  }

  if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as any).results)) {
    throw new Error("OpenAI response missing 'results' array.");
  }

  return normaliseResults((parsed as any).results);
}

export async function rankCandidates(criteria: Criteria, candidates: string[]): Promise<RankingItem[]> {
  const client = getOpenAI();
  if (!client) {
    throw new MissingOpenAIKeyError();
  }
  return rankCandidatesWithClient(client, criteria, candidates);
}
