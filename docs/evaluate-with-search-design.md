# AIランキングWebアプリ 設計書（Codex実装用・統合API版）

> Codex実装用にAPIを最小化し、**検索→抽出→スコア計算→理由生成**までを1つのAPIで行う仕様に更新。

---

## 0. プロダクト概要（B2B × C2C／映えるUI）

* **目的**: ユーザーが定義した評価基準に基づき、候補をAIでスコアリングし、理由付きランキングを生成・共有・販売できる意思決定支援Webアプリ。
* **特徴**:

  * B2B: 組織スペース、権限、監査ログ、非公開共有。
  * C2C: ランキング・評価テンプレの公開／販売マーケット。
  * **映えるUI**: 順位変動アニメ、OG画像自動生成、視覚化（レーダー等）。
  * **最新情報反映**: 統合API内で検索→鮮度/信頼補正でスコアに反映。
* **対象**: 個人の購買比較、チームの優先度決定、ネーミング評価、採用比較など。

---

## 1. スコープ

### 1.1 MVPに含む

* Googleログイン（NextAuth + OIDC; profile/email）
* プロジェクト作成／保存／共有（公開/リンク/組織）
* 評価基準（Weights/Hard/Softルール/鮮度λ/信頼αβ/タイブレーク）編集
* 候補の登録（行＋CSVアップロード、画像URL自動推定）
* **統合API** `/api/evaluate-with-search` によるAIスコア＆理由生成（検索込み）
* ランキング表示（順位カード、詳細モーダル、レーダー、理由、警告）
* 共有リンク／OG画像自動生成（上位3位バッジ＋更新日）
* 課金（Stripe：Free/Pro/Team）

### 1.2 後続（v1.1+）

* 定期自動更新、Slack/Notion Webhook、SSO/SCIM、テンプレ販売（C2C）

---

## 2. 技術スタック

* **Frontend**: Next.js 14 / TypeScript / Tailwind CSS / shadcn/ui / Framer Motion / Recharts
* **Auth**: NextAuth.js + Google OIDC（PKCE）
* **Backend**: Next.js API Routes
* **DB**: PostgreSQL + Prisma ORM
* **Cache/Queue**: Redis（BullMQ）
* **Storage**: S3互換（Cloudflare R2/S3）
* **LLM**: OpenAI Responses API または Google Gemini 1.5
* **Search**: Bing/Brave/SerpAPIのいずれか（最初は1つに固定）
* **Payments**: Stripe
* **Infra**: Vercel or Render

---

## 3. アーキテクチャ概要

```
[Client]
  ├─ Auth UI / Editor / Ranking View / Share
  └─ POST /api/evaluate-with-search {projectId, refresh}

[Server]
  ├─ /api/auth/[...nextauth]
  ├─ /api/evaluate-with-search
       ├─ 検索API呼び出し（必要時）
       ├─ 検索結果＋既存データをLLMへ渡す
       ├─ LLMがスコア＋理由＋更新値を返す
       ├─ DB更新＆結果返却
  ├─ /api/share, /api/og
  └─ /api/stripe/*
```

---

## 4. 統合API `/api/evaluate-with-search`

**入力**

```json
{
  "projectId": "abc123",
  "refresh": true
}
```

**処理フロー**

1. プロジェクトと基準をDBから取得
2. `refresh=true`なら検索APIで候補情報を取得
3. 取得データ＋基準をLLMに渡し、スコア＆理由＆更新指標を生成
4. DBのEvaluation更新
5. レスポンスとして更新済みランキングを返却

**出力例**

```json
{
  "evaluations": [
    {"itemId":"1","score":82.3,"top_reasons":["価格が安い"],"cons":["重い"]}
  ],
  "updatedAt": "2025-08-15T10:00:00Z"
}
```

---

## 5. 設定可能パラメータ

* 重み付け、Hard/Softルール、鮮度λ、信頼αβ、タイブレーク
* 最終スコア計算は統合API内で実行

**式**

