#!/usr/bin/env tsx
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SRC_DIR = join(process.cwd(), 'src');
const BANNED_PATTERNS = [
  { pattern: /Math\.random\(\)/, message: 'Use random(seed) from remotion instead of Math.random()' },
  { pattern: /setTimeout|setInterval|requestAnimationFrame/, message: 'Never use timers. Drive logic from useCurrentFrame()' },
  { pattern: /@keyframes|animation:|transition:/, message: 'Never use CSS animations/transitions. Use interpolate() or spring()' },
  { pattern: /import\s+.*\s+from\s+['"]remotion['"]/, message: 'Use named imports from remotion, not namespace imports' },
  { pattern: /<Video\s+src/, message: 'Use <OffthreadVideo> for input MP4s, not <Video>' },
  { pattern: /import\s+.*\s+from\s+['"]\.\/.*\.mp4['"]/, message: 'Never import video files. Place in public/ and use staticFile()' },
  { pattern: /defaultProps.*\{[\s\S]{1000,}\}/, message: 'defaultProps too large. Use staticFile() + fetch for heavy data' },
];

const errors: string[] = [];

function scanFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');

  BANNED_PATTERNS.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      errors.push(`❌ ${filePath}: ${message}`);
    }
  });

  if (filePath.includes('scenes/') || filePath.includes('components/')) {
    const hasMemo = content.includes('React.memo');
    const hasExport = content.includes('export const');
    if (hasExport && !hasMemo) {
      errors.push(`⚠️ ${filePath}: Exported component should be wrapped in React.memo()`);
    }
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

if (errors.length > 0) {
  console.error('Validation failed:\n');
  errors.forEach(err => console.error(err));
  process.exit(1);
} else {
  console.log('✅ All compositions validated successfully');
}
