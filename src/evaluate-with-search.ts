export interface EvaluateRequest {
  projectId: string;
  refresh?: boolean;
}

export async function evaluateWithSearch({ projectId, refresh = true }: EvaluateRequest) {
  const searchApiKey = process.env.SEARCH_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  if (refresh && !searchApiKey) {
    throw new Error('Missing SEARCH_API_KEY');
  }

  let searchResults: unknown[] = [];
  if (refresh) {
    try {
      const searchResp = await fetch(
        `https://api.example.com/search?q=${encodeURIComponent(projectId)}`,
        {
          headers: { 'X-API-Key': searchApiKey! }
        }
      );

      if (!searchResp.ok) {
        const body = await searchResp.text();
        throw new Error(`Search API error: ${searchResp.status} ${body}`);
      }

      searchResults = await searchResp.json();
    } catch (err) {
      console.error('Search API request failed', err);
      throw err;
    }
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