```
Base_i = Σ w_k * normalize(x_{i,k})
Final_i = Base_i * exp(-λ*age_days) * min(1, α*sourceCred + β*crossRefs) - penalties_i
```

---

## 6. セキュリティ

* APIキーはCodex環境変数で管理
* クライアントからは直接外部検索APIやLLMへアクセスしない

---

## 7. 受け入れ基準（MVP）

* Googleログイン後、プロジェクト作成→候補入力→統合API呼び出しでスコア＆理由が返る
* `refresh=true`で最新情報を検索し、反映された結果が返る
* 共有リンク、OG画像生成、Free/Pro差別化が機能

---

これにより、APIは `/api/evaluate-with-search` を中心に最小構成となります。

---

## 改訂 2025-08-15：API最小構成版（検索→抽出→評価を**1エンドポイント**へ統合）

**目的**: フロント/バック双方のAPI数を最小化し、実装・保守・コストを簡素化。

### A. 採用方針（v1）

* 採用：`POST /api/evaluate-with-search` の**単一エンドポイント**に統合。
* 非採用（v1では使わない）：`/api/fetch-and-score`, `/api/evaluate` の分離構成。
* GPTは\*\*function calling（tools）\*\*を使い、`search_web`/`fetch_page` を呼び出し可能に。

  * 実検索はサーバー側で Bing/Brave/SerpAPI のいずれかを叩く。
  * GPTへは**要点スニペットのみ**渡し、トークン膨張を防ぐ。

### B. 統合エンドポイント仕様

* **Route**: `POST /api/evaluate-with-search`
* **Body**: `{ projectId: string, refresh?: boolean, model?: "openai"|"gemini" }`
* **処理フロー**:

  1. `refresh` が真なら検索API→結果URLの要約取得（Readability）
  2. 指標を抽出し正規化（通貨/単位変換、欠損= null）
  3. 基準（weights/Hard/Soft/λ/αβ/tiebreakers）で**最終スコア**計算
  4. GPTに候補+基準+抽出結果を渡し、**厳密JSON**の理由/警告/ソースを生成
  5. DB保存（`Evaluation` バージョン付き）＆差分（順位/価格変化）を作成
  6. **Response**: `{ evaluations: [...], diffs: {...}, updatedAt: ISO8601 }`

### C. GPTツール（function calling）

* `search_web(query, maxResults)` → 検索APIを叩き、`[{title,url,snippet,published_at,domain}]` を返す
* `fetch_page(url)` → テキスト抽出（Readability）→ **短い抜粋**（最大数KB）だけ返す

> いずれも**バックエンド関数**で実装し、APIキーはサーバーにのみ保持。

### D. スコア式（再掲）

```
Base_i = Σ_k w_k * normalize(x_{i,k})
Final_i = Base_i * exp(-λ*age_days) * min(1, α*sourceCred + β*crossRefs) - penalties_i
```

* Hard違反=除外、Soft違反=減点。
* フロントは**重み変更の即時計算**（体感速度向上）、サーバーは確定保存用に再計算。

### E. UIの変更点

* ランキング画面の更新ボタンは**常に本API**を叩く。
* ソースチップ（ドメイン/日付）・信頼メーター・変動アニメは既存設計のまま。

### F. 環境変数（変更なし・Codex環境で管理）

```
DATABASE_URL=...
REDIS_URL=...
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=...        # or GEMINI_API_KEY
SEARCH_API_KEY=...        # Bing/Brave/SerpAPI のいずれか
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
S3_ENDPOINT=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=...
```

### G. 実装手順（差分）

1. `/api/evaluate-with-search` を新規作成（旧 `/api/fetch-and-score` は作らない）
2. 検索クライアント/抽出/正規化/スコア計算/理由生成を**同ファイル**で orchestrate
3. GPTは function calling + JSON Schema 検証（失敗時リトライ）
4. 72hキャッシュ、URLごとの最短再取得間隔を設定
5. e2e: モック検索で安定テスト

> この改訂により、フロントから見た外部API依存は **GPT API と 検索APIの2種類**のみになります。

