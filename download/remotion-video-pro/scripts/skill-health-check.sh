#!/bin/bash
# =============================================================================
# Skill Health Check Script for remotion-video-pro
# =============================================================================
# Verifies the integrity of all skills tracked in the manifest:
#   1. Source skills exist at expected paths in /home/z/my-project/skills/
#   2. Integration copies exist at expected paths in integration-skills/
#   3. All files have valid YAML frontmatter (at least name: and description:)
#   4. No broken links or missing files
#   5. Content integrity: source and target have reasonable sizes
#
# Usage:
#   ./skill-health-check.sh              Full health check with table output
#   ./skill-health-check.sh --json      Output results as JSON
#   ./skill-health-check.sh --fix       Attempt to fix fixable issues
#   ./skill-health-check.sh --verbose   Show detailed diagnostics
#
# Dependencies: jq (JSON parsing)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MANIFEST="$PROJECT_DIR/integration-skills/skill-manifest.json"

SOURCE_BASE="${SKILL_SOURCE_BASE:-/home/z/my-project/skills/}"
TARGET_BASE="${SKILL_TARGET_BASE:-$PROJECT_DIR/integration-skills/}"

# Thresholds
MIN_FILE_SIZE=100          # Files smaller than this are suspicious (bytes)
MAX_REASONABLE_SIZE=500000 # Files larger than this are flagged as unusually large

# Colors
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
BLUE=$'\033[0;34m'
CYAN=$'\033[0;36m'
BOLD=$'\033[1m'
DIM=$'\033[2m'
NC=$'\033[0m'

# Output mode
OUTPUT_MODE="table"
VERBOSE=false
FIX_MODE=false

# Health check results accumulator
declare -a RESULTS=()
declare -i TOTAL_CHECKS=0 PASS_COUNT=0 WARN_COUNT=0 FAIL_COUNT=0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

die() {
    echo -e "${RED}ERROR: $*${NC}" >&2
    exit 1
}

check_dependencies() {
    command -v jq >/dev/null 2>&1 || die "jq is required but not installed. Install with: sudo apt install jq"
}

validate_manifest() {
    [ -f "$MANIFEST" ] || die "Manifest not found at: $MANIFEST"
    jq empty "$MANIFEST" 2>/dev/null || die "Manifest is not valid JSON: $MANIFEST"
}

get_all_skills() {
    jq -r '
        .categories | to_entries[] |
        .key as $cat |
        .value.skills[] |
        { category: $cat, name: .name, sourcePath: .sourcePath, targetFile: .targetFile, remotionIntegrated: .remotionIntegrated } |
        @base64
    ' "$MANIFEST"
}

decode_skill() {
    echo "$1" | base64 --decode | jq -r '
        "\(.category)|\(.name)|\(.sourcePath)|\(.targetFile)|\(.remotionIntegrated)"
    '
}

# ---------------------------------------------------------------------------
# Health Check Functions
# ---------------------------------------------------------------------------

