#!/bin/bash
# =============================================================================
# Skill Sync Script for remotion-video-pro
# =============================================================================
# Synchronizes integration-skill copies with their source-of-truth SKILL.md files.
# Reads the skill-manifest.json to discover all tracked skills and their mappings.
#
# Usage:
#   ./sync-skills.sh --check      Dry-run: report which files are out of sync
#   ./sync-skills.sh --sync       Copy source → target for all out-of-sync files
#   ./sync-skills.sh --status     Print a summary table of all skills
#   ./sync-skills.sh --skill NAME Operate on a single skill by name
#   ./sync-skills.sh --diff NAME  Show diff between source and target for a skill
#   ./sync-skills.sh --update-timestamps Update manifest lastSync to now
#
# Dependencies: jq (JSON parsing), diff (optional, for --diff)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MANIFEST="$PROJECT_DIR/integration-skills/skill-manifest.json"

# Allow override via environment variables
SOURCE_BASE="${SKILL_SOURCE_BASE:-/home/z/my-project/skills/}"
TARGET_BASE="${SKILL_TARGET_BASE:-$PROJECT_DIR/integration-skills/}"

# Colors
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
BLUE=$'\033[0;34m'
CYAN=$'\033[0;36m'
BOLD=$'\033[1m'
DIM=$'\033[2m'
NC=$'\033[0m'  # No Color

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

die() {
    echo -e "${RED}ERROR: $*${NC}" >&2
    exit 1
}

info() {
    echo -e "${BLUE}$*${NC}"
}

success() {
    echo -e "${GREEN}$*${NC}"
}

warn() {
    echo -e "${YELLOW}$*${NC}"
}

heading() {
    echo ""
    echo -e "${BOLD}${CYAN}$*${NC}"
    echo -e "${DIM}$(printf '%.0s─' $(seq 1 72))${NC}"
}

check_dependencies() {
    command -v jq >/dev/null 2>&1 || die "jq is required but not installed. Install with: sudo apt install jq"
}

validate_manifest() {
    [ -f "$MANIFEST" ] || die "Manifest not found at: $MANIFEST"
    jq empty "$MANIFEST" 2>/dev/null || die "Manifest is not valid JSON: $MANIFEST"
}

# Extract all skills from manifest into a stream of JSON objects
get_all_skills() {
    jq -r '
        .categories | to_entries[] |
        .key as $cat |
        .value.skills[] |
        { category: $cat, name: .name, sourcePath: .sourcePath, targetFile: .targetFile, remotionIntegrated: .remotionIntegrated } |
        @base64
    ' "$MANIFEST"
}

# Decode a base64-encoded JSON object from get_all_skills
decode_skill() {
    echo "$1" | base64 --decode | jq -r '
        "\(.category)|\(.name)|\(.sourcePath)|\(.targetFile)|\(.remotionIntegrated)"
    '
}

