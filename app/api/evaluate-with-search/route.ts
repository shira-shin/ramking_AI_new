// Node ランタイム（DBやNodeモジュールを使える）
export const runtime = 'nodejs';

type Criteria = Record<string, number>;

/**
 * デモ用の決定的なスコア関数（外部API不要・依存追加なし）
 *  - criteria のキーと candidate の文字列で簡易スコアを算出
 *  - 以前の「ランキングが返る」挙動を即再現するための軽量版
 */
function scoreCandidate(c: string, criteria: Criteria) {
  const base = [...c].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const weight = Object.values(criteria).reduce((a, b) => a + Number(b || 0), 0) || 1;
  return Math.round((base % 101) * weight); // 0..100 * weight
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(async () => {
      const fd = await req.formData(); // フォーム送信に対応
      return {
        criteria: JSON.parse((fd.get('criteria')?.toString() ?? '{}')),
        candidates: (fd.get('candidates')?.toString() ?? '').split(',').map(s => s.trim()).filter(Boolean),
      };
    });

    const criteria: Criteria =
      typeof body.criteria === 'string' ? JSON.parse(body.criteria || '{}') : (body.criteria || {});
    const candidates: string[] =
      Array.isArray(body.candidates) ? body.candidates : ((body.candidates || '').split(','));

    const items = candidates.map(s => s.trim()).filter(Boolean);
    if (!items.length) {
      return Response.json({ ok:false, message: 'No candidates provided' }, { status: 400 });
    }

    const results = items
      .map(item => ({ item, score: scoreCandidate(item, criteria), reason: 'heuristic score' }))
      .sort((a, b) => b.score - a.score);

    return Response.json({ ok: true, criteria, results }, { status: 200 });
  } catch (e: any) {
    return Response.json({ ok:false, error: e?.message ?? 'unknown error' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, ts: Date.now() });
}
