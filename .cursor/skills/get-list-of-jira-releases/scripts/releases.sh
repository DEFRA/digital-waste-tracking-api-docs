#!/bin/bash
# List Jira project releases (versions)
# Usage: ./releases.sh [PROJECT] [format]
# Formats: list (default), json
# Project: first argument, else JIRA_PROJECT, else script default

set -e

DEFAULT_PROJECT="${JIRA_PROJECT:-DWTC}"

if [[ $# -eq 0 ]]; then
  PROJECT="$DEFAULT_PROJECT"
  FORMAT="list"
elif [[ "$1" == "list" || "$1" == "json" ]]; then
  PROJECT="$DEFAULT_PROJECT"
  FORMAT="$1"
else
  PROJECT="$1"
  FORMAT="${2:-list}"
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

case "$FORMAT" in
  json)
    echo "$ALL" | jq --arg project "$PROJECT" '{project: $project, total: (. | length), releases: .}'
    ;;
  list|*)
    echo "=== Releases for $PROJECT ==="
    echo "$BASE_URL/projects/$PROJECT?selectedItem=com.atlassian.jira.jira-projects-plugin:release-page"
    echo ""
    if [[ "$(echo "$ALL" | jq 'length')" -eq 0 ]]; then
      echo "No releases"
      exit 0
    fi
    {
      printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "ID" "Status" "Start" "Release" "ToDo" "InProg" "Done" "Name"
      echo "$ALL" | jq -r '.[] | [
        .id,
        (if .archived then "archived" elif .released then "released" else "unreleased" end),
        (.startDate // "—"),
        (.releaseDate // "—"),
        ((.issuesStatusForFixVersion.toDo // 0) | tostring),
        ((.issuesStatusForFixVersion.inProgress // 0) | tostring),
        ((.issuesStatusForFixVersion.done // 0) | tostring),
        .name
      ] | @tsv'
    } | column -t -s $'\t'
    echo ""
    echo "Total: $(echo "$ALL" | jq 'length') releases"
    ;;
esac
