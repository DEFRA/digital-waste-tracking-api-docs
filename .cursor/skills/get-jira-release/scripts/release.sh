#!/bin/bash
# Get a single Jira release (version) by name or id
# Usage: ./release.sh VERSION [PROJECT] [format]
# Formats: full (default), json
# Project: second argument, else JIRA_PROJECT, else script default

set -e

VERSION="${1:-}"
DEFAULT_PROJECT="${JIRA_PROJECT:-DWTC}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: ./release.sh VERSION [PROJECT] [format]"
  echo "VERSION is a version name or id"
  exit 1
fi

if [[ -z "$2" || "$2" == "full" || "$2" == "json" ]]; then
  PROJECT="$DEFAULT_PROJECT"
  FORMAT="${2:-full}"
else
  PROJECT="$2"
  FORMAT="${3:-full}"
fi

USER="${ATLASSIAN_USER:-}"
if [[ -z "$USER" ]]; then
  echo "Error: ATLASSIAN_USER environment variable not set"
  exit 1
fi

if [[ -z "$ATLASSIAN_TOKEN" ]]; then
  echo "Error: ATLASSIAN_TOKEN environment variable not set"
  exit 1
fi

AUTH="$USER:$ATLASSIAN_TOKEN"
BASE_URL="${ATLASSIAN_BASE_URL:-https://eaflood.atlassian.net}"

ALL="[]"
START_AT=0
MAX_RESULTS=50

while true; do
  response=$(curl -s -u "$AUTH" \
    -H "Content-Type: application/json" \
    "$BASE_URL/rest/api/2/project/$PROJECT/version?expand=issuesstatus&startAt=$START_AT&maxResults=$MAX_RESULTS&orderBy=sequence")

  if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
    echo "$response" | jq -r '.errorMessages[]'
    exit 1
  fi

  PAGE=$(echo "$response" | jq '.values // []')
  PAGE_COUNT=$(echo "$PAGE" | jq 'length')
  ALL=$(echo "$ALL $PAGE" | jq -s 'add')

  is_last=$(echo "$response" | jq -r '.isLast // false')
  if [[ "$is_last" == "true" ]] || [[ "$PAGE_COUNT" -eq 0 ]]; then
    break
  fi

  START_AT=$((START_AT + PAGE_COUNT))
done

match=$(echo "$ALL" | jq -c --arg v "$VERSION" '[.[] | select(.id == $v or .name == $v)] | .[0] // empty')
if [[ -z "$match" || "$match" == "null" ]]; then
  echo "Error: version '$VERSION' not found in project $PROJECT"
  exit 1
fi

version_id=$(echo "$match" | jq -r '.id')

detail=$(curl -s -u "$AUTH" \
  -H "Content-Type: application/json" \
  "$BASE_URL/rest/api/2/version/$version_id")

if echo "$detail" | jq -e '.errorMessages' > /dev/null 2>&1; then
  echo "$detail" | jq -r '.errorMessages[]'
  exit 1
fi

counts=$(curl -s -u "$AUTH" \
  -H "Content-Type: application/json" \
  "$BASE_URL/rest/api/2/version/$version_id/relatedIssueCounts")

unresolved=$(curl -s -u "$AUTH" \
  -H "Content-Type: application/json" \
  "$BASE_URL/rest/api/2/version/$version_id/unresolvedIssueCount")

combined=$(jq -n \
  --argjson version "$detail" \
  --argjson listed "$match" \
  --argjson counts "$counts" \
  --argjson unresolved "$unresolved" \
  --arg project "$PROJECT" \
  '{
    project: $project,
    version: ($version + {issuesStatusForFixVersion: $listed.issuesStatusForFixVersion}),
    issueCounts: $counts,
    unresolved: $unresolved
  }')

case "$FORMAT" in
  json)
    echo "$combined"
    ;;
  full|*)
    echo "$combined" | jq -r --arg base "$BASE_URL" '
      "=== \(.version.name) ===",
      "ID: \(.version.id)",
      "Project: \(.project)",
      "Status: \(if .version.archived then "archived" elif .version.released then "released" else "unreleased" end)",
      "Released: \(if .version.released then "yes" else "no" end)",
      "Archived: \(if .version.archived then "yes" else "no" end)",
      "Start: \(.version.startDate // "—")",
      "Release date: \(.version.releaseDate // "—")",
      "Overdue: \(.version.overdue // "—")",
      "Description: \(.version.description // "—")",
      "URL: \($base)/projects/\(.project)/versions/\(.version.id)",
      "",
      "=== Issue counts ===",
      "fixVersion: \(.issueCounts.issuesFixedCount)",
      "affectedVersion: \(.issueCounts.issuesAffectedCount)",
      "unresolved: \(.unresolved.issuesUnresolvedCount)",
      "total (unresolved endpoint): \(.unresolved.issuesCount)",
      "",
      "=== Status for fix version ===",
      "To do: \(.version.issuesStatusForFixVersion.toDo // 0)",
      "In progress: \(.version.issuesStatusForFixVersion.inProgress // 0)",
      "Done: \(.version.issuesStatusForFixVersion.done // 0)",
      "Unmapped: \(.version.issuesStatusForFixVersion.unmapped // 0)"
    '
    ;;
esac
