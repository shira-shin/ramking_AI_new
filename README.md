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

### Google OAuth / NextAuth 設定

認証機能を有効にするには、以下の環境変数も設定してください。

```
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
NEXTAUTH_SECRET=ランダムな長い文字列
NEXTAUTH_URL=https://<your-domain>
```

Vercel にデプロイする場合は、プロジェクトの Environment Variables にこれらの値を追加してください。`NEXTAUTH_URL` はデプロイ先ドメインに合わせて設定する必要があります。
