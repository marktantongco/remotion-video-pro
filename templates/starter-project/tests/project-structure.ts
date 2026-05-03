// Project structure tests
// Verify the expected directory layout and file conventions
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
let testsRun = 0;
let testsFailed = 0;

function test(name: string, fn: () => boolean | string) {
  testsRun++;
  try {
    const result = fn();
    if (result === true) {
      console.log(`  PASS: ${name}`);
    } else {
      const msg = typeof result === 'string' ? result : 'Assertion failed';
      console.log(`  FAIL: ${name} — ${msg}`);
      testsFailed++;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  FAIL: ${name} — ${msg}`);
    testsFailed++;
  }
}

console.log('\n[Project Structure]');

test('package.json exists', () => {
  return existsSync(join(ROOT, 'package.json')) || 'package.json missing';
});

test('tsconfig.json has strict mode enabled', () => {
  const tsconfigPath = join(ROOT, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) return 'tsconfig.json missing';
  const content = require(tsconfigPath);
  if (content.compilerOptions?.strict !== true) return 'strict: true not set in tsconfig.json';
  return true;
});

test('remotion.config.ts exists', () => {
  return existsSync(join(ROOT, 'remotion.config.ts')) || 'remotion.config.ts missing';
});

test('src/ directory exists', () => {
  return existsSync(join(ROOT, 'src')) || 'src/ directory missing';
});

test('src/scenes/ directory exists', () => {
  return existsSync(join(ROOT, 'src', 'scenes')) || 'src/scenes/ directory missing';
});

test('src/scenes/ contains at least one scene component', () => {
  const scenesDir = join(ROOT, 'src', 'scenes');
  if (!existsSync(scenesDir)) return 'src/scenes/ does not exist';
  const files = readdirSync(scenesDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
  return files.length > 0 ? true : 'No scene components found in src/scenes/';
});

test('scripts/ directory exists', () => {
  return existsSync(join(ROOT, 'scripts')) || 'scripts/ directory missing';
});

test('public/ directory exists', () => {
  return existsSync(join(ROOT, 'public')) || 'public/ directory missing';
});

test('public/data/ directory exists (for JSON assets)', () => {
  return existsSync(join(ROOT, 'public', 'data')) || 'public/data/ directory missing';
});

test('package.json has "validate" script', () => {
  const pkg = require(join(ROOT, 'package.json'));
  return pkg.scripts?.validate ? true : 'No "validate" script in package.json';
});

test('package.json has "test" script', () => {
  const pkg = require(join(ROOT, 'package.json'));
  return pkg.scripts?.test ? true : 'No "test" script in package.json';
});

test('husky pre-commit hook exists', () => {
  return existsSync(join(ROOT, '.husky', 'pre-commit')) || '.husky/pre-commit missing';
});

test('No .mp4 files in src/ (should be in public/)', () => {
  function walk(dir: string): string[] {
    let mp4s: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) mp4s.push(...walk(full));
      else if (entry.name.endsWith('.mp4')) mp4s.push(full);
    }
    return mp4s;
  }
  const srcDir = join(ROOT, 'src');
  if (!existsSync(srcDir)) return true;
  const mp4s = walk(srcDir);
  return mp4s.length === 0 ? true : `Found .mp4 in src/: ${mp4s.join(', ')}`;
});

console.log(`\n--- Structure Tests: ${testsRun - testsFailed}/${testsRun} passed ---`);
if (testsFailed > 0) process.exit(1);
