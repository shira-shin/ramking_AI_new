# npm 11 Proxy Setup Script

npm v11 対応の "そのまま貼って動く" スクリプトと、403 エラーが続く場合のチェックリスト、再発防止策をまとめています。必要な箇所は自分の環境に合わせて置き換えてください。

## A. Codex で通すための最新版スクリプト（npm 11 対応）

```bash
#!/usr/bin/env bash
set -euo pipefail

# ===== 0) 事前情報の出力（ログ用） =====
echo "node: $(node -v)  npm: $(npm -v)"
npm config get registry || true
env | grep -i -E 'npm|proxy|registry' || true
[ -f .npmrc ] && { echo "--- .npmrc (project) ---"; cat .npmrc; }

# ===== 1) プロキシ資格情報 =====
# 例: http://USER:PASS@proxy.example.jp:8080
read -rsp "PROXY_URL (e.g. http://USER:PASS@proxy.example.jp:8080): " PROXY_URL; echo
# ユーザー名/パスワードに記号が含まれる場合は URL エンコード必須（@, :, /, # など）

# ===== 2) npm を公式レジストリ + プロキシに固定 =====
npm config set registry "https://registry.npmjs.org/"
npm config set proxy "$PROXY_URL"
npm config set https-proxy "$PROXY_URL"

# npm 11では always-auth は無効。残骸があれば削除しておく。
npm config delete always-auth || true
# 誤った authToken が残っていると 403 の原因になるので削除
npm config delete //registry.npmjs.org/:_authToken || true

# ===== 3) 社内CA（MITMプロキシ対応） =====
# /tmp/corp-ca.pem に社内CAを置く。アップロードできない場合は base64 を貼って復元する方法を下に記載。
if [ ! -f /tmp/corp-ca.pem ]; then
  echo "Place your corporate CA PEM at /tmp/corp-ca.pem and press Enter"
  read -r
fi
if [ -f /tmp/corp-ca.pem ]; then
  npm config set cafile "/tmp/corp-ca.pem"
  export NODE_EXTRA_CA_CERTS="/tmp/corp-ca.pem"
  npm config set strict-ssl true
else
  echo "WARN: /tmp/corp-ca.pem not found. If your proxy does TLS interception, requests may fail with 403/SSL errors."
fi

# ===== 4) キャッシュ掃除 & 環境変数の衝突排除 =====
npm cache clean --force
# npm の proxy は npm config に任せるので、環境変数側のプロキシは明示的に無効化
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy NO_PROXY no_proxy NPM_CONFIG_REGISTRY NPM_TOKEN

# 念のため再設定（npm の設定に揃える）
npm config set proxy "$PROXY_URL"
npm config set https-proxy "$PROXY_URL"

# ===== 5) 疎通確認 =====
echo "== npm ping =="
npm ping --verbose || true
echo "== npm view smoke test =="
npm view @types/node version --verbose || true

# ===== 6) lockfile 再生成 =====
rm -rf node_modules package-lock.json
npm install --no-audit --no-fund --fetch-retries=5 --fetch-retry-maxtimeout=120000

# ===== 7) Prisma を使う場合のみ（postinstall で generate を保証） =====
if [ -d prisma ] || [ -f prisma/schema.prisma ]; then
  npm pkg set scripts.postinstall="prisma generate" 2>/dev/null || true
  npm ls @prisma/client >/dev/null 2>&1 || npm i @prisma/client
  npm ls prisma -D   >/dev/null 2>&1 || npm i -D prisma
  npx prisma generate || true
fi

# ===== 8) コミット & プッシュ =====
git add package-lock.json package.json
git commit -m "chore(lock): regenerate package-lock.json behind proxy (npm11, registry+CA configured)" || echo "no changes"
git push
```

### CA ファイルをコマンド内で復元したい場合（アップロード不可時）

社内 CA を base64 文字列で貼って `/tmp` に復元できます：

```bash
# <<<ここに base64 化した pem を貼る>>>
CA_B64='PASTE_BASE64_HERE'
echo "$CA_B64" | base64 -d > /tmp/corp-ca.pem
```

## B. 403 が続く場合のチェックリスト（要点）

- 資格情報の URL エンコード：`@`, `:`, `/`, `#`, `?`, `&` などは必ずエンコード（例：`@` → `%40`）。
- プロキシの許可先：`registry.npmjs.org`, `*.npmjs.org`（必要なら `github.com`, `api.github.com`, `objects.githubusercontent.com`）。
- 誤った認証残骸：`npm config get //registry.npmjs.org/:_authToken` が出てきたら `npm config delete`。
- 環境変数の衝突：`env | grep -i -E 'npm|proxy|registry'` と `npm config list -l` の不整合を解消。
- 暫定の最後の手段：`npm config set strict-ssl false`（ロック再生成できたら true に戻す）。
- ネットワーク診断のために、curl で直に確認すると原因切り分けが速い：

  ```bash
  curl -v -x "$PROXY_URL" https://registry.npmjs.org/@types/node
  ```

## C. 完了後の再発防止

- Vercel / CI の Install は `npm ci` に固定（ロックに厳密一致）。
- Prisma を使っているなら `package.json` に `"postinstall": "prisma generate"` を残す。
- ロックファイルは npm のみをリポジトリに置く（`pnpm-lock.yaml` / `yarn.lock` は削除）。

## いまの詰まりポイントに対する回答

- npm 11 で **`always-auth` が invalid** → 削除で OK（上のスクリプトは対応済み）。
- 依然として 403 → 資格情報の URL エンコードと社内 CA が最頻原因。上の curl テストで 403 の出どころ（プロキシか npmjs 本体か）を確認してください。
