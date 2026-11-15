// scripts/run-tests.mjs
// `npm test` entry point: runs tests/**/*.test.ts with Node's built-in test runner.
import { spawnSync } from 'node:child_process';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(`npm test needs Node 22.18+ (built-in TypeScript support). You have ${process.version}.`);
  process.exit(1);
}

const args = [
  '--no-warnings=ExperimentalWarning',
  '--import', './scripts/test-loader.mjs',
  '--test',
  ...(process.argv.length > 2 ? process.argv.slice(2) : ['tests/**/*.test.ts'])
];
const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
