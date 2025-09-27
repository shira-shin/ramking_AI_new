import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['tsc', '--noEmit'], {
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error('\nFailed to launch TypeScript compiler.', result.error);
  process.exit(1);
}

if (result.status !== 0) {
  console.error('\nType checking failed. Aborting build.');
  process.exit(result.status ?? 1);
}

console.log('Type checking succeeded.');
