// Pattern compliance tests
// Verify every skill rule is followed in the codebase
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SRC_DIR = join(process.cwd(), 'src');
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

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function fileContent(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── Rule 01: Scaffolding ──
console.log('\n[Scaffolding]');

test('Root.tsx exists and exports Root component', () => {
  const rootPath = join(SRC_DIR, 'Root.tsx');
  if (!existsSync(rootPath)) return 'Root.tsx not found';
  const content = fileContent(rootPath);
  if (!content.includes('export const Root')) return 'No exported Root component';
  if (!content.includes('Composition')) return 'No Composition component';
  return true;
});

test('index.ts exists and calls registerRoot', () => {
  const indexPath = join(SRC_DIR, 'index.ts');
  if (!existsSync(indexPath)) return 'index.ts not found';
  const content = fileContent(indexPath);
  if (!content.includes('registerRoot')) return 'Does not call registerRoot';
  return true;
});

test('remotion.config.ts exists', () => {
  const configPath = join(process.cwd(), 'remotion.config.ts');
  if (!existsSync(configPath)) return 'remotion.config.ts not found';
  const content = fileContent(configPath);
  if (!content.includes('setCodec') && !content.includes('Config.set')) return 'No Remotion config set';
  return true;
});

// ── Rule 02: Animation Physics ──
console.log('\n[Animation Physics]');

test('No Math.random() anywhere in src/', () => {
  const files = getAllFiles(SRC_DIR);
  for (const f of files) {
    if (fileContent(f).includes('Math.random()')) {
      return `Found Math.random() in ${f}`;
    }
  }
  return true;
});

test('No setTimeout/setInterval/requestAnimationFrame in src/', () => {
  const files = getAllFiles(SRC_DIR);
  const banned = [/\bsetTimeout\b/, /\bsetInterval\b/, /\brequestAnimationFrame\b/];
  for (const f of files) {
    const content = fileContent(f);
    for (const pattern of banned) {
      if (pattern.test(content)) return `Found timer in ${f}`;
    }
  }
  return true;
});

test('No CSS @keyframes/animation/transition in src/', () => {
  const files = getAllFiles(SRC_DIR);
  const banned = [/@keyframes/, /animation:\s/, /animation-name:\s/, /transition:\s/, /transition-property:\s/];
  for (const f of files) {
    const content = fileContent(f);
    for (const pattern of banned) {
      if (pattern.test(content)) return `Found CSS animation in ${f}`;
    }
  }
  return true;
});

test('Uses spring() or interpolate() for motion (not CSS)', () => {
  const files = getAllFiles(SRC_DIR);
  let hasMotionAPI = false;
  for (const f of files) {
    const content = fileContent(f);
    if (content.includes('spring(') || content.includes('interpolate(')) {
      hasMotionAPI = true;
      break;
    }
  }
  return hasMotionAPI ? true : 'No spring() or interpolate() usage found';
});

// ── Rule 06: Performance ──
console.log('\n[Performance]');

test('All scene components are wrapped in React.memo', () => {
  const scenesDir = join(SRC_DIR, 'scenes');
  if (!existsSync(scenesDir)) return 'No scenes/ directory found';
  const sceneFiles = getAllFiles(scenesDir);
  for (const f of sceneFiles) {
    const content = fileContent(f);
    if (content.includes('export') && !content.includes('React.memo')) {
      return `Scene component not wrapped in React.memo: ${f}`;
    }
  }
  return true;
});

test('No <Video> tag for MP4 inputs (use OffthreadVideo)', () => {
  const files = getAllFiles(SRC_DIR);
  for (const f of files) {
    if (fileContent(f).includes('<Video')) {
      return `Found <Video> tag in ${f} — use <OffthreadVideo> instead`;
    }
  }
  return true;
});

test('No direct .mp4 imports', () => {
  const files = getAllFiles(SRC_DIR);
  for (const f of files) {
    if (/import\s+.*\s+from\s+['"][^'"]+\.mp4['"]/.test(fileContent(f))) {
      return `Found .mp4 import in ${f} — use staticFile() instead`;
    }
  }
  return true;
});

test('Named imports from remotion (no namespace imports)', () => {
  const files = getAllFiles(SRC_DIR);
  for (const f of files) {
    if (/import\s+\*\s+as\s+\w+\s+from\s+['"]remotion['"]/.test(fileContent(f))) {
      return `Found namespace import from remotion in ${f}`;
    }
  }
  return true;
});

// ── Rule 11: Validation Pipeline ──
console.log('\n[Validation]');

test('validate-composition.ts exists in scripts/', () => {
  const validatorPath = join(process.cwd(), 'scripts', 'validate-composition.ts');
  return existsSync(validatorPath) ? true : 'validate-composition.ts not found in scripts/';
});

test('Zod schema is used in Root.tsx', () => {
  const rootPath = join(SRC_DIR, 'Root.tsx');
  if (!existsSync(rootPath)) return 'Root.tsx not found';
  const content = fileContent(rootPath);
  if (!content.includes('z.object') && !content.includes('z.string')) return 'No Zod schema in Root.tsx';
  return true;
});

test('calculateMetadata is used in Root.tsx', () => {
  const rootPath = join(SRC_DIR, 'Root.tsx');
  if (!existsSync(rootPath)) return 'Root.tsx not found';
  const content = fileContent(rootPath);
  if (!content.includes('calculateMetadata')) return 'No calculateMetadata in Root.tsx';
  return true;
});

test('delayRender/continueRender are paired (no orphan delayRender)', () => {
  const files = getAllFiles(SRC_DIR);
  for (const f of files) {
    const content = fileContent(f);
    if (content.includes('delayRender') && !content.includes('continueRender')) {
      return `delayRender without continueRender in ${f}`;
    }
  }
  return true;
});

// Summary
console.log(`\n--- Pattern Tests: ${testsRun - testsFailed}/${testsRun} passed ---`);
if (testsFailed > 0) process.exit(1);
