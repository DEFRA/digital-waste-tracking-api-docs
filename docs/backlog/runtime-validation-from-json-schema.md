---
worth: later
added: 2026-09-08
---

# figure out runtime validation driven by JSON Schema

Longer-term goal for the event-model work in this repo: once `docs/event-model/` establishes JSON Schema as the source of truth for the Creation/Collection/Delivery/Receipt event shapes, replace the hand-written Joi validation schemas in `waste-movement-external-api` and `waste-movement-backend` with something generated from (or validated directly against) that JSON Schema, rather than maintaining Joi and JSON Schema as two independently hand-written copies of the same rules.

Explicitly descoped from the first version of the event-model docs work (brainstormed 2026-09-08) to keep that MVP to "define the schema, render a docs page" only.

**Unknown that would settle this:** whether the right shape is (a) validating requests directly against JSON Schema at runtime (e.g. via `ajv`) in place of Joi, or (b) generating Joi schemas from the JSON Schema source at build time, or (c) something else — and whether any of these are compatible with the custom business-rule validation (cross-field checks, hazardous-waste conditionals) the current Joi schemas encode via `.custom()`/`helpers.message()`. Worth revisiting once the JSON Schema event model in this repo has stabilised for at least one full event.
