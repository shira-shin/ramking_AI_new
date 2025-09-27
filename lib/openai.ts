import OpenAI from "openai";

/**
 * NEVER instantiate at module scope.
 * Always obtain a client inside a request handler.
 */
export function getOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}