# Get modification timestamp (epoch seconds) of a file, or 0 if missing
get_mtime() {
    local f="$1"
    if [ -f "$f" ]; then
        stat -c '%Y' "$f" 2>/dev/null || stat -f '%m' "$f" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Get file size in bytes, or 0 if missing
get_size() {
    local f="$1"
    if [ -f "$f" ]; then
        wc -c < "$f" | tr -d ' '
    else
        echo "0"
    fi
}

# Get SHA-256 checksum of file content, or "MISSING" if file doesn't exist
get_hash() {
    local f="$1"
    if [ -f "$f" ]; then
        sha256sum "$f" 2>/dev/null | cut -d' ' -f1
    else
        echo "MISSING"
    fi
}

# Format a human-readable date from epoch
format_date() {
    local epoch="$1"
    if command -v date >/dev/null 2>&1; then
        date -d "@$epoch" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || \
        date -r "$epoch" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || \
        echo "unknown"
    else
        echo "unknown"
    fi
}

# ---------------------------------------------------------------------------
# Modes
# ---------------------------------------------------------------------------

do_status() {
    heading "SKILL SYNC STATUS"
    info "Source:  $SOURCE_BASE"
    info "Target:  $TARGET_BASE"
    info "Manifest: $MANIFEST"
    echo ""

    local total=0 synced=0 out_of_sync=0 source_missing=0 target_missing=0
    local category=""

    while IFS= read -r encoded; do
        IFS='|' read -r category name source_rel target_file integrated <<< "$(decode_skill "$encoded")"

        local source_file="$SOURCE_BASE$source_rel"
        local target_file="$TARGET_BASE$category/$target_file"

        total=$((total + 1))

        local source_exists="✓"
        local target_exists="✓"
        local sync_status="${GREEN}SYNCED${NC}"
        local integrated_str=""

        [ -f "$source_file" ] || { source_exists="${RED}✗${NC}"; source_missing=$((source_missing + 1)); }
        [ -f "$target_file" ] || { target_exists="${RED}✗${NC}"; target_missing=$((target_missing + 1)); }

        if [ -f "$source_file" ] && [ -f "$target_file" ]; then
            local src_hash tgt_hash
            src_hash=$(get_hash "$source_file")
            tgt_hash=$(get_hash "$target_file")
            if [ "$src_hash" != "$tgt_hash" ]; then
                sync_status="${YELLOW}OUT-OF-SYNC${NC}"
                out_of_sync=$((out_of_sync + 1))
            else
                synced=$((synced + 1))
            fi
        fi

        [ "$integrated" = "true" ] && integrated_str="${GREEN}✓${NC}" || integrated_str="${DIM}○${NC}"

        printf "  %-28s %-30s  SRC %-3s  TGT %-3s  %b  INT %b\n" \
            "$category" "$name" "$source_exists" "$target_exists" "$sync_status" "$integrated_str"

    done < <(get_all_skills)

    echo ""
    heading "SUMMARY"
    echo -e "  Total skills:          ${BOLD}$total${NC}"
    echo -e "  Synced:               ${GREEN}$synced${NC}"
    echo -e "  Out of sync:          ${YELLOW}$out_of_sync${NC}"
    echo -e "  Source files missing: ${RED}$source_missing${NC}"
    echo -e "  Target files missing: ${RED}$target_missing${NC}"
    echo ""

    # Pipeline routes summary
    local route_count
    route_count=$(jq '.pipelineRoutes | keys | length' "$MANIFEST")
    info "Pipeline routes defined: $route_count"
    jq -r '.pipelineRoutes | to_entries[] | "  • \(.key): \(.value.description)"' "$MANIFEST"
    echo ""
}

do_check() {
    heading "SYNC CHECK (DRY RUN)"
    info "Comparing source → target for all skills in manifest..."
    echo ""

    local found_any=0
    local category="" skill_name=""

    while IFS= read -r encoded; do
        IFS='|' read -r category skill_name source_rel target_file integrated <<< "$(decode_skill "$encoded")"

        local source_file="$SOURCE_BASE$source_rel"
        local target_file="$TARGET_BASE$category/$target_file"

        if [ ! -f "$source_file" ]; then
            warn "  [MISSING SOURCE] $category/$skill_name → $source_file"
            found_any=1
            continue
        fi

        if [ ! -f "$target_file" ]; then
            warn "  [MISSING TARGET] $category/$skill_name → $target_file"
            found_any=1
            continue
        fi

        local src_hash tgt_hash src_mtime tgt_mtime
        src_hash=$(get_hash "$source_file")
        tgt_hash=$(get_hash "$target_file")
        src_mtime=$(get_mtime "$source_file")
        tgt_mtime=$(get_mtime "$target_file")

        if [ "$src_hash" != "$tgt_hash" ]; then
            found_any=1
            local src_date tgt_date src_size tgt_size
            src_date=$(format_date "$src_mtime")
            tgt_date=$(format_date "$tgt_mtime")
            src_size=$(get_size "$source_file")
            tgt_size=$(get_size "$target_file")
            echo -e "  ${YELLOW}[OUT-OF-SYNC]${NC} $category/$skill_name"
            echo -e "    Source: $src_date ($src_size bytes)"
            echo -e "    Target: $tgt_date ($tgt_size bytes)"
            echo -e "    Source SHA: ${src_hash:0:16}..."
            echo -e "    Target SHA: ${tgt_hash:0:16}..."
        fi

    done < <(get_all_skills)

    if [ "$found_any" -eq 0 ]; then
        success "  All skills are in sync. No action needed."
    fi
    echo ""
}

do_sync() {
    heading "SYNCING SKILLS"
    info "Copying source → target for out-of-sync skills..."
    echo ""

    local synced_count=0 skipped_count=0 error_count=0
    local category="" skill_name=""

    while IFS= read -r encoded; do
        IFS='|' read -r category skill_name source_rel target_file integrated <<< "$(decode_skill "$encoded")"

        local source_file="$SOURCE_BASE$source_rel"
        local target_file="$TARGET_BASE$category/$target_file"

        if [ ! -f "$source_file" ]; then
            warn "  [SKIP] $skill_name — source missing: $source_file"
            skipped_count=$((skipped_count + 1))
            continue
        fi

        # Ensure target directory exists
        local target_dir
        target_dir=$(dirname "$target_file")
        mkdir -p "$target_dir"

        if [ ! -f "$target_file" ]; then
            # Target doesn't exist yet — create it
            cp "$source_file" "$target_file"
            success "  [CREATED] $category/$skill_name → $target_file"
            synced_count=$((synced_count + 1))
            continue
        fi

        # Both exist — check if they differ
        local src_hash tgt_hash
        src_hash=$(get_hash "$source_file")
        tgt_hash=$(get_hash "$target_file")

        if [ "$src_hash" = "$tgt_hash" ]; then
            echo -e "  ${DIM}[ALREADY SYNCED]${NC} $category/$skill_name"
            continue
        fi

        # Backup the target before overwriting
        local backup_file="${target_file}.bak"
        cp "$target_file" "$backup_file"

        # Copy source to target
        if cp "$source_file" "$target_file"; then
            success "  [SYNCED] $category/$skill_name (backup: ${backup_file})"
            synced_count=$((synced_count + 1))
        else
            echo -e "  ${RED}[ERROR]${NC} Failed to copy $skill_name"
            error_count=$((error_count + 1))
            # Restore from backup
            mv "$backup_file" "$target_file" 2>/dev/null || true
        fi

    done < <(get_all_skills)

    # Update manifest timestamp
    if [ "$synced_count" -gt 0 ]; then
        local now
        now=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
        local tmp_manifest
        tmp_manifest=$(mktemp)
        jq --arg now "$now" '.lastSync = $now' "$MANIFEST" > "$tmp_manifest" && \
            mv "$tmp_manifest" "$MANIFEST"
        info "  Manifest lastSync updated to: $now"
    fi

    echo ""
    heading "SYNC COMPLETE"
    echo -e "  Synced:        ${GREEN}$synced_count${NC}"
    echo -e "  Already up to date: ${DIM}(not counted)${NC}"
    echo -e "  Skipped:       ${YELLOW}$skipped_count${NC}"
    echo -e "  Errors:        ${RED}$error_count${NC}"
    echo ""
}

do_diff() {
    local skill_name="${1:-}"
    [ -z "$skill_name" ] && die "Usage: $0 --diff SKILL_NAME"

    # Find the skill in the manifest
    local encoded
    encoded=$(get_all_skills | while IFS= read -r enc; do
        decoded=$(echo "$enc" | base64 --decode)
        name=$(echo "$decoded" | jq -r '.name')
        if [ "$name" = "$skill_name" ]; then
            echo "$enc"
            break
        fi
    done)

    [ -z "$encoded" ] && die "Skill '$skill_name' not found in manifest"

    IFS='|' read -r category name source_rel target_file integrated <<< "$(decode_skill "$encoded")"

    local source_file="$SOURCE_BASE$source_rel"
    local target_file="$TARGET_BASE$category/$target_file"

    heading "DIFF: $category/$skill_name"

    if [ ! -f "$source_file" ]; then
        die "Source file not found: $source_file"
    fi
    if [ ! -f "$target_file" ]; then
        die "Target file not found: $target_file"
    fi

    command -v diff >/dev/null 2>&1 || die "diff command not found"

    echo -e "  Source: $source_file"
    echo -e "  Target: $target_file"
    echo ""

    if diff -u "$target_file" "$source_file"; then
        success "  Files are identical."
    else
        local diff_code=$?
        if [ $diff_code -eq 1 ]; then
            warn "  Files differ (see diff above: target ← source)."
        fi
    fi
    echo ""
}

do_single_skill() {
    local skill_name="${1:-}"
    [ -z "$skill_name" ] && die "Usage: $0 --skill SKILL_NAME [--check|--sync]"
    local action="${2:---check}"

    local encoded
    encoded=$(get_all_skills | while IFS= read -r enc; do
        decoded=$(echo "$enc" | base64 --decode)
        name=$(echo "$decoded" | jq -r '.name')
        if [ "$name" = "$skill_name" ]; then
            echo "$enc"
            break
        fi
    done)

    [ -z "$encoded" ] && die "Skill '$skill_name' not found in manifest"

    IFS='|' read -r category name source_rel target_file integrated <<< "$(decode_skill "$encoded")"

    local source_file="$SOURCE_BASE$source_rel"
    local target_file="$TARGET_BASE$category/$target_file"

    info "Skill: $category/$name"
    info "Source: $source_file"
    info "Target: $target_file"
    info "Integrated: $integrated"
    echo ""

    if [ "$action" = "--sync" ]; then
        if [ ! -f "$source_file" ]; then
            die "Source file not found: $source_file"
        fi
        mkdir -p "$(dirname "$target_file")"
        cp "$source_file" "$target_file"
        success "  Synced $name from source → target"
    elif [ "$action" = "--check" ]; then
        if [ ! -f "$source_file" ]; then
            warn "  Source missing: $source_file"
        elif [ ! -f "$target_file" ]; then
            warn "  Target missing: $target_file"
        else
            local src_hash tgt_hash
            src_hash=$(get_hash "$source_file")
            tgt_hash=$(get_hash "$target_file")
            if [ "$src_hash" = "$tgt_hash" ]; then
                success "  Synced (identical content)"
            else
                warn "  OUT-OF-SYNC"
                echo -e "    Source SHA: ${src_hash:0:16}..."
                echo -e "    Target SHA: ${tgt_hash:0:16}..."
            fi
        fi
    fi
    echo ""
}

do_update_timestamps() {
    local now
    now=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    local tmp_manifest
    tmp_manifest=$(mktemp)
    jq --arg now "$now" '.lastSync = $now' "$MANIFEST" > "$tmp_manifest" && \
        mv "$tmp_manifest" "$MANIFEST"
    success "Manifest lastSync updated to: $now"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
${BOLD}Skill Sync Script${NC} — remotion-video-pro integration skills management

${BOLD}USAGE:${NC}
  $(basename "$0") [OPTIONS]

${BOLD}OPTIONS:${NC}
  --check                  Dry-run: report out-of-sync skills
  --sync                   Copy source → target for all out-of-sync files
  --status                 Show status summary table for all skills
  --skill NAME             Operate on a single skill (add --check or --sync)
  --diff NAME              Show diff between source and target for a skill
  --update-timestamps      Update manifest lastSync to current time
  -h, --help               Show this help message

${BOLD}ENVIRONMENT VARIABLES:${NC}
  SKILL_SOURCE_BASE        Override source skills path
                           (default: /home/z/my-project/skills/)
  SKILL_TARGET_BASE        Override integration-skills path
                           (default: <project>/integration-skills/)

${BOLD}EXAMPLES:${NC}
  $(basename "$0") --check              # See what's out of sync
  $(basename "$0") --sync               # Sync everything
  $(basename "$0") --skill LLM --check  # Check a single skill
  $(basename "$0") --diff spider        # Show diff for spider skill
EOF
    exit 0
}

main() {
    local mode=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --check)
                mode="check"
                shift
                ;;
            --sync)
                mode="sync"
                shift
                ;;
            --status)
                mode="status"
                shift
                ;;
            --diff)
                mode="diff"
                shift
                do_diff "${1:-}"
                return
                ;;
            --skill)
                mode="skill"
                shift
                do_single_skill "$@"
                return
                ;;
            --update-timestamps)
                mode="update-timestamps"
                shift
                ;;
            -h|--help)
                usage
                ;;
            *)
                die "Unknown option: $1. Use --help for usage."
                ;;
        esac
    done

    # Default to status if no mode specified
    [ -z "$mode" ] && mode="status"

    check_dependencies
    validate_manifest

    case "$mode" in
        check)     do_check ;;
        sync)      do_sync ;;
        status)    do_status ;;
        diff)      die "Internal error: diff should have been handled above" ;;
        skill)     die "Internal error: skill should have been handled above" ;;
        update-timestamps) do_update_timestamps ;;
    esac
}

main "$@"