# Check 1: Source file exists
check_source_exists() {
    local name="$1" source_file="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ -f "$source_file" ]; then
        RESULTS+=("PASS|$name|source_exists|Source file exists: $source_file")
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        RESULTS+=("FAIL|$name|source_exists|Source file MISSING: $source_file")
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# Check 2: Target file exists
check_target_exists() {
    local name="$1" target_file="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ -f "$target_file" ]; then
        RESULTS+=("PASS|$name|target_exists|Target file exists: $target_file")
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        RESULTS+=("FAIL|$name|target_exists|Target file MISSING: $target_file")
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# Check 3: Source file has valid YAML frontmatter
check_source_frontmatter() {
    local name="$1" source_file="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    [ -f "$source_file" ] || {
        RESULTS+=("SKIP|$name|source_frontmatter|Skipped: source file missing")
        return 2
    }

    local first_line
    first_line=$(head -1 "$source_file" | tr -d '[:space:]')
    if [ "$first_line" != "---" ]; then
        RESULTS+=("FAIL|$name|source_frontmatter|No YAML frontmatter (missing opening ---)")
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi

    local has_name has_desc
    has_name=$(head -20 "$source_file" | grep -c "^name:" || true)
    has_desc=$(head -20 "$source_file" | grep -c "^description:" || true)

    if [ "$has_name" -ge 1 ] && [ "$has_desc" -ge 1 ]; then
        local skill_name skill_desc
        skill_name=$(head -20 "$source_file" | grep "^name:" | head -1 | sed 's/^name:[[:space:]]*//')
        skill_desc=$(head -20 "$source_file" | grep "^description:" | head -1 | sed 's/^description:[[:space:]]*//' | cut -c1-60)

        # Verify name matches expected
        if [ "$skill_name" = "$name" ]; then
            RESULTS+=("PASS|$name|source_frontmatter|Valid frontmatter: name=$skill_name")
        else
            RESULTS+=("WARN|$name|source_frontmatter|Frontmatter name '$skill_name' != manifest name '$name'")
            WARN_COUNT=$((WARN_COUNT + 1))
            return 0
        fi
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        local missing=""
        [ "$has_name" -eq 0 ] && missing="name"
        [ "$has_desc" -eq 0 ] && { [ -n "$missing" ] && missing="$missing, "; missing="${missing}description"; }
        RESULTS+=("FAIL|$name|source_frontmatter|Missing frontmatter fields: $missing")
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# Check 4: Target file has valid YAML frontmatter
check_target_frontmatter() {
    local name="$1" target_file="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    [ -f "$target_file" ] || {
        RESULTS+=("SKIP|$name|target_frontmatter|Skipped: target file missing")
        return 2
    }

    local first_line
    first_line=$(head -1 "$target_file" | tr -d '[:space:]')
    if [ "$first_line" != "---" ]; then
        RESULTS+=("FAIL|$name|target_frontmatter|No YAML frontmatter (missing opening ---)")
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi

    local has_name has_desc
    has_name=$(head -20 "$target_file" | grep -c "^name:" || true)
    has_desc=$(head -20 "$target_file" | grep -c "^description:" || true)

    if [ "$has_name" -ge 1 ] && [ "$has_desc" -ge 1 ]; then
        RESULTS+=("PASS|$name|target_frontmatter|Valid frontmatter")
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        local missing=""
        [ "$has_name" -eq 0 ] && missing="name"
        [ "$has_desc" -eq 0 ] && { [ -n "$missing" ] && missing="$missing, "; missing="${missing}description"; }
        RESULTS+=("FAIL|$name|target_frontmatter|Missing frontmatter fields: $missing")
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# Check 5: Source and target content match
check_content_match() {
    local name="$1" source_file="$2" target_file="$3"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    [ -f "$source_file" ] || { RESULTS+=("SKIP|$name|content_match|Skipped: source missing"); return 2; }
    [ -f "$target_file" ] || { RESULTS+=("SKIP|$name|content_match|Skipped: target missing"); return 2; }

    local src_hash tgt_hash
    src_hash=$(sha256sum "$source_file" 2>/dev/null | cut -d' ' -f1)
    tgt_hash=$(sha256sum "$target_file" 2>/dev/null | cut -d' ' -f1)

    if [ "$src_hash" = "$tgt_hash" ]; then
        RESULTS+=("PASS|$name|content_match|Source and target content identical")
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        RESULTS+=("WARN|$name|content_match|Source and target content DIFFER")
        WARN_COUNT=$((WARN_COUNT + 1))
        return 0
    fi
}

# Check 6: File size sanity
check_file_size() {
    local name="$1" source_file="$2" target_file="$3"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    local issues=""

    if [ -f "$source_file" ]; then
        local src_size
        src_size=$(wc -c < "$source_file" | tr -d ' ')
        if [ "$src_size" -lt "$MIN_FILE_SIZE" ]; then
            issues="${issues}source unusually small (${src_size}B); "
        fi
        if [ "$src_size" -gt "$MAX_REASONABLE_SIZE" ]; then
            issues="${issues}source unusually large (${src_size}B); "
        fi
    fi

    if [ -f "$target_file" ]; then
        local tgt_size
        tgt_size=$(wc -c < "$target_file" | tr -d ' ')
        if [ "$tgt_size" -lt "$MIN_FILE_SIZE" ]; then
            issues="${issues}target unusually small (${tgt_size}B); "
        fi
        if [ "$tgt_size" -gt "$MAX_REASONABLE_SIZE" ]; then
            issues="${issues}target unusually large (${tgt_size}B); "
        fi
    fi

    if [ -z "$issues" ]; then
        RESULTS+=("PASS|$name|file_size|File sizes within normal range")
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        RESULTS+=("WARN|$name|file_size|${issues%  }")
        WARN_COUNT=$((WARN_COUNT + 1))
    fi
}

# Check 7: Frontmatter name consistency between source and target
check_frontmatter_consistency() {
    local name="$1" source_file="$2" target_file="$3"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    [ -f "$source_file" ] || { RESULTS+=("SKIP|$name|fm_consistency|Skipped: source missing"); return 2; }
    [ -f "$target_file" ] || { RESULTS+=("SKIP|$name|fm_consistency|Skipped: target missing"); return 2; }

    local src_name tgt_name src_desc tgt_desc
    src_name=$(head -20 "$source_file" | grep "^name:" | head -1 | sed 's/^name:[[:space:]]*//' || echo "")
    tgt_name=$(head -20 "$target_file" | grep "^name:" | head -1 | sed 's/^name:[[:space:]]*//' || echo "")

    if [ -z "$src_name" ] || [ -z "$tgt_name" ]; then
        RESULTS+=("SKIP|$name|fm_consistency|Skipped: frontmatter missing name field")
        return 2
    fi

    if [ "$src_name" = "$tgt_name" ]; then
        RESULTS+=("PASS|$name|fm_consistency|Frontmatter names match: $src_name")
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        RESULTS+=("WARN|$name|fm_consistency|Frontmatter name mismatch: source='$src_name' target='$tgt_name'")
        WARN_COUNT=$((WARN_COUNT + 1))
    fi
}

# Check 8: Manifest integrity — verify all files referenced in manifest exist
check_manifest_paths() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # Check source and target base directories exist
    local dir_issues=""
    [ -d "$SOURCE_BASE" ] || dir_issues="${dir_issues}Source base missing: $SOURCE_BASE; "
    [ -d "$TARGET_BASE" ] || dir_issues="${dir_issues}Target base missing: $TARGET_BASE; "

    if [ -n "$dir_issues" ]; then
        RESULTS+=("FAIL|_manifest|paths|${dir_issues%  }")
        FAIL_COUNT=$((FAIL_COUNT + 1))
    else
        RESULTS+=("PASS|_manifest|paths|Base directories exist")
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
}

# Check 9: Pipeline route skill references are valid
check_pipeline_routes() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # Collect all skill names from manifest
    local all_skills
    all_skills=$(jq -r '[.categories[].skills[].name] | join(" ")' "$MANIFEST")

    local route_issues=""
    local route_count
    route_count=$(jq '.pipelineRoutes | keys | length' "$MANIFEST")

    for route_name in $(jq -r '.pipelineRoutes | keys[]' "$MANIFEST"); do
        for skill in $(jq -r ".pipelineRoutes[\"$route_name\"].requiredSkills[]" "$MANIFEST"); do
            # Check if skill is a known manifest skill or an external one
            if ! echo "$all_skills" | grep -qw "$skill"; then
                route_issues="${route_issues}Route '$route_name' references unknown skill '$skill'; "
            fi
        done
    done

    if [ -n "$route_issues" ]; then
        RESULTS+=("WARN|_manifest|pipeline_routes|${route_issues%  }")
        WARN_COUNT=$((WARN_COUNT + 1))
    else
        RESULTS+=("PASS|_manifest|pipeline_routes|All $route_count pipeline route references are valid")
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
}

