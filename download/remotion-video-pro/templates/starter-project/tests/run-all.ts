// Test runner — executes all test suites and reports results
import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(__dirname);
const SUITES = ['pattern-compliance.ts', 'project-structure.ts', 'frame-integrity.ts'];

let passed = 0;
let failed = 0;
const failures: string[] = [];

console.log('=== Remotion Test Harness ===\n');

for (const suite of SUITES) {
  const suitePath = join(TEST_DIR, suite);
  if (!readdirSync(TEST_DIR).includes(suite)) {
    console.log(`SKIP: ${suite} (not found)`);
    continue;
  }

  try {
    console.log(`RUN:  ${suite}`);
    const output = execSync(`npx tsx "${suitePath}"`, {
      cwd: join(__dirname, '..'),
      encoding: 'utf-8',
      timeout: 30000,
    });
    console.log(`PASS: ${suite}`);
    if (output.trim()) console.log(`      ${output.trim()}`);
    passed++;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`FAIL: ${suite}`);
    failures.push(suite);
    failed++;
  }
}

console.log('\n=== Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length > 0) {
  console.log(`Failed suites: ${failures.join(', ')}`);
  process.exit(1);
}

console.log('All tests passed.');
