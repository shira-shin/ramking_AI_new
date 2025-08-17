import { z } from 'zod';

export interface EvaluateRequest {
  projectId: string;
  refresh?: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const searchResultSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string()
});

const searchResultsSchema = z.array(searchResultSchema);

export async function evaluateWithSearch({ projectId, refresh = true }: EvaluateRequest) {
  const searchApiKey = process.env.SEARCH_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  if (refresh && !searchApiKey) {
    throw new Error('Missing SEARCH_API_KEY');
  }

  let searchResults: SearchResult[] = [];
  if (refresh) {
    const searchResp = await fetch(`https://api.example.com/search?q=${encodeURIComponent(projectId)}`, {
      headers: { 'X-API-Key': searchApiKey! }
    });
    const data = await searchResp.json();
    const parsed = searchResultsSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Invalid search results');
    }
    searchResults = parsed.data;
  }

  const aiResp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: `Score project ${projectId} with data ${JSON.stringify(searchResults)}`
    })
  });

  if (!aiResp.ok) {
    throw new Error(`OpenAI API error: ${aiResp.status}`);
  }
  return aiResp.json();
}
