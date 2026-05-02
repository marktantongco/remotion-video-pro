#!/usr/bin/env tsx
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

interface BannedPattern {
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning';
}

const BANNED_PATTERNS: BannedPattern[] = [
  {
    pattern: /Math\.random\(\)/,
    message: 'Use random(seed) from remotion instead of Math.random(). Non-deterministic renders.',
    severity: 'error',
  },
  {
    pattern: /\bsetTimeout\b|\bsetInterval\b|\brequestAnimationFrame\b/,
    message: 'Never use browser timers. Drive all logic from useCurrentFrame().',
    severity: 'error',
  },
  {
    pattern: /@keyframes|animation:\s|animation-name:\s|transition:\s|transition-property:\s/,
    message: 'Never use CSS animations/transitions. Use interpolate() or spring() from remotion.',
    severity: 'error',
  },
  {
    pattern: /<Video\s+src/,
    message: 'Use <OffthreadVideo> for input MP4s, not <Video>. Prevents frame drops.',
    severity: 'error',
  },
  {
    pattern: /import\s+.*\s+from\s+['"][^'"]+\.mp4['"]/,
    message: 'Never import .mp4 files. Place in public/ and reference with staticFile().',
    severity: 'error',
  },
  {
    pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"]remotion['"]/,
    message: 'Use named imports from remotion, not namespace imports. Reduces bundle size.',
    severity: 'warning',
  },
];

const errors: string[] = [];
const warnings: string[] = [];

function scanFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');

  for (const { pattern, message, severity } of BANNED_PATTERNS) {
    if (pattern.test(content)) {
      const report = `${filePath}: ${message}`;
      if (severity === 'error') {
        errors.push(`ERROR: ${report}`);
      } else {
        warnings.push(`WARN: ${report}`);
      }
    }
  }

  if (filePath.includes('scenes/') || filePath.includes('components/')) {
    const hasMemo = content.includes('React.memo');
    const hasNamedExport = /export\s+(const|function)\s+\w+/.test(content);

    if (hasNamedExport && !hasMemo) {
      warnings.push(`WARN: ${filePath}: Exported component should be wrapped in React.memo()`);
    }
  }

  if (content.includes('delayRender') && !content.includes('continueRender')) {
    warnings.push(`WARN: ${filePath}: Uses delayRender() without continueRender(). Render may hang forever.`);
  }
}

function walkDir(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      scanFile(fullPath);
    }
  }
}

try {
  walkDir(SRC_DIR);
} catch (e) {
  console.error('Failed to scan src directory:', e);
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('\nWarnings:');
  warnings.forEach((w) => console.warn(`  ${w}`));
}

if (errors.length > 0) {
  console.error(`\nValidation FAILED (${errors.length} errors, ${warnings.length} warnings):\n`);
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

console.log(`Validated successfully (${warnings.length} warnings, 0 errors)`);
