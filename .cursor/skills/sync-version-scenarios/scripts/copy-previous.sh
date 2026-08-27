#!/bin/bash
# Copy the previous version's scenario folder into the target if the target is empty.
# Usage: ./copy-previous.sh beta-1
# Run from the repo root.

set -e

TARGET="${1:-}"

if [[ "$TARGET" =~ ^beta-([0-9]+)$ ]]; then
  PREFIX="beta-"
  N="${BASH_REMATCH[1]}"
elif [[ "$TARGET" =~ ^v([0-9]+)$ ]]; then
  PREFIX="v"
  N="${BASH_REMATCH[1]}"
else
  echo "Usage: ./copy-previous.sh beta-<N>|v<N>" >&2
  exit 1
fi

DEST="docs/collections/scenarios/$TARGET"

if [[ "$N" -eq 0 ]]; then
  mkdir -p "$DEST"
  echo "No previous version to copy for $TARGET"
  exit 0
fi

PREV="${PREFIX}$((N - 1))"
SRC="docs/collections/scenarios/$PREV"

if [[ ! -d "$SRC" ]]; then
  mkdir -p "$DEST"
  echo "No previous folder $SRC — starting $DEST empty"
  exit 0
fi

if [[ -d "$DEST" ]] && [[ -n "$(find "$DEST" -mindepth 1 -maxdepth 1 2>/dev/null | head -1)" ]]; then
  echo "Target $DEST already has files — not overwriting with $PREV"
  exit 0
fi

mkdir -p "$DEST"
cp -R "$SRC"/. "$DEST"/
echo "Copied $SRC -> $DEST"
