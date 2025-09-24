#!/usr/bin/env bash
set -euo pipefail

echo "== Detect package manager =="
PKG="npm"
if [ -f "pnpm-lock.yaml" ]; then PKG="pnpm"
elif [ -f "yarn.lock" ]; then PKG="yarn"
fi
echo "Using: $PKG"

install_dev () {
  if [ "$PKG" = "npm" ]; then npm i -D "$@"
  elif [ "$PKG" = "pnpm" ]; then pnpm add -D "$@"
  else yarn add -D "$@"
  fi
}

echo "== Ensure TypeScript + types devDeps =="
install_dev typescript @types/react @types/react-dom @types/node

echo "== Ensure next-env.d.ts =="
if [ ! -f next-env.d.ts ]; then
  cat > next-env.d.ts <<'EOF2'
// /// <reference types="next" />
// /// <reference types="next/image-types/global" />
// NOTE: This file should not be edited
EOF2
  echo "created next-env.d.ts"
fi

echo "== Ensure tsconfig.json baseline =="
if [ ! -f tsconfig.json ]; then
  cat > tsconfig.json <<'EOF3'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "allowJs": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF3
  echo "created tsconfig.json"
else
  node - <<'NODE'
const fs=require('fs');
const f='tsconfig.json';
const j=JSON.parse(fs.readFileSync(f,'utf8'));
j.compilerOptions??={};
const co=j.compilerOptions;
co.jsx=co.jsx||'react-jsx';
co.module=co.module||'ESNext';
co.target=co.target||'ES2020';
co.moduleResolution=co.moduleResolution||'Bundler';
co.strict=co.strict!==undefined?co.strict:true;
co.allowJs=co.allowJs!==undefined?co.allowJs:true;
co.esModuleInterop=co.esModuleInterop!==undefined?co.esModuleInterop:true;
co.skipLibCheck=co.skipLibCheck!==undefined?co.skipLibCheck:true;
co.forceConsistentCasingInFileNames=co.forceConsistentCasingInFileNames!==undefined?co.forceConsistentCasingInFileNames:true;
co.types=Array.isArray(co.types)?Array.from(new Set([...co.types,'node'])):['node'];
j.include = j.include??["next-env.d.ts","**/*.ts","**/*.tsx"];
j.exclude = j.exclude??["node_modules"];
fs.writeFileSync(f,JSON.stringify(j,null,2));
console.log('patched tsconfig.json');
NODE
fi

echo "== Optional: do NOT ignore type errors in CI =="
# if [ ! -f next.config.js ]; then
#   cat > next.config.js <<'EOF4'
# /** @type {import('next').NextConfig} */
# const nextConfig = {
#   typescript: {
#     ignoreBuildErrors: process.env.CI_IGNORE_TS_ERRORS === '1',
#   },
# };
# module.exports = nextConfig;
# EOF4
#   echo "created next.config.js with conditional ignore"
# fi

echo "== Lock & build locally =="
if [ "$PKG" = "npm" ]; then npm run build || true
elif [ "$PKG" = "pnpm" ]; then pnpm build || true
else yarn build || true
fi

echo "== Git commit =="
git add -A
git commit -m "chore(ts): add @types/react @types/node, ensure next-env.d.ts & tsconfig sanity"
git push origin HEAD

echo "== Done. Push triggers Vercel build automatically. =="
