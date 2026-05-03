#!/bin/bash
set -euo pipefail

# ── Lambda Deployment with Test Gate ──
# Runs the test harness BEFORE deploying to Lambda.
# Broken compositions never reach Lambda, preventing wasted render costs.
#
# Usage:
#   ./scripts/deploy-lambda.sh                    # Full deploy
#   ./scripts/deploy-lambda.sh --skip-tests       # Deploy without tests (emergency)
#   ./scripts/deploy-lambda.sh --functions-only   # Only deploy Lambda functions
#   ./scripts/deploy-lambda.sh --site-only        # Only create/update serve site

SKIP_TESTS=false
FUNCTIONS_ONLY=false
SITE_ONLY=false

for arg in "$@"; do
  case $arg in
    --skip-tests)    SKIP_TESTS=true ;;
    --functions-only) FUNCTIONS_ONLY=true ;;
    --site-only)      SITE_ONLY=true ;;
    --help)
      echo "Usage: $0 [--skip-tests] [--functions-only] [--site-only]"
      echo ""
      echo "  --skip-tests       Skip test harness (emergency deploys only)"
      echo "  --functions-only   Only deploy Lambda functions, skip site"
      echo "  --site-only        Only create/update serve site, skip functions"
      exit 0
      ;;
  esac
done

echo "=== Remotion Lambda Deployment ==="
echo ""

# ── Gate 1: Validate compositions ──
if [ "$SKIP_TESTS" = false ]; then
  echo "[1/4] Running composition validator..."
  if [ -f "scripts/validate-composition.ts" ]; then
    npx tsx scripts/validate-composition.ts
    echo "      Composition validation: PASSED"
  else
    echo "      No validate-composition.ts found — skipping"
  fi

  echo ""
  echo "[2/4] Running test harness..."
  if [ -f "package.json" ] && grep -q '"test"' package.json; then
    npm test 2>&1
    echo "      Test harness: PASSED"
  else
    echo "      No test script found — skipping"
  fi
else
  echo "[!] Tests skipped (--skip-tests flag)"
  echo "    Only use this for emergency deploys."
fi

echo ""

# ── Gate 2: Bundle check ──
echo "[3/4] Verifying Remotion bundle..."
BUNDLE_OUTPUT=$(npx remotion bundle src/index.ts --out-dir out/bundle 2>&1)
if [ $? -eq 0 ]; then
  BUNDLE_SIZE=$(du -sh out/bundle 2>/dev/null | cut -f1)
  echo "      Bundle size: ${BUNDLE_SIZE}"
else
  echo "      Bundle FAILED:"
  echo "$BUNDLE_OUTPUT"
  exit 1
fi

echo ""

# ── Deploy ──
if [ "$SITE_ONLY" = false ]; then
  echo "[4/4] Deploying Lambda functions..."
  npx remotion lambda functions deploy
  echo "      Lambda functions deployed."
  echo ""
fi

if [ "$FUNCTIONS_ONLY" = false ]; then
  echo "[4/4] Creating Lambda serve site..."
  npx remotion lambda sites create src/index.ts
  echo "      Serve site created/updated."
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Verify with:"
echo "  npx remotion lambda render MyVideo --frames=0-30 --concurrency=1"
