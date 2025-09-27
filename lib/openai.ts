import OpenAI from "openai";
/** NEVER instantiate at module scope. */
export function getOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}
