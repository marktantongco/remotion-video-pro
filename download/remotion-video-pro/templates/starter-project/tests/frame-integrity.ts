// Frame integrity tests
// Verify that rendered frames are not blank, corrupted, or too small
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

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

// Check if remotion CLI is available
function remotionAvailable(): boolean {
  try {
    execSync('npx remotion --version', { encoding: 'utf-8', timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

console.log('\n[Frame Integrity]');

if (!remotionAvailable()) {
  console.log('  SKIP: remotion CLI not available — frame tests require remotion to be installed');
  console.log('  Install dependencies with "npm install" then re-run');
  process.exit(0);
}

const COMPOSITION = 'MainVideo';
const FRAMES = [0, 30, 150, 300];
const MIN_FRAME_SIZE = 2000; // bytes — anything smaller is likely blank
const TMP_DIR = join(ROOT, '.test-frames');

test('Remotion still command works for single frame', () => {
  try {
    execSync(
      `npx remotion still ${COMPOSITION} --frame=0 --scale=0.25 --output="${TMP_DIR}/test-frame-0.png"`,
      { encoding: 'utf-8', timeout: 60000 }
    );
    return existsSync(join(TMP_DIR, 'test-frame-0.png')) || 'Frame file not created';
  } catch (err) {
    return err instanceof Error ? err.message : 'Still command failed';
  }
});

// Generate all test frames
try {
  execSync(`mkdir -p "${TMP_DIR}"`, { encoding: 'utf-8' });
  for (const frame of FRAMES) {
    try {
      execSync(
        `npx remotion still ${COMPOSITION} --frame=${frame} --scale=0.25 --output="${TMP_DIR}/frame-${frame}.png"`,
        { encoding: 'utf-8', timeout: 60000 }
      );
    } catch {
      // Frame may be out of range — that's okay
    }
  }
} catch {
  // Directory creation failed
}

for (const frame of FRAMES) {
  const framePath = join(TMP_DIR, `frame-${frame}.png`);

  test(`Frame ${frame} is not blank (exists and > ${MIN_FRAME_SIZE} bytes)`, () => {
    if (!existsSync(framePath)) {
      // Frame may be out of composition range
      return `Frame ${frame} was not rendered (may be beyond composition duration)`;
    }
    const stat = require('fs').statSync(framePath);
    if (stat.size < MIN_FRAME_SIZE) {
      return `Frame ${frame} is only ${stat.size} bytes — likely blank or corrupt`;
    }
    return true;
  });
}

test('First frame is not too small (rules out black first frame bug)', () => {
  const firstFramePath = join(TMP_DIR, 'frame-0.png');
  if (!existsSync(firstFramePath)) return 'Frame 0 was not rendered';
  const stat = require('fs').statSync(firstFramePath);
  // Very first frame is often larger due to full scene render
  return stat.size > 5000 ? true : `Frame 0 is only ${stat.size} bytes — may be black`;
});

console.log(`\n--- Frame Tests: ${testsRun - testsFailed}/${testsRun} passed ---`);
if (testsFailed > 0) process.exit(1);
