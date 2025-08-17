import { calculateFinalScore, ScoringCriteria, ItemFactors } from './scoring';

export interface EvaluateRequest {
  projectId: string;
  refresh?: boolean;
  model?: 'openai' | 'gemini';
}

interface Item {
  id: string;
  title: string;
  metrics: Record<string, number>;
  ageDays: number;
  sourceCred: number;
  crossRefs: number;
}

interface Project {
  items: Item[];
  criteria: ScoringCriteria;
}

interface Evaluation {
  itemId: string;
  finalScore: number;
  reasons: { top: string[]; cons: string[] };
}

async function fetchProject(projectId: string): Promise<Project> {
  // In a real implementation this would query the database. For demo purposes
  // we return a tiny static project.
  return {
    items: [
      {
        id: '1',
        title: 'Sample Item A',
        metrics: { price: 0.8, quality: 0.9 },
        ageDays: 1,
        sourceCred: 0.8,
        crossRefs: 0.5
      },
      {
        id: '2',
        title: 'Sample Item B',
        metrics: { price: 0.6, quality: 0.7 },
        ageDays: 5,
        sourceCred: 0.6,
        crossRefs: 0.3
      }
    ],
    criteria: {
      weights: { price: 0.5, quality: 0.5 },
      lambda: 0.01,
      alpha: 0.7,
      beta: 0.3
    }
  };
}

async function searchAndUpdate(item: Item, apiKey: string): Promise<void> {
  const resp = await fetch(`https://api.example.com/search?q=${encodeURIComponent(item.title)}`, {
    headers: { 'X-API-Key': apiKey }
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Search API error: ${resp.status} ${body}`);
  }
  const data: any[] = await resp.json();
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (typeof first.ageDays === 'number') item.ageDays = first.ageDays;
    if (typeof first.sourceCred === 'number') item.sourceCred = first.sourceCred;
    item.crossRefs = data.length;
  }
}

async function generateReasons(model: 'openai' | 'gemini', apiKey: string, item: Item): Promise<{ top: string[]; cons: string[] }> {
  const prompt = `Provide top reasons and cons for ${item.title} given metrics ${JSON.stringify(item.metrics)}. Respond in JSON {\"top\":[],\"cons\":[]}`;
  const url = model === 'gemini'
    ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
    : 'https://api.openai.com/v1/responses';
  const body = model === 'gemini'
    ? { contents: [{ parts: [{ text: prompt }]}] }
    : { model: 'gpt-4.1-mini', input: prompt };
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LLM API error: ${resp.status} ${text}`);
  }
  const json = await resp.json();
  try {
    const text = model === 'gemini'
      ? json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
      : json.output_text ?? json.choices?.[0]?.message?.content ?? '{}';
    return JSON.parse(text);
  } catch {
    return { top: [], cons: [] };
  }
}

export async function evaluateWithSearch({ projectId, refresh = true, model = 'openai' }: EvaluateRequest): Promise<{ evaluations: Evaluation[]; updatedAt: string }> {
  const project = await fetchProject(projectId);
  const searchApiKey = process.env.SEARCH_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const modelApiKey = model === 'openai' ? openaiApiKey : geminiApiKey;

  if (!modelApiKey) {
    throw new Error('Missing API key for selected model');
  }
  if (refresh && !searchApiKey) {
    throw new Error('Missing SEARCH_API_KEY');
  }

  for (const item of project.items) {
    if (refresh) {
      await searchAndUpdate(item, searchApiKey!);
    }
  }

  const evaluations: Evaluation[] = [];
  for (const item of project.items) {
    const factors: ItemFactors = {
      metrics: item.metrics,
      ageDays: item.ageDays,
      sourceCred: item.sourceCred,
      crossRefs: item.crossRefs,
      penalties: 0
    };
    const finalScore = calculateFinalScore(factors, project.criteria);
    const reasons = await generateReasons(model, modelApiKey, item);
    evaluations.push({ itemId: item.id, finalScore, reasons });
  }

  return { evaluations, updatedAt: new Date().toISOString() };
}
