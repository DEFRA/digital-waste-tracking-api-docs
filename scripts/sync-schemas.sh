#!/usr/bin/env bash
# Copies the versioned JSON Schemas from waste-movement-backend (the source of
# truth) into docs/event-model/schemas/, which is committed to this
# repo so a plain clone renders without a network fetch.
#
# Every `beta-*` folder under the backend's src/schemas/ comes across, keeping
# its version prefix, so each file's path from the mirror root equals its path
# from src/schemas/ (e.g. "beta-2/common/producer/producer.schema.json"). That
# matters because the schemas declare no $id: upstream treats the path as the
# schema's identity, and relative $refs resolve against wherever the file was
# fetched from. A future beta-3 is picked up with no change here.
#
# See docs/event-model/schemas/README.md for why this is a copy
# rather than a $ref at raw.githubusercontent.com.
set -euo pipefail

REPO="${SCHEMA_SOURCE_REPO:-https://github.com/DEFRA/waste-movement-backend.git}"
REF="${SCHEMA_SOURCE_REF:-main}"
SUBTREE="src/schemas"
DEST="docs/event-model/schemas"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git clone --quiet --depth 1 --filter=blob:none --sparse --branch "$REF" "$REPO" "$tmp"
git -C "$tmp" sparse-checkout set "$SUBTREE"
sha="$(git -C "$tmp" rev-parse HEAD)"

mkdir -p "$DEST"

# Drop the previous snapshot first, so a schema deleted upstream disappears here
# too rather than lingering. The hand-written README is not matched by either find.
find "$DEST" -name '*.schema.json' -delete
find "$DEST" -mindepth 1 -type d -empty -delete

# Copy schema files only — the .test.js files beside them upstream are backend-side
# and import backend paths. Restricted to beta-* so the loose .js schemas that
# sit directly under src/schemas/ (movement.js, headers.js, …) stay out.
(cd "$tmp/$SUBTREE" && find . -path './beta-*' -name '*.schema.json' -print0) |
  while IFS= read -r -d '' f; do
    mkdir -p "$DEST/$(dirname "$f")"
    cp "$tmp/$SUBTREE/$f" "$DEST/$f"
  done

echo "Synced $DEST from waste-movement-backend@$sha"
