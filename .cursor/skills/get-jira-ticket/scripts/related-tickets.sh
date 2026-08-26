#!/bin/bash
# Fetch parent, linked issues, subtasks, and epic context for a ticket
# Usage: ./related-tickets.sh TICKET-ID <output_dir>
#
# Requires ticket.json to exist in output_dir (run ticket.sh first).
# Writes:
#   related/index.txt              — list of related keys and why they were fetched
#   related/<KEY>/ticket.txt
#   related/<KEY>/comments.txt
#   epic/ticket.txt                — epic description (if found)
#   epic/comments.txt
#   epic/issues.txt                — sibling issues in the epic (summaries only)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TICKET="${1:-}"
OUTPUT_DIR="${2:-}"

if [[ -z "$TICKET" || -z "$OUTPUT_DIR" ]]; then
  echo "Usage: ./related-tickets.sh TICKET-ID <output_dir>"
  exit 1
fi

TICKET_JSON="$OUTPUT_DIR/ticket.json"
if [[ ! -f "$TICKET_JSON" ]]; then
  echo "Error: $TICKET_JSON not found — run ticket.sh first"
  exit 1
fi

USER="${ATLASSIAN_USER:-}"
if [[ -z "$USER" || -z "$ATLASSIAN_TOKEN" ]]; then
  echo "Error: ATLASSIAN_USER and ATLASSIAN_TOKEN must be set"
  exit 1
fi

AUTH="$USER:$ATLASSIAN_TOKEN"
BASE_URL="${ATLASSIAN_BASE_URL:-https://eaflood.atlassian.net}"
MAX_RELATED="${JIRA_MAX_RELATED:-10}"

RELATED_DIR="$OUTPUT_DIR/related"
EPIC_DIR="$OUTPUT_DIR/epic"
KEYS_FILE="$RELATED_DIR/.keys.tsv"
mkdir -p "$RELATED_DIR" "$EPIC_DIR"
: > "$KEYS_FILE"

add_key() {
  local key="$1"
  local reason="$2"
  if [[ -z "$key" || "$key" == "null" || "$key" == "$TICKET" ]]; then
    return
  fi
  if grep -q "^${key}	" "$KEYS_FILE" 2>/dev/null; then
    local existing
    existing=$(grep "^${key}	" "$KEYS_FILE" | cut -f2)
    grep -v "^${key}	" "$KEYS_FILE" > "${KEYS_FILE}.tmp" || true
    mv "${KEYS_FILE}.tmp" "$KEYS_FILE"
    printf '%s	%s\n' "$key" "${existing}; ${reason}" >> "$KEYS_FILE"
  else
    printf '%s	%s\n' "$key" "$reason" >> "$KEYS_FILE"
  fi
}

parent_key=$(jq -r '.fields.parent.key // empty' "$TICKET_JSON")
if [[ -n "$parent_key" ]]; then
  add_key "$parent_key" "parent"
fi

while IFS= read -r key; do
  [[ -n "$key" ]] && add_key "$key" "subtask"
done < <(jq -r '.fields.subtasks[]?.key // empty' "$TICKET_JSON")

while IFS=$'\t' read -r key link_type; do
  [[ -n "$key" ]] && add_key "$key" "linked ($link_type)"
done < <(jq -r '.fields.issuelinks[] |
  if .outwardIssue then
    "\(.outwardIssue.key)\t\(.type.outward)"
  elif .inwardIssue then
    "\(.inwardIssue.key)\t\(.type.inward)"
  else empty end' "$TICKET_JSON")

agile_response=$(curl -s -u "$AUTH" \
  -H "Content-Type: application/json" \
  "$BASE_URL/rest/agile/1.0/issue/$TICKET")

epic_key=$(echo "$agile_response" | jq -r '.fields.epic.key // empty' 2>/dev/null || true)

if [[ -z "$epic_key" && -n "$parent_key" ]]; then
  parent_type=$(curl -s -u "$AUTH" \
    -H "Content-Type: application/json" \
    "$BASE_URL/rest/api/2/issue/$parent_key?fields=issuetype" | jq -r '.fields.issuetype.name // empty')
  if [[ "$parent_type" == "Epic" ]]; then
    epic_key="$parent_key"
  fi
fi

{
  echo "Related context for $TICKET"
  echo "Fetched: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo ""
  if [[ -n "$epic_key" ]]; then
    echo "Epic: $epic_key (saved under epic/)"
  else
    echo "Epic: none detected"
  fi
  echo ""
  echo "Related tickets (full ticket + comments, max $MAX_RELATED):"
} > "$RELATED_DIR/index.txt"

related_count=0
while IFS=$'\t' read -r key reason; do
  if [[ $related_count -ge $MAX_RELATED ]]; then
    echo "  (skipped — max $MAX_RELATED reached; set JIRA_MAX_RELATED to increase)" >> "$RELATED_DIR/index.txt"
    break
  fi

  key_dir="$RELATED_DIR/$key"
  mkdir -p "$key_dir"

  bash "$SCRIPT_DIR/ticket.sh" "$key" full > "$key_dir/ticket.txt"
  bash "$SCRIPT_DIR/comments.sh" "$key" list > "$key_dir/comments.txt"

  echo "  $key — $reason" >> "$RELATED_DIR/index.txt"
  related_count=$((related_count + 1))
done < "$KEYS_FILE"

if [[ $related_count -eq 0 ]]; then
  echo "  (none)" >> "$RELATED_DIR/index.txt"
fi

if [[ -n "$epic_key" && "$epic_key" != "$TICKET" ]]; then
  bash "$SCRIPT_DIR/ticket.sh" "$epic_key" full > "$EPIC_DIR/ticket.txt"
  bash "$SCRIPT_DIR/comments.sh" "$epic_key" list > "$EPIC_DIR/comments.txt"
  bash "$SCRIPT_DIR/epic-issues.sh" "$epic_key" list > "$EPIC_DIR/issues.txt" 2>/dev/null || \
    echo "Could not list epic issues (ticket may not be registered as an epic in Agile API)" > "$EPIC_DIR/issues.txt"

  echo "" >> "$RELATED_DIR/index.txt"
  echo "Epic $epic_key saved under epic/ (description, comments, sibling issue list)" >> "$RELATED_DIR/index.txt"
fi

rm -f "$KEYS_FILE"
cat "$RELATED_DIR/index.txt"