# Check 10: Category directories exist for all categories in manifest
check_category_dirs() {
    local categories
    categories=$(jq -r '.categories | keys[]' "$MANIFEST")

    for cat in $categories; do
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        local cat_dir="$TARGET_BASE$cat"
        if [ -d "$cat_dir" ]; then
            RESULTS+=("PASS|_manifest|category_dir|Category directory exists: $cat")
            PASS_COUNT=$((PASS_COUNT + 1))
        else
            RESULTS+=("FAIL|_manifest|category_dir|Category directory MISSING: $cat_dir")
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    done
}

# ---------------------------------------------------------------------------
# Fix mode
# ---------------------------------------------------------------------------

attempt_fix() {
    info "Attempting to fix fixable issues..."
    local fixes_applied=0

    # Fix 1: Create missing target directories
    local categories
    categories=$(jq -r '.categories | keys[]' "$MANIFEST")
    for cat in $categories; do
        local cat_dir="$TARGET_BASE$cat"
        if [ ! -d "$cat_dir" ]; then
            mkdir -p "$cat_dir"
            success "  [FIXED] Created missing directory: $cat_dir"
            fixes_applied=$((fixes_applied + 1))
        fi
    done

    # Fix 2: Copy missing target files from source
    while IFS= read -r encoded; do
        IFS='|' read -r category name source_rel target_file integrated <<< "$(decode_skill "$encoded")"

        local source_file="$SOURCE_BASE$source_rel"
        local full_target="$TARGET_BASE$category/$target_file"

        if [ -f "$source_file" ] && [ ! -f "$full_target" ]; then
            mkdir -p "$(dirname "$full_target")"
            cp "$source_file" "$full_target"
            success "  [FIXED] Copied missing target: $category/$target_file"
            fixes_applied=$((fixes_applied + 1))
        fi
    done < <(get_all_skills)

    echo ""
    if [ "$fixes_applied" -gt 0 ]; then
        success "Applied $fixes_applied fixes. Re-run health check to verify."
    else
        info "No fixable issues found."
    fi
}

