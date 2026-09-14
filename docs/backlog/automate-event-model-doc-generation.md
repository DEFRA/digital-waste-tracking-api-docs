---
worth: yes
added: 2026-09-08
---

# render event-model docs from JSON Schema with json-schema-for-humans

v1 of the event-model work (`docs/event-model/schema/`) ships JSON Schema only — no rendered documentation pages yet. Rendering was deliberately left out of v1 scope entirely (not even a hand-written page), to keep the first pass to "define the schema, get the layout/composition right."

Recommendation for when this is picked up: **`json-schema-for-humans`** (Python, actively maintained, `pip install json-schema-for-humans`). This was spiked directly against the schema shapes this repo settled on and confirmed working two ways:

1. **Rendering quality.** A union modelled as `oneOf` over separate per-variant files (e.g. `producer-household.schema.json`, `producer-commercial.schema.json`) produced a clean "One of" table linking to fully self-contained variant sections; shared fields reused across variants via a base file pulled in with `allOf`/`$ref` rendered as two clearly-labelled tables (base fields, then variant-specific fields) rather than anything misleading. Two things that did _not_ render usably, worth avoiding: `"field": false` to forbid a property in a conditional branch renders as a plain untyped optional property with no hint it's forbidden; `if`/`then` conditionals fared better than that but still worse than the file-per-variant approach.
2. **Integration mechanism.** Confirmed end-to-end with a real `mkdocs build`: an `mkdocs-macros-plugin` hook (`main.py` at the repo root, ~10 lines) exposing one macro, `schema_doc(path)`, that calls `json_schema_for_humans.generate.generate_from_schema()` directly (the library returns a markdown string — no temp files needed). A page then stays genuinely short — `{{ schema_doc("event-model/schema/resources/producer/producer.schema.json") }}` plus a couple of sentences of prose — and the rendered table is never hand-pasted or committed. No existing MkDocs plugin does this already: `mkdocs-json-schema-tag` (the one candidate whose name suggested it) turned out to be an unmodified fork of `mkdocs-swagger-ui-tag` with no JSON-Schema code at all — expect to write the same small macro rather than search for a ready-made plugin.

Both `main.py` and the rendered `producer.md` page from that spike were rolled back out of this branch (2026-09-08) to keep the diff to schema files only — the schema itself is what's landing now, not the rendering.
