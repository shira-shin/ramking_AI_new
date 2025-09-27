# ranking_AI_new
ランキングや順位づけをするAI

## Setup

1. `cp .env.example .env`
2. `npm install`
3. `npm run db:push`
4. `npm run db:seed`
5. `npm run dev`

## Environment variables

See `.env.example` for the full list of required keys. Run `npm run env:check` to verify that all required environment variables are configured.

## Vercel デプロイ時の注意

- Vercel の Production / Preview Branch は、型依存を固定済みの統合用安定ブランチ（例：`stabilize/build-types-and-openai`）を指定してください。
- 統合ブランチには `@types/react` などの型パッケージを `dependencies` に固定し、OpenAI 呼び出しの遅延や `prebuild` ガードが組み込まれています。
- 統合ブランチ以外（例：`codex/add-unified-branch-for-openai-integration`）を直接ビルド対象にすると `@types/react` が無いため `prebuild` が即失敗します。

Production / Preview の両方で統合ブランチを指定しておくと、Vercel でのビルドが安定します。
