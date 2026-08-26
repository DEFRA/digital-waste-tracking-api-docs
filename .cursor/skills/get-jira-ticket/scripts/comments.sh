#!/bin/bash
# Get JIRA ticket comments
# Usage: ./comments.sh TICKET-ID [format]
# Formats: list (default), json, count

set -e

TICKET="${1:-}"
FORMAT="${2:-list}"

if [[ -z "$TICKET" ]]; then
  echo "Usage: ./comments.sh TICKET-ID [format]"
  echo "Formats: list (default), json, count"
  exit 1
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

response=$(curl -s -u "$AUTH" \
  -H "Content-Type: application/json" \
  "$BASE_URL/rest/api/2/issue/$TICKET/comment?expand=renderedBody")

if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
  echo "$response" | jq -r '.errorMessages[]'
  exit 1
fi

comments=$(echo "$response" | jq '.comments')

case "$FORMAT" in
  json)
    echo "$comments"
    ;;
  count)
    echo "$comments" | jq 'length'
    ;;
  list|*)
    count=$(echo "$comments" | jq 'length')
    if [[ "$count" == "0" ]]; then
      echo "No comments on $TICKET"
      exit 0
    fi
    echo "=== Comments on $TICKET ($count) ==="
    echo "$comments" | jq -r '.[] |
      "--- \(.author.displayName) (\(.created | split("T")[0])) ---",
      (.renderedBody // .body // "No comment body"),
      ""'
    ;;
esac