# ---------------------------------------------------------------------------
# Output Functions
# ---------------------------------------------------------------------------

output_table() {
    heading "SKILL HEALTH CHECK REPORT"
    info "Manifest: $MANIFEST"
    info "Source:   $SOURCE_BASE"
    info "Target:   $TARGET_BASE"
    echo ""

    # Group results by skill
    local current_skill=""
    local current_category=""

    # First show manifest-level checks
    for result in "${RESULTS[@]}"; do
        IFS='|' read -r status name check msg <<< "$result"
        if [[ "$name" == "_manifest"* ]]; then
            local icon status_color
            case "$status" in
                PASS) icon="✓"; status_color="$GREEN" ;;
                FAIL) icon="✗"; status_color="$RED" ;;
                WARN) icon="⚠"; status_color="$YELLOW" ;;
                SKIP) icon="○"; status_color="$DIM" ;;
            esac
            echo -e "  ${status_color}${icon}${NC} [${DIM}${check}${NC}] ${msg}"
        fi
    done

    echo ""
    heading "SKILL-BY-SKILL RESULTS"

    # Separator line
    printf "  ${DIM}%-30s %-22s %s${NC}\n" "SKILL" "CHECK" "DETAILS"
    printf "  ${DIM}%.0s─" $(seq 1 85)
    echo ""

    while IFS= read -r encoded; do
        IFS='|' read -r category name source_rel target_file integrated <<< "$(decode_skill "$encoded")"

        local source_file="$SOURCE_BASE$source_rel"
        local full_target="$TARGET_BASE$category/$target_file"

        # Print skill header
        local integrated_marker
        [ "$integrated" = "true" ] && integrated_marker="${GREEN}●${NC}" || integrated_marker="${DIM}○${NC}"
        printf "  ${BOLD}${CYAN}%-30s${NC} ${integrated_marker}\n" "$category/$name"

        # Print all results for this skill
        for result in "${RESULTS[@]}"; do
            IFS='|' read -r status rname check msg <<< "$result"
            if [ "$rname" = "$name" ]; then
                local icon status_color
                case "$status" in
                    PASS) icon="  ✓"; status_color="$GREEN" ;;
                    FAIL) icon="  ✗"; status_color="$RED" ;;
                    WARN) icon="  ⚠"; status_color="$YELLOW" ;;
                    SKIP) icon="  ○"; status_color="$DIM" ;;
                esac

                if [ "$VERBOSE" = true ] || [ "$status" != "PASS" ]; then
                    echo -e "    ${status_color}${icon}${NC} ${DIM}${check}${NC}  ${msg}"
                fi
            fi
        done
        echo ""

    done < <(get_all_skills)

    # Summary
    echo ""
    heading "HEALTH SUMMARY"
    local health_pct=0
    if [ "$TOTAL_CHECKS" -gt 0 ]; then
        health_pct=$(( (PASS_COUNT * 100) / TOTAL_CHECKS ))
    fi

    echo -e "  Total checks:  ${BOLD}$TOTAL_CHECKS${NC}"
    echo -e "  Passed:        ${GREEN}$PASS_COUNT${NC}"
    echo -e "  Warnings:      ${YELLOW}$WARN_COUNT${NC}"
    echo -e "  Failed:        ${RED}$FAIL_COUNT${NC}"
    echo -e "  Skipped:       ${DIM}$((TOTAL_CHECKS - PASS_COUNT - WARN_COUNT - FAIL_COUNT))${NC}"

    echo ""
    echo -n "  Health Score:  "
    if [ "$health_pct" -ge 90 ]; then
        echo -e "${GREEN}${BOLD}${health_pct}%${NC} ${GREEN}✓ Healthy${NC}"
    elif [ "$health_pct" -ge 70 ]; then
        echo -e "${YELLOW}${BOLD}${health_pct}%${NC} ${YELLOW}⚠ Needs Attention${NC}"
    else
        echo -e "${RED}${BOLD}${health_pct}%${NC} ${RED}✗ Unhealthy${NC}"
    fi

    # Quick action suggestions
    if [ "$WARN_COUNT" -gt 0 ] || [ "$FAIL_COUNT" -gt 0 ]; then
        echo ""
        info "Suggestions:"
        [ "$WARN_COUNT" -gt 0 ] && echo -e "    ${DIM}• Run './scripts/sync-skills.sh --check' to see out-of-sync details${NC}"
        [ "$WARN_COUNT" -gt 0 ] && echo -e "    ${DIM}• Run './scripts/sync-skills.sh --sync' to sync source → target${NC}"
        [ "$FAIL_COUNT" -gt 0 ] && echo -e "    ${DIM}• Run './scripts/skill-health-check.sh --fix' to auto-fix missing files${NC}"
    fi
    echo ""
}

