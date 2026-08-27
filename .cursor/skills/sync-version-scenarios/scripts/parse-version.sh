#!/bin/bash
# Print repo folder name from a Jira fix version name.
# Usage: ./parse-version.sh "beta-1: Example"
# Also accepts "v0: …" (legacy).

set -e

NAME="${1:-}"

if [[ -z "$NAME" ]]; then
  echo "Usage: ./parse-version.sh \"beta-<N>: …\"" >&2
  exit 1
fi

if [[ "$NAME" =~ ^beta-([0-9]+): ]]; then
  echo "beta-${BASH_REMATCH[1]}"
  exit 0
fi

if [[ "$NAME" =~ ^v([0-9]+): ]]; then
  echo "v${BASH_REMATCH[1]}"
  exit 0
fi

echo "Error: Jira version name must start with 'beta-<N>:' or 'v<N>:' (N is an integer). Got: $NAME" >&2
exit 1
