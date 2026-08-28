#!/bin/bash
# Fetch GitHub development data linked to a Jira ticket (PRs, commits, builds)
# Usage: ./github-dev.sh TICKET-ID <output_dir>
#
# Writes:
#   github.json  — raw dev-status API responses
#   github.txt   — human-readable summary

set -e

TICKET="${1:-}"
OUTPUT_DIR="${2:-}"

if [[ -z "$TICKET" || -z "$OUTPUT_DIR" ]]; then
  echo "Usage: ./github-dev.sh TICKET-ID <output_dir>"
  exit 1
fi

USER="${ATLASSIAN_USER:-}"
if [[ -z "$USER" || -z "$ATLASSIAN_TOKEN" ]]; then
  echo "Error: ATLASSIAN_USER and ATLASSIAN_TOKEN must be set"
  exit 1
fi

AUTH="$USER:$ATLASSIAN_TOKEN"
BASE_URL="${ATLASSIAN_BASE_URL:-https://eaflood.atlassian.net}"

mkdir -p "$OUTPUT_DIR"

TICKET_JSON="$OUTPUT_DIR/ticket.json"
if [[ -f "$TICKET_JSON" ]]; then
  ISSUE_ID=$(jq -r '.id' "$TICKET_JSON")
else
  ISSUE_ID=$(curl -s -u "$AUTH" \
    -H "Accept: application/json" \
    "$BASE_URL/rest/api/2/issue/$TICKET?fields=id" | jq -r '.id')
fi

if [[ -z "$ISSUE_ID" || "$ISSUE_ID" == "null" ]]; then
  echo "Error: unable to resolve issue id for $TICKET"
  exit 1
fi

fetch_dev_status() {
  local data_type="$1"
  curl -s -u "$AUTH" \
    -H "Accept: application/json" \
    "$BASE_URL/rest/dev-status/1.0/issue/details?issueId=$ISSUE_ID&applicationType=GitHub&dataType=$data_type"
}

SUMMARY=$(curl -s -u "$AUTH" \
  -H "Accept: application/json" \
  "$BASE_URL/rest/dev-status/1.0/issue/summary?issueId=$ISSUE_ID")

PR_DATA=$(fetch_dev_status "pullrequest")
REPO_DATA=$(fetch_dev_status "repository")
BUILD_DATA=$(fetch_dev_status "build")

jq -n \
  --arg ticket "$TICKET" \
  --arg issue_id "$ISSUE_ID" \
  --argjson summary "$SUMMARY" \
  --argjson pull_requests "$PR_DATA" \
  --argjson repositories "$REPO_DATA" \
  --argjson builds "$BUILD_DATA" \
  '{
    ticket: $ticket,
    issueId: $issue_id,
    fetchedAt: (now | strftime("%Y-%m-%dT%H:%M:%SZ")),
    summary: $summary,
    pullRequests: $pull_requests,
    repositories: $repositories,
    builds: $builds
  }' > "$OUTPUT_DIR/github.json"

{
  echo "=== GitHub Development for $TICKET ==="
  echo "Issue ID: $ISSUE_ID"
  echo "Fetched: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo ""

  pr_count=$(echo "$PR_DATA" | jq '[.detail[]? | .pullRequests[]?] | length')
  echo "=== Pull Requests ($pr_count) ==="
  if [[ "$pr_count" -eq 0 ]]; then
    echo "(none linked in Jira development panel)"
  else
    echo "$PR_DATA" | jq -r '.detail[]? | .pullRequests[]? |
      "\(.id)\t\(.status)\t\(.repositoryName)\t\(.name)\n  URL: \(.url)\n  Branch: \(.source.branch) -> \(.destination.branch)\n"' | column -t -s $'\t' 2>/dev/null || \
    echo "$PR_DATA" | jq -r '.detail[]? | .pullRequests[]? |
      "- \(.id) [\(.status)] \(.repositoryName): \(.name)\n  \(.url)\n  \(.source.branch) -> \(.destination.branch)\n"'
  fi

  commit_count=$(echo "$REPO_DATA" | jq '[.detail[]? | .repositories[]? | .commits[]?] | length')
  echo "=== Commits ($commit_count) ==="
  if [[ "$commit_count" -eq 0 ]]; then
    echo "(none)"
  else
    echo "$REPO_DATA" | jq -r '.detail[]? | .repositories[]? | .commits[]? |
      "- \(.displayId) [\(.author.name // "unknown")] \(.repositoryName // .url)\n  \(.message | split("\n")[0])\n  \(.url)\n"' 2>/dev/null || \
    echo "$REPO_DATA" | jq -r '.detail[]? | .repositories[]? | .commits[]? |
      "- \(.displayId): \(.message | split("\n")[0])\n  \(.url)\n"'
  fi

  echo "=== Changed files ==="
  file_count=$(echo "$REPO_DATA" | jq '[.detail[]? | .repositories[]? | .commits[]? | .files[]?] | length')
  if [[ "$file_count" -eq 0 ]]; then
    echo "(none)"
  else
    echo "$REPO_DATA" | jq -r '.detail[]? | .repositories[]? | .commits[]? | .files[]? |
      "- [\(.changeType)] \(.path)"' | sort -u
  fi

  build_count=$(echo "$BUILD_DATA" | jq '[.detail[]? | .jswddBuildsData[]? | .builds[]?] | length')
  echo ""
  echo "=== Builds / CI ($build_count) ==="
  if [[ "$build_count" -eq 0 ]]; then
    echo "(none)"
  else
    echo "$BUILD_DATA" | jq -r '.detail[]? | .jswddBuildsData[]? | .builds[]? |
      "- [\(.state)] \(.displayName) #\(.buildNumber)\n  \(.url)\n"' | head -20
    if [[ "$build_count" -gt 20 ]]; then
      echo "(showing first 20 of $build_count — see github.json for full list)"
    fi
  fi
} > "$OUTPUT_DIR/github.txt"

cat "$OUTPUT_DIR/github.txt"