output_json() {
    # Build checks array via a temp file to avoid shell quoting issues
    local checks_file
    checks_file=$(mktemp)
    echo '[' > "$checks_file"
    local first=true
    for result in "${RESULTS[@]}"; do
        IFS='|' read -r status name check msg <<< "$result"
        [ "$first" = true ] && first=false || echo ',' >> "$checks_file"
        # Escape double-quotes in message for JSON safety
        local escaped_msg escaped_name escaped_check
        escaped_name=$(echo "$name" | sed 's/"/\\"/g')
        escaped_check=$(echo "$check" | sed 's/"/\\"/g')
        escaped_msg=$(echo "$msg" | sed 's/"/\\"/g' | sed 's/\\/\\\\/g')
        printf '    {"skill":"%s","check":"%s","status":"%s","message":"%s"}' \
            "$escaped_name" "$escaped_check" "$status" "$escaped_msg" >> "$checks_file"
    done
    printf '\n  ]' >> "$checks_file"

    local health_pct=0
    if [ "$TOTAL_CHECKS" -gt 0 ]; then
        health_pct=$(( (PASS_COUNT * 100) / TOTAL_CHECKS ))
    fi

    local skipped=$((TOTAL_CHECKS - PASS_COUNT - WARN_COUNT - FAIL_COUNT))

    jq -n \
        --arg manifest "$MANIFEST" \
        --arg source "$SOURCE_BASE" \
        --arg target "$TARGET_BASE" \
        --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --argjson total "$TOTAL_CHECKS" \
        --argjson passed "$PASS_COUNT" \
        --argjson warnings "$WARN_COUNT" \
        --argjson failed "$FAIL_COUNT" \
        --argjson skipped "$skipped" \
        --argjson healthPct "$health_pct" \
        --slurpfile checks "$checks_file" \
        '{
            manifest: $manifest,
            sourceBase: $source,
            targetBase: $target,
            timestamp: $timestamp,
            summary: {
                total: $total,
                passed: $passed,
                warnings: $warnings,
                failed: $failed,
                skipped: $skipped,
                healthPercent: $healthPct,
                status: (if $healthPct >= 90 then "healthy"
                         elif $healthPct >= 70 then "needs_attention"
                         else "unhealthy" end)
            },
            checks: $checks[0]
        }'

    rm -f "$checks_file"
}

