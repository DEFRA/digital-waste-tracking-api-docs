# Event model JSON Schema — stage 1

Branch: `DWTC-151`. Repo: `digital-waste-tracking-api-docs`.

## Problem

Event-model knowledge — the fields and rules the DWT API expects from data providers — is currently scattered across PowerPoint, spreadsheets, `openapi.yaml`, and hand-written Joi fixtures in `docs/collections/data/`. No single source of truth exists, and there's no way to communicate the expected data to software providers without exposing API implementation details.

## Scope for stage 1

1. Define the event model using JSON Schema, one file per resource, composed via `$ref` — covering everything the Creation event needs (producer done; carrier, broker-or-dealer, receiver, waste-item remaining).
2. Reference those resource files **one by one from `docs/api/openapi.yaml`**, replacing its existing inline schema definitions (`producerDetails`, `creationCarrierDetails`, etc.) with `$ref`s to the new files.

**Why openapi.yaml can change shape freely here:** it's a _target_ spec used to align with the business on what's being built, not an implemented/consumed contract — the actual implementations live in other OpenAPI specs in the sibling service repos. So swapping a flat, prose-described object for a `$ref`'d `oneOf`-of-variants is not a backward-compatibility concern the way it would be for a live API. The one thing still worth checking early is _technical_ rendering: `openapi.yaml` is pinned to OpenAPI 3.0.3 (D-003), whose schema dialect doesn't officially include `const` (only added in later JSON Schema drafts / OpenAPI 3.1) — the event-model files use `const` to pin each variant's discriminator value. There's no OpenAPI linter in this repo to catch a mismatch, so the only real signal is whether `docs/api/openapi.md` (the `swagger-ui-tag` render) still displays sensibly. **Pilot with Producer first** — swap it, check that page, then proceed to the rest one resource at a time so a problem is easy to isolate.

**Explicitly out of scope** (raised in the original ask, deliberately deferred):

- Rendering the _event-model_ schema as its own documentation page (hand-written or automated) — tracked as [docs/backlog/automate-event-model-doc-generation.md](../backlog/automate-event-model-doc-generation.md), which also carries the recommended approach (`json-schema-for-humans`) and the reasoning behind it for whoever picks it up. Unaffected by stage 1 — `openapi.md`'s existing `swagger-ui-tag` render is a separate page from anything event-model-specific.
- A regulator-facing spreadsheet generated from the schema — later phase, format to be discussed separately.
- Relationship/variant graph visualisation — later phase.
- Runtime validation, or replacing hand-written Joi in the actual services with something driven by this JSON Schema — tracked as [docs/backlog/runtime-validation-from-json-schema.md](../backlog/runtime-validation-from-json-schema.md), not part of this work.

**Sources for field lists/rules**, to reconcile against each other while porting a resource (they may have already drifted slightly from one another):

- `docs/collections/data/*Joi.js` / `*Types.ts` — the POC fixtures; not mechanically ported, but the most detailed source for conditional business rules.
- `docs/api/openapi.yaml`'s existing inline schemas for the same resource (e.g. `creationCarrierDetails`) — arguably closer to the current target _public contract_ shape, since it's the thing being replaced.
- `docs/collections/model/*.md` (the Mongo storage proposals) — mostly restates rules already visible in the Joi fixtures (`collectionType`/`receivedFromCarrier`, hazardous-consignment-driven rules) rather than adding new field-level detail, but worth checking for anything Creation-adjacent that isn't in the Joi fixtures (e.g. D-010's hazardous-delivery identifier rule lives here, relevant when Delivery's resources are built later).

## Decisions (apply these, don't re-derive)

**Location.** New top-level `docs/event-model/`, sibling to `docs/api/` and `docs/collections/` — not nested under `docs/collections/`, since this is meant to be a distinct, independently-referenced artifact. Everything lives under `docs/` — the `.schema.json` source files, and eventually whatever renders them — so GitHub Pages publishes the raw schema files too, which `openapi.yaml`'s `$ref`s need to resolve against (see "Scope for stage 1" above).

**D-002 note.** `docs/collections/decisions.md`'s D-002 ("Single OpenAPI file, not `$ref`-split") was about splitting `openapi.yaml`'s own component definitions apart, not about referencing an external schema collection — but it's adjacent enough that whoever executes stage 1 should add a note to D-002 (or a new decision) once `openapi.yaml` actually starts `$ref`-ing outside itself, rather than let D-002 read as still fully in force unqualified.

**File layout.**

```
docs/event-model/
  schema/
    events/
      creation.schema.json         # event root documents — no folder-per-file, nothing else $refs into them
      (collection.schema.json, delivery.schema.json, receipt.schema.json — later, same pattern)
    resources/
      <concept>/                   # every resource gets its own folder, even if not a union today —
        <concept>.schema.json      #   avoids moving files if it grows variants later
        (only if it's a union:)
        <concept>-base.schema.json       # fields shared by every variant
        <concept>-<variant>.schema.json  # one file per variant, complete/self-contained
```

Already built as a real example: `docs/event-model/schema/resources/producer/` (see below). No `.md` page exists for it (or for anything else) yet — rendering is deferred, see the "Rendering" note below.

**Union/variant encoding.** This was the crux of the brainstorm, validated empirically with `json-schema-for-humans` spikes — don't deviate without re-validating rendering:

