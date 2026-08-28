#!/bin/bash
# List issues with a Jira release as fixVersion
# Usage: ./release-issues.sh VERSION [PROJECT] [format]
# Formats: list (default), json
# Project: second argument, else JIRA_PROJECT, else script default

set -e

VERSION="${1:-}"
DEFAULT_PROJECT="${JIRA_PROJECT:-DWTC}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: ./release-issues.sh VERSION [PROJECT] [format]"
  echo "VERSION is a version name or id"
  exit 1
fi

if [[ -z "$2" || "$2" == "list" || "$2" == "json" ]]; then
  PROJECT="$DEFAULT_PROJECT"
  FORMAT="${2:-list}"
else
  PROJECT="$2"
  FORMAT="${3:-list}"
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
    "$BASE_URL/rest/api/2/project/$PROJECT/version?startAt=$START_AT&maxResults=$MAX_RESULTS&orderBy=sequence")

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
version_name=$(echo "$match" | jq -r '.name')
JQL="project = ${PROJECT} AND fixVersion = ${version_id}"

ALL_ISSUES="[]"
TOKEN=""

while true; do
  if [[ -n "$TOKEN" ]]; then
    body=$(jq -n --arg jql "$JQL" --arg token "$TOKEN" '{
      jql: $jql,
      maxResults: 100,
      fields: ["summary", "status", "issuetype", "priority", "assignee"],
      nextPageToken: $token
    }')
  else
    body=$(jq -n --arg jql "$JQL" '{
      jql: $jql,
      maxResults: 100,
      fields: ["summary", "status", "issuetype", "priority", "assignee"]
    }')
  fi

  response=$(curl -s -u "$AUTH" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$body" \
    "$BASE_URL/rest/api/3/search/jql")

  if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
    echo "$response" | jq -r '.errorMessages[]'
    exit 1
  fi

  PAGE_ISSUES=$(echo "$response" | jq '.issues // []')
  ALL_ISSUES=$(echo "$ALL_ISSUES $PAGE_ISSUES" | jq -s 'add')

  is_last=$(echo "$response" | jq -r '.isLast // false')
  TOKEN=$(echo "$response" | jq -r '.nextPageToken // empty')
  if [[ "$is_last" == "true" || -z "$TOKEN" ]]; then
    break
  fi
done

case "$FORMAT" in
  json)
    echo "$ALL_ISSUES" | jq \
      --arg project "$PROJECT" \
      --arg version_id "$version_id" \
      --arg version_name "$version_name" \
      '{project: $project, versionId: $version_id, versionName: $version_name, total: (. | length), issues: .}'
    ;;
  list|*)
    count=$(echo "$ALL_ISSUES" | jq 'length')
    echo "=== Issues in $version_name ($version_id) ==="
    echo "Project: $PROJECT"
    echo "JQL: $JQL"
    echo ""
    if [[ "$count" -eq 0 ]]; then
      echo "No issues"
      exit 0
    fi
    echo "$ALL_ISSUES" | jq -r '.[] | [
      .key,
      .fields.status.name,
      .fields.issuetype.name,
      (.fields.priority.name // "—"),
      (.fields.assignee.displayName // "Unassigned"),
      .fields.summary
    ] | @tsv' | column -t -s $'\t'
    echo ""
    echo "Total: $count issues"
    ;;
esac