heading() {
    echo ""
    echo -e "${BOLD}${CYAN}$*${NC}"
    echo -e "${DIM}$(printf '%.0s─' $(seq 1 72))${NC}"
}

info() { echo -e "${BLUE}$*${NC}"; }
success() { echo -e "${GREEN}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
${BOLD}Skill Health Check${NC} — Verify integrity of integration skills

${BOLD}USAGE:${NC}
  $(basename "$0") [OPTIONS]

${BOLD}OPTIONS:${NC}
  (no options)              Run health check with table output
  --json                    Output results as JSON
  --fix                     Attempt to fix fixable issues (missing dirs/files)
  --verbose                 Show all checks including passing ones
  -h, --help                Show this help message

${BOLD}WHAT IT CHECKS:${NC}
  1. Source files exist at expected paths
  2. Target (integration copy) files exist
  3. Source files have valid YAML frontmatter (name + description)
  4. Target files have valid YAML frontmatter
  5. Source and target content match
  6. File sizes are within reasonable range
  7. Frontmatter names are consistent between source and target
  8. Manifest base paths are valid directories
  9. Pipeline route skill references are valid
  10. Category directories exist for all manifest categories

${BOLD}EXAMPLES:${NC}
  $(basename "$0")                   # Standard health check
  $(basename "$0") --verbose         # Show all results (including passes)
  $(basename "$0") --json            # Machine-readable JSON output
  $(basename "$0") --fix             # Auto-fix missing directories and files
EOF
    exit 0
}

main() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --json)      OUTPUT_MODE="json"; shift ;;
            --verbose)   VERBOSE=true; shift ;;
            --fix)       FIX_MODE=true; shift ;;
            -h|--help)   usage ;;
            *)           die "Unknown option: $1. Use --help for usage." ;;
        esac
    done

    check_dependencies
    validate_manifest

    # Run fix mode first if requested
    if [ "$FIX_MODE" = true ]; then
        attempt_fix
        # Reset counters after fix
        RESULTS=()
        TOTAL_CHECKS=0 PASS_COUNT=0 WARN_COUNT=0 FAIL_COUNT=0
    fi

    # Run manifest-level checks
    check_manifest_paths
    check_pipeline_routes
    check_category_dirs

    # Run skill-level checks
    while IFS= read -r encoded; do
        IFS='|' read -r category name source_rel target_file integrated <<< "$(decode_skill "$encoded")"

        local source_file="$SOURCE_BASE$source_rel"
        local full_target="$TARGET_BASE$category/$target_file"

        check_source_exists "$name" "$source_file" || true
        check_target_exists "$name" "$full_target" || true
        check_source_frontmatter "$name" "$source_file" || true
        check_target_frontmatter "$name" "$full_target" || true
        check_content_match "$name" "$source_file" "$full_target" || true
        check_file_size "$name" "$source_file" "$full_target" || true
        check_frontmatter_consistency "$name" "$source_file" "$full_target" || true

    done < <(get_all_skills)

    # Output results
    case "$OUTPUT_MODE" in
        table) output_table ;;
        json)  output_json ;;
    esac

    # Exit with non-zero if there are failures
    if [ "$FAIL_COUNT" -gt 0 ]; then
        exit 1
    fi
}

main "$@"