- Model each union as `<concept>.schema.json` = a `oneOf` of `$ref`s to fully self-contained `<concept>-<variant>.schema.json` files (one per discriminator value), **not** as `if`/`then` conditionals on a single flat object.
- Why: `if`/`then`/`required` alone rendered fine, but there's no clean way to render a conditionally-_forbidden_ field (needed for e.g. `Producer.wasteSource=Household` forbidding `organisationName`) — `"field": false` renders as a misleading plain optional property, and `not`/`anyOf`/`required` renders but is indirect and confusing. Splitting each variant into its own complete file (declaring only the properties that apply, `additionalProperties: false`) sidesteps the problem — it rendered as a clean "One of" table linking to fully self-contained, correctly-labelled variant sections.
- Shared fields across all variants of one union go in `<concept>-base.schema.json`, pulled into each variant via `"allOf": [{"$ref": "<concept>-base.schema.json"}, {variant-specific properties}]`. This renders as two separate, clearly-titled tables per variant (base fields, then variant-specific fields) rather than one merged table — an accepted trade-off, still legible. Give the variant-specific inline fragment its own `"title"` when authoring new ones (don't leave it as an unlabelled "item 1").
- JSON Schema draft: **draft-07** (`http://json-schema.org/draft-07/schema#`) — matches what `json-schema-for-humans` actually supports (confirmed via spike). This is independent of `openapi.yaml`'s own version (D-002/D-003 in `docs/collections/decisions.md` pin the API spec to a single OpenAPI 3.0.3 file; that constrains the API spec only, not this standalone artifact).
- `$id` per file: bare filename (e.g. `"$id": "producer-household.schema.json"`), relative `$ref`s between sibling files in the same folder — confirmed this resolves correctly.

**Rendering.** Deliberately out of v1 entirely — see "Scope for v1" above. Full detail, including a validated implementation approach, lives in [docs/backlog/automate-event-model-doc-generation.md](../backlog/automate-event-model-doc-generation.md): in short, an `mkdocs-macros-plugin` hook calling `json_schema_for_humans.generate.generate_from_schema()` was prototyped and confirmed working end-to-end (real `mkdocs build`, real output checked), then rolled back out of this branch to keep it to schema-only. Read that backlog item before re-deciding this from scratch — it also covers why a client-side JS viewer and the one plugin that looked relevant (`mkdocs-json-schema-tag`) were both ruled out.

## Already built

- `docs/event-model/schema/resources/producer/producer-base.schema.json`, `producer-household.schema.json`, `producer-commercial.schema.json`, `producer-municipal.schema.json`, `producer.schema.json` — real content ported from `docs/collections/data/creationJoi.js`'s `producerSchema` (the `wasteSource`-driven Household/Commercial/Municipal union) and `docs/collections/data/sharedSchemas.js`'s `businessAddressSchema`. Committed on branch `DWTC-151`.

Treat this as the reference example for authoring every other resource/event schema.

## Remaining steps

1. **Carrier resource.** Reconcile `creationCarrierSchema`/`sharedSchemas.js` (Joi) against `openapi.yaml`'s `creationCarrierDetails` into `docs/event-model/schema/resources/carrier/`. Check whether carrier needs a union split (means-of-transport-driven conditional fields per both sources' comments) or is a single plain schema for v1.
2. **Broker/dealer resource.** Reconcile `brokerSchema` (Joi) against `openapi.yaml`'s equivalent inline schema into `docs/event-model/schema/resources/broker-or-dealer/`.
3. **Receiver resource.** Reconcile the receiver shape (conditionally required when hazardous waste is present, per D-008) against both sources into `docs/event-model/schema/resources/receiver/`.
4. **Waste item resource.** Reconcile the waste items shape (EWC codes, hazardous flags, disposal/recovery codes, POPs, weight) against both sources into `docs/event-model/schema/resources/waste-item/`. This one is likely to need its own union/variant treatment (hazardous vs non-hazardous) — apply the same `oneOf`-of-variant-files pattern as Producer.
5. **Assemble the Creation event.** Write `docs/event-model/schema/events/creation.schema.json`, `$ref`-ing `producer`, `carrier`, `broker-or-dealer`, `receiver`, and `waste-item` (array) as per the real `producerSchema`/`creationJoi.js` root object shape.
6. **Pilot: reference Producer from openapi.yaml.** Replace `producerDetails` with a `$ref` to `../../event-model/schema/resources/producer/producer.schema.json` (or wherever the relative path resolves to from `docs/api/openapi.yaml`). Build/check `docs/api/openapi.md` renders sensibly before continuing — this is the cheap, early check for whether the `oneOf`/`const` shape is tolerated by `swagger-ui-tag`'s renderer (see "Scope for stage 1" above).
7. **Reference the rest, one at a time.** Same swap-and-check for carrier, broker-or-dealer, receiver, waste-item — one resource per check, not all four at once, so a rendering problem is easy to isolate to the resource that caused it.
8. **D-002 note.** Add the note flagged above to `docs/collections/decisions.md` once `openapi.yaml` actually starts `$ref`-ing outside itself.

Rendering the _event-model_ schema as its own page (a `.md` page, MkDocs nav wiring, CI changes) is picked up separately — see [docs/backlog/automate-event-model-doc-generation.md](../backlog/automate-event-model-doc-generation.md) when that's prioritised. It's independent of stage 1's `openapi.yaml` wiring above.

## Open questions for whoever picks this up

- Confirmed scope for stage 1 is Creation's resources only (producer, carrier, broker-or-dealer, receiver, waste-item) — not Collection/Delivery/Receipt's resources too. Revisit if that assumption is wrong.
- Whether resource pages, once the event-model's own rendering exists, get their own nav entries or are only reachable by link from the event page that references them.
- Exact wording/placement of the frontmatter warning block on schema-derived pages, once they exist — currently copied verbatim from the rest of the repo's convention; revisit if the event-model section wants its own framing given it's meant for external software providers eventually (see `CLAUDE.local.md`: "Nothing here is yet guidance for external Software Providers").
