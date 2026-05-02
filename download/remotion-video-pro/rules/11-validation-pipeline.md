# Validation Pipeline

## The 7 Deadly Sins of Remotion

These patterns will break renders, produce inconsistent output, or waste Lambda dollars. The validation pipeline catches all of them automatically.

| Sin | Pattern | Why It Breaks |
|-----|---------|---------------|
| 1 | `Math.random()` | Non-deterministic — every render produces different output |
| 2 | `setTimeout` / `setInterval` / `requestAnimationFrame` | Browser timers don't exist in headless Chromium |
| 3 | CSS `transition` / `@keyframes` | CSS animations are ignored by headless Chrome during render |
| 4 | `<Video>` tag for MP4 input | Decodes on main thread, causes frame drops |
| 5 | `import` of `.mp4` files | Bundles video into JS payload, explodes bundle size |
| 6 | Oversized `defaultProps` | Exceeds Remotion's props serialization limit |
| 7 | Missing `React.memo` on scenes | Unnecessary re-renders cost money on Lambda |

## Pre-Commit Hook

Install husky and lint-staged:

```bash
npm install -D husky lint-staged
npx husky init
```

Update `package.json`:

```json
{
  "scripts": {
    "validate": "npx tsx scripts/validate-composition.ts",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "npx tsx scripts/validate-composition.ts"
    ]
  }
}
```

Set `.husky/pre-commit`:

```bash
npx lint-staged
```

## Composition Validator Script

Save as `scripts/validate-composition.ts`. This scans all `.ts` and `.tsx` files in `src/` for banned patterns.

```ts
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

  // Check for missing React.memo on exported scene components
  if (filePath.includes('scenes/') || filePath.includes('components/')) {
    const hasMemo = content.includes('React.memo');
    const hasNamedExport = /export\s+(const|function)\s+\w+/.test(content);

    if (hasNamedExport && !hasMemo) {
      warnings.push(`WARN: ${filePath}: Exported component should be wrapped in React.memo()`);
    }
  }

  // Check for delayRender without continueRender (potential hang)
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

// Output results
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
```

## CI Gate

Add the validator to your CI pipeline so bad compositions never deploy to Lambda:

```yaml
# .github/workflows/validate.yml
name: Validate Compositions
on:
  pull_request:
    paths: ['src/**']
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx tsx scripts/validate-composition.ts
```

## Frame Integrity Test

Before full render, verify key frames are not blank or broken:

```bash
#!/bin/bash
# scripts/test-frames.sh

COMPOSITION="MyVideo"
FRAMES=(0 30 150 300)
FAIL=0

for FRAME in "${FRAMES[@]}"; do
  npx remotion still $COMPOSITION --frame=$FRAME --scale=0.25 --output=/tmp/test-frame-$FRAME.png
  FILESIZE=$(stat -f%z /tmp/test-frame-$FRAME.png 2>/dev/null || stat -c%s /tmp/test-frame-$FRAME.png)

  if [ "$FILESIZE" -lt 1000 ]; then
    echo "FAIL: Frame $FRAME is too small ($filesize bytes) — likely blank or broken"
    FAIL=1
  else
    echo "OK: Frame $FRAME ($filesize bytes)"
  fi
done

exit $FAIL
```

## Webhook Payload Validation

Validate incoming webhook payloads at the API boundary with Zod. Never pass unvalidated data to your render queue:

```ts
const webhookSchema = z.object({
  event: z.string().min(1).max(100),
  data: z.record(z.unknown()).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Webhook data must not be empty' }
  ),
});

// In API route:
const parsed = webhookSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Validation failed', issues: parsed.error.issues },
    { status: 400 }
  );
}
```

## Composition Schema Validation

Every Remotion composition must have a Zod schema that validates its input props at runtime. This prevents render crashes from malformed webhook data:

```tsx
// CORRECT — props validated at render time
const schema = z.object({
  customerName: z.string().min(1).max(100),
  productName: z.string().min(1),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

// WRONG — no validation, crashes on bad data
const MyComponent = (props: { name: string; color: string }) => { ... };
```

Use `calculateMetadata` with Zod to validate before the first frame renders:

```tsx
const calculateMetadata = calculateMetadata(async ({ props }) => {
  const parsed = schema.parse(props); // Throws if invalid
  return { props: parsed, /* ... */ };
});
```
