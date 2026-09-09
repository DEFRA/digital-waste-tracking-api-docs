# Event model JSON Schema — stage 1

Branch: `DWTC-151`. Repo: `digital-waste-tracking-api-docs`.

## Problem

Event-model knowledge — the fields and rules the DWT API expects from data providers — is currently scattered across PowerPoint, spreadsheets, `openapi.yaml`, and hand-written Joi fixtures in `docs/collections/data/`. No single source of truth exists, and there's no way to communicate the expected data to software providers without exposing API implementation details.

## Scope for stage 1

1. Define the event model using JSON Schema, one file per resource, composed via `$ref` — covering everything the Creation event needs (producer done; carrier, broker-or-dealer, receiver, waste-item remaining).
2. Reference those resource files **one by one from `docs/api/openapi.yaml`**, replacing its existing inline schema definitions (`producerDetails`, `creationCarrierDetails`, etc.) with `$ref`s to the new files.
3. Replace the hand-written Joi fixtures in `docs/collections/data/*Joi.js` with runtime validation driven by the JSON Schema files (ajv), proven equivalent to the existing Joi behaviour via tests, resource by resource. This folds in and supersedes what was previously deferred as [docs/backlog/runtime-validation-from-json-schema.md](../backlog/runtime-validation-from-json-schema.md) (now deleted — its "unknown to settle" is resolved below: ajv validating the JSON Schema directly, with custom ajv `format`s for the handful of rules that don't reduce to `pattern`).

**Why openapi.yaml can change shape freely here:** it's a _target_ spec used to align with the business on what's being built, not an implemented/consumed contract — the actual implementations live in other OpenAPI specs in the sibling service repos. So swapping a flat, prose-described object for a `$ref`'d `oneOf`-of-variants is not a backward-compatibility concern the way it would be for a live API. The one thing still worth checking early is _technical_ rendering: `openapi.yaml` is pinned to OpenAPI 3.0.3 (D-003), whose schema dialect doesn't officially include `const` (only added in later JSON Schema drafts / OpenAPI 3.1) — the event-model files use `const` to pin each variant's discriminator value. There's no OpenAPI linter in this repo to catch a mismatch, so the only real signal is whether `docs/api/openapi.md` (the `swagger-ui-tag` render) still displays sensibly. **Pilot with Producer first** — swap it, check that page, then proceed to the rest one resource at a time so a problem is easy to isolate.

**Why the Joi fixtures can be replaced here (not just referenced against):** `docs/collections/data/*Joi.js` are documentation fixtures, not consumed code — nothing in the sibling service repos imports them (they pin their own Joi via `waste-movement-utils`). Replacing them is scoped entirely to this repo's own fixtures/docs, not a change to any live service.

**Explicitly out of scope** (raised in the original ask, deliberately deferred):

- Rendering the _event-model_ schema as its own documentation page (hand-written or automated) — tracked as [docs/backlog/automate-event-model-doc-generation.md](../backlog/automate-event-model-doc-generation.md), which also carries the recommended approach (`json-schema-for-humans`) and the reasoning behind it for whoever picks it up. Unaffected by stage 1 — `openapi.md`'s existing `swagger-ui-tag` render is a separate page from anything event-model-specific.
- A regulator-facing spreadsheet generated from the schema — later phase, format to be discussed separately.
- Relationship/variant graph visualisation — later phase.
- Replacing the hand-written Joi in the actual services (`waste-movement-external-api`/`waste-movement-backend`) with something driven by this JSON Schema — out of scope entirely; those services' Joi is separately maintained via `waste-movement-utils` and unaffected by anything in this repo.

**Sources for field lists/rules**, to reconcile against each other while porting a resource (they may have already drifted slightly from one another):

- `docs/collections/data/*Joi.js` / `*Types.ts` — the POC fixtures; not mechanically ported, but the most detailed source for conditional business rules, and the equivalence-test oracle (see below) while each resource is being replaced.
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
  validate/
    index.js                       # compiles schema/resources/**/*.schema.json (+ schema/events/ once assembled) with ajv, exports validate(name, payload)
    formats.js                     # registers custom ajv `format`s, reusing validator functions imported as-is from docs/collections/data/validators.js
```

Already built as a real example: `docs/event-model/schema/resources/producer/` (see below). No `.md` page exists for it (or for anything else) yet — rendering is deferred, see the "Rendering" note below.

**Union/variant encoding.** This was the crux of the brainstorm, validated empirically with `json-schema-for-humans` spikes — don't deviate without re-validating rendering:

- Model each union as `<concept>.schema.json` = a `oneOf` of `$ref`s to fully self-contained `<concept>-<variant>.schema.json` files (one per discriminator value), **not** as `if`/`then` conditionals on a single flat object.
- Why: `if`/`then`/`required` alone rendered fine, but there's no clean way to render a conditionally-_forbidden_ field (needed for e.g. `Producer.wasteSource=Household` forbidding `organisationName`) — `"field": false` renders as a misleading plain optional property, and `not`/`anyOf`/`required` renders but is indirect and confusing. Splitting each variant into its own complete file (declaring only the properties that apply, `additionalProperties: false`) sidesteps the problem — it rendered as a clean "One of" table linking to fully self-contained, correctly-labelled variant sections. This same encoding is also what makes the ajv equivalence tests meaningful: a variant's `additionalProperties: false` is what actually rejects a wrongly-present/absent field, not custom logic, so proving the union behaves correctly is the main thing worth testing (see "Runtime validation" below).
- Shared fields across all variants of one union go in `<concept>-base.schema.json`, pulled into each variant via `"allOf": [{"$ref": "<concept>-base.schema.json"}, {variant-specific properties}]`. This renders as two separate, clearly-titled tables per variant (base fields, then variant-specific fields) rather than one merged table — an accepted trade-off, still legible. Give the variant-specific inline fragment its own `"title"` when authoring new ones (don't leave it as an unlabelled "item 1").
- JSON Schema draft: **draft-07** (`http://json-schema.org/draft-07/schema#`) — matches what `json-schema-for-humans` actually supports (confirmed via spike), and what ajv validates without extra configuration.
- `$id` per file: bare filename (e.g. `"$id": "producer-household.schema.json"`), relative `$ref`s between sibling files in the same folder — confirmed this resolves correctly.

**Rendering.** Deliberately out of v1 entirely — see "Scope for v1" above. Full detail, including a validated implementation approach, lives in [docs/backlog/automate-event-model-doc-generation.md](../backlog/automate-event-model-doc-generation.md): in short, an `mkdocs-macros-plugin` hook calling `json_schema_for_humans.generate.generate_from_schema()` was prototyped and confirmed working end-to-end (real `mkdocs build`, real output checked), then rolled back out of this branch to keep it to schema-only. Read that backlog item before re-deciding this from scratch — it also covers why a client-side JS viewer and the one plugin that looked relevant (`mkdocs-json-schema-tag`) were both ruled out.

**Runtime validation (replacing Joi).** Brainstormed 2026-09-09, folding in and resolving the former `runtime-validation-from-json-schema.md` backlog item:

- **Approach: ajv, validating the JSON Schema files directly** — not Joi codegen (no solid "JSON Schema → Joi" generator exists in the ecosystem, unlike the reverse), not Zod (would mean either a third hand-maintained schema copy, or a lossy generated layer; TypeScript is NOT SUPPORTED on Defra's tech radar and Zod isn't on it either, with no upside here since this stays plain JS). The `oneOf`-of-variant-files design already encodes most conditional/forbidden-field rules structurally, so ajv needs no extra cross-field logic for those. The handful of rules that don't reduce to a plain `pattern` (e.g. `isValidPhoneNumber`'s "valid chars AND 7–15 digits after stripping non-digits") are wired in as custom ajv `format`s, reusing `docs/collections/data/validators.js`'s existing exported functions as-is (they're already pure, Joi-independent, boolean-returning) — no rewrite.
- **Node tooling**: this repo currently has none (content-only per `CLAUDE.local.md`). Add a root `package.json` (`"type": "module"`, matching the fixtures' existing ESM syntax) with `jest`, `joi`, `ajv`, `ajv-formats` as devDependencies — Jest chosen over Vitest to match the sibling service repos' convention. Scoped purely to this verification work; doesn't touch the `mkdocs build`/publish pipeline.
- **Test layout**: mirrors the schema path under `test/`, flat (no per-resource subfolder), one file per resource, cases inlined (no separate cases file):
  ```
  test/event-model/schema/resources/producer.test.js
  test/event-model/schema/resources/carrier.test.js
  test/event-model/schema/resources/broker-or-dealer.test.js
  test/event-model/schema/resources/receiver.test.js
  test/event-model/schema/resources/waste-item.test.js
  test/event-model/schema/events/creation.test.js       # later, once assembled
  ```
- **Test design — one stable file per resource, evolved in three small edits, not rewritten. Plain `test()` blocks, one per condition — no `test.each`/table-driven cases.** Each condition being proven (one per union variant valid, one per forbidden/required-field boundary) gets its own named `test(...)` block, body written by hand rather than pulled from a shared case table:
  1. **Joi-only** (as soon as tooling exists, before any JSON Schema beyond producer exists):
     ```js
     test('rejects organisationName on a Household producer', () => {
       const { error } = producerSchema.validate({ ...householdProducer, organisationName: 'Acme' })
       expect(error).toBeDefined()
     })
     ```
     This documents current Joi behaviour and doubles as the spec to author the JSON Schema against.
  2. **Add the ajv assertion** (once that resource's JSON Schema + ajv wiring exist): add a second `expect` in the same `test()` block, checking ajv reaches the same verdict:
     ```js
     test('rejects organisationName on a Household producer', () => {
       const payload = { ...householdProducer, organisationName: 'Acme' }
       expect(producerSchema.validate(payload).error).toBeDefined()
       expect(ajvValidate(payload)).toBe(false)
     })
     ```
  3. **Drop the Joi assertion** (once that resource's Joi definition is deleted): remove the Joi line and its now-unused import, leaving just the ajv `expect` in the same named test — no restructuring.
- **Case scope — deliberately lean/high-level**: per resource, one valid payload per union variant, plus a small number of negative cases that specifically prove variant discrimination (a field forbidden in one variant but present; a field required in a variant but missing). Not an exhaustive sweep of every field-level regex/rule — that level of detail is what `pattern`/`format` in the schema itself encodes; re-litigating it case-by-case isn't the point of this suite. Existing example payloads in `docs/collections/data/creationEvent.js` seed the straightforward valid cases.
- **Sequencing**: write the Joi-only expectation tests for *all five* Creation resources first (stage 1 above), independently of and before any new JSON Schema authoring beyond producer — this can happen as soon as Node/Jest/`joi` tooling exists. Only then move resource-by-resource through JSON-Schema-authoring + stage 2 + stage 3. See "Remaining steps" for the concrete order.
- **openapi.yaml/JSON Schema drift**: no separate automated check needed — `openapi.yaml`'s `$ref` points at the exact `.schema.json` file ajv validates, so there's nothing to drift between them. The existing "build `openapi.md`, eyeball it" step (below) stays the mechanism for catching *rendering* problems; kept manual, not automated, per "tests must be simple, high-level."

## Already built

- `docs/event-model/schema/resources/producer/producer-base.schema.json`, `producer-household.schema.json`, `producer-commercial.schema.json`, `producer-municipal.schema.json`, `producer.schema.json` — real content ported from `docs/collections/data/creationJoi.js`'s `producerSchema` (the `wasteSource`-driven Household/Commercial/Municipal union) and `docs/collections/data/sharedSchemas.js`'s `businessAddressSchema`. Committed on branch `DWTC-151`.

Treat this as the reference example for authoring every other resource/event schema.

## Remaining steps

1. **Node tooling.** Add `package.json` (`"type": "module"`) with `jest` and `joi` as devDependencies (not `ajv`/`ajv-formats` yet — no JSON Schema resources beyond producer exist at this point).
2. **Joi-only expectation tests, all five Creation resources.** Write `test/event-model/schema/resources/{producer,carrier,broker-or-dealer,receiver,waste-item}.test.js` against the *existing* Joi schemas in `creationJoi.js`/`sharedSchemas.js` — one named `test()` per condition (no `test.each`/tables), lean/high-level per the case-scope decision above (one valid case per union variant + a few variant-boundary negatives). This can be done entirely before any new JSON Schema authoring, and doubles as the spec for it. Producer's tests can lean on its already-built JSON Schema's variants for structure even though nothing references it yet.
3. **Carrier resource.** Reconcile `creationCarrierSchema`/`sharedSchemas.js` (Joi) against `openapi.yaml`'s `creationCarrierDetails` into `docs/event-model/schema/resources/carrier/`. Check whether carrier needs a union split (means-of-transport-driven conditional fields per both sources' comments) or is a single plain schema for v1. Add `ajv`/`ajv-formats` to `package.json` if not already present, build out `docs/event-model/validate/index.js` + `formats.js`, add the ajv assertion to `carrier.test.js` (stage 2 of the test-design decision above).
4. **Broker/dealer resource.** Reconcile `brokerSchema` (Joi) against `openapi.yaml`'s equivalent inline schema into `docs/event-model/schema/resources/broker-or-dealer/`. Same treatment: schema, then add ajv assertion to its existing test.
5. **Receiver resource.** Reconcile the receiver shape (conditionally required when hazardous waste is present, per D-008) against both sources into `docs/event-model/schema/resources/receiver/`. Same treatment.
6. **Waste item resource.** Reconcile the waste items shape (EWC codes, hazardous flags, disposal/recovery codes, POPs, weight) against both sources into `docs/event-model/schema/resources/waste-item/`. Likely needs its own union/variant treatment (hazardous vs non-hazardous) — apply the same `oneOf`-of-variant-files pattern as Producer. Same treatment.
7. **Retire Joi per resource, as each goes green.** For each of producer/carrier/broker-or-dealer/receiver/waste-item, once its test's ajv assertion passes and (once wired — see step 9) `openapi.yaml` references it: delete that resource's definition from `creationJoi.js`/`sharedSchemas.js`, and drop the Joi assertion line (and its now-unused import) from that resource's test file (stage 3 of the test-design decision above).
8. **Assemble the Creation event.** Write `docs/event-model/schema/events/creation.schema.json`, `$ref`-ing `producer`, `carrier`, `broker-or-dealer`, `receiver`, and `waste-item` (array) as per the real `producerSchema`/`creationJoi.js` root object shape.
9. **Pilot: reference Producer from openapi.yaml.** Replace `producerDetails` with a `$ref` to `../../event-model/schema/resources/producer/producer.schema.json` (or wherever the relative path resolves to from `docs/api/openapi.yaml`). Build/check `docs/api/openapi.md` renders sensibly before continuing — this is the cheap, early check for whether the `oneOf`/`const` shape is tolerated by `swagger-ui-tag`'s renderer (see "Scope for stage 1" above).
10. **Reference the rest, one at a time.** Same swap-and-check for carrier, broker-or-dealer, receiver, waste-item — one resource per check, not all four at once, so a rendering problem is easy to isolate to the resource that caused it.
11. **D-002 note.** Add the note flagged above to `docs/collections/decisions.md` once `openapi.yaml` actually starts `$ref`-ing outside itself.

Rendering the _event-model_ schema as its own page (a `.md` page, MkDocs nav wiring, CI changes) is picked up separately — see [docs/backlog/automate-event-model-doc-generation.md](../backlog/automate-event-model-doc-generation.md) when that's prioritised. It's independent of stage 1's `openapi.yaml` wiring above.

## Open questions for whoever picks this up

- Confirmed scope for stage 1 is Creation's resources only (producer, carrier, broker-or-dealer, receiver, waste-item) — not Collection/Delivery/Receipt's resources too. Revisit if that assumption is wrong.
- Whether resource pages, once the event-model's own rendering exists, get their own nav entries or are only reachable by link from the event page that references them.
- Exact wording/placement of the frontmatter warning block on schema-derived pages, once they exist — currently copied verbatim from the rest of the repo's convention; revisit if the event-model section wants its own framing given it's meant for external software providers eventually (see `CLAUDE.local.md`: "Nothing here is yet guidance for external Software Providers").
- Whether Jest needs any config beyond defaults for these plain ESM `.js` files (`"type": "module"` + Jest's ESM support) — verify when step 1 is actually run; Node's `--experimental-vm-modules` flag or a minimal `jest.config.js` may be needed depending on Node/Jest versions.
