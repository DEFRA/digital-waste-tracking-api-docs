# Event model JSON Schema

Branch: `DWTC-151`. Repo: `digital-waste-tracking-api-docs`.

## Problem

Event-model knowledge — the fields and rules the DWT API expects from data providers — is currently scattered across PowerPoint, spreadsheets, `openapi.yaml`, and hand-written Joi fixtures in `docs/collections/data/`. No single source of truth exists, and there's no way to communicate the expected data to software providers without exposing API implementation details.

## Scope

1. Define the event model using JSON Schema, one file per resource, composed via `$ref` — covering all four events (Creation, Collection, Delivery, Receipt), resource by resource. Shared resources (producer, carrier, broker-or-dealer, receiver, address, weight, other-reference, intended-treatment, actual-treatment, hazardous, pops) are defined once and referenced from whichever events use them; each event also gets its own event-specific resources (e.g. each event has its own waste-item shape) and a root document.
2. Reference those resource files **one by one from `docs/api/openapi.yaml`**, replacing its existing inline schema definitions (`producerDetails`, `creationCarrierDetails`, etc.) with `$ref`s to the new files.
3. Replace the hand-written Joi fixtures in `docs/collections/data/*Joi.js` with runtime validation driven by the JSON Schema files (ajv), proven equivalent to the existing Joi behaviour via tests, resource by resource. This folds in and supersedes what was previously deferred as [docs/backlog/runtime-validation-from-json-schema.md](../backlog/runtime-validation-from-json-schema.md) (now deleted — its "unknown to settle" is resolved below: ajv validating the JSON Schema directly, with custom ajv `format`s for the handful of rules that don't reduce to `pattern`).

**Why openapi.yaml can change shape freely here:** it's a _target_ spec used to align with the business on what's being built, not an implemented/consumed contract — the actual implementations live in other OpenAPI specs in the sibling service repos. So swapping a flat, prose-described object for a `$ref`'d `oneOf`-of-variants is not a backward-compatibility concern the way it would be for a live API. The one thing still worth checking early is _technical_ rendering: `openapi.yaml` is pinned to OpenAPI 3.0.3 (D-003), whose schema dialect doesn't officially include `const` (only added in later JSON Schema drafts / OpenAPI 3.1) — the event-model files use `const` to pin each variant's discriminator value. There's no OpenAPI linter in this repo to catch a mismatch, so the only real signal is whether `docs/api/openapi.md` (the `swagger-ui-tag` render) still displays sensibly. **Pilot with Producer first** — swap it, check that page, then proceed to the rest one resource at a time so a problem is easy to isolate.

**Why the Joi fixtures can be replaced here (not just referenced against):** `docs/collections/data/*Joi.js` are documentation fixtures, not consumed code — nothing in the sibling service repos imports them (they pin their own Joi via `waste-movement-utils`). Replacing them is scoped entirely to this repo's own fixtures/docs, not a change to any live service.

**Explicitly out of scope** (raised in the original ask, deliberately deferred):

- Rendering the _event-model_ schema as its own documentation page (hand-written or automated) — tracked as [docs/backlog/automate-event-model-doc-generation.md](../backlog/automate-event-model-doc-generation.md), which also carries the recommended approach (`json-schema-for-humans`) and the reasoning behind it for whoever picks it up. Unaffected by this plan — `openapi.md`'s existing `swagger-ui-tag` render is a separate page from anything event-model-specific.
- A regulator-facing spreadsheet generated from the schema — later phase, format to be discussed separately.
- Relationship/variant graph visualisation — later phase.
- Replacing the hand-written Joi in the actual services (`waste-movement-external-api`/`waste-movement-backend`) with something driven by this JSON Schema — out of scope entirely; those services' Joi is separately maintained via `waste-movement-utils` and unaffected by anything in this repo.

**Sources for field lists/rules**, to reconcile against each other while porting a resource (they may have already drifted slightly from one another):

- `docs/collections/data/*Joi.js` / `*Types.ts` — the POC fixtures; not mechanically ported, but the most detailed source for conditional business rules, and the equivalence-test oracle (see below) while each resource is being replaced.
- `docs/api/openapi.yaml`'s existing inline schemas for the same resource (e.g. `creationCarrierDetails`) — arguably closer to the current target _public contract_ shape, since it's the thing being replaced.
- `docs/collections/model/*.md` (the Mongo storage proposals) — mostly restates rules already visible in the Joi fixtures (`collectionType`/`receivedFromCarrier`, hazardous-consignment-driven rules) rather than adding new field-level detail, but worth checking for anything not in the Joi fixtures (e.g. D-010's hazardous-delivery identifier rule lives here).
- `reference/DWT_API_Field_Reference_v2/{creation,collection,delivery,receipt}-Table 1.csv` — a BA spreadsheet export, one row per field-path, columns Version/Section/Field-Path/Data-Type/Conditionality/Format-rules/Business-rules. Covers all four events, so useful when authoring resources where the Joi fixtures are thinner.

## Decisions (apply these, don't re-derive)

**Location.** New top-level `docs/event-model/`, sibling to `docs/api/` and `docs/collections/` — not nested under `docs/collections/`, since this is meant to be a distinct, independently-referenced artifact. Everything lives under `docs/` — the `.schema.json` source files, and eventually whatever renders them — so GitHub Pages publishes the raw schema files too, which `openapi.yaml`'s `$ref`s need to resolve against (see "Scope" above).

**D-002 note.** `docs/collections/decisions.md`'s D-002 ("Single OpenAPI file, not `$ref`-split") was about splitting `openapi.yaml`'s own component definitions apart, not about referencing an external schema collection — but it's adjacent enough that whoever executes this plan should add a note to D-002 (or a new decision) once `openapi.yaml` actually starts `$ref`-ing outside itself, rather than let D-002 read as still fully in force unqualified.

**File layout.** Mirrors `test/event-model/schema/`'s `common/` vs per-event split:

```
docs/event-model/
  schema/
    common/                        # resources reused across events (mirrors test/event-model/schema/common/)
      <concept>/                   # every resource gets its own folder, even if not a union today —
        <concept>.schema.json      #   avoids moving files if it grows variants later
        (only if it's a discriminator union — see "Union/variant encoding":)
        <concept>-base.schema.json       # fields shared by every variant
        <concept>-<variant>.schema.json  # one file per variant, complete/self-contained
        (only if it has orthogonal conditional-forbidden fields instead:)
        <concept>-base.schema.json               # always-present fields
        <concept>-<axis>-<option>.schema.json    # one small fragment per option, per independent axis
    creation/                      # event-specific: root + variants that differ per event (e.g. waste-item)
      create-movement.schema.json  # event root document
      waste-item/
    collection/  delivery/  receipt/   # same per-event pattern, filled in as their tests demand
  validate/
    index.js                       # compiles schema/common/**/*.schema.json + schema/<event>/**/*.schema.json with ajv, exports validate(name, payload)
    formats.js                     # registers custom ajv `format`s, reusing validator functions imported as-is from docs/collections/data/validators.js
```

Treat Producer (`schema/common/producer/`, once fixed — see "Remaining steps") as the reference example for a discriminator-union resource; treat the carrier worked example below as the reference for an orthogonal-conditional-axes resource. No `.md` page exists for any resource yet — rendering is deferred, see the "Rendering" note below.

**Union/variant encoding — discriminator swaps the whole shape (e.g. Producer's `wasteSource`).** Validated empirically with `json-schema-for-humans` spikes — don't deviate without re-validating rendering:

- Model each union as `<concept>.schema.json` = a `oneOf` of `$ref`s to fully self-contained `<concept>-<variant>.schema.json` files (one per discriminator value), **not** as `if`/`then` conditionals on a single flat object.
- Why: `if`/`then`/`required` alone rendered fine, but there's no clean way to render a conditionally-_forbidden_ field (needed for e.g. `Producer.wasteSource=Household` forbidding `organisationName`) — `"field": false` renders as a misleading plain optional property, and `not`/`anyOf`/`required` renders but is indirect and confusing. Splitting each variant into its own complete file (declaring only the properties that apply, `additionalProperties: false`) sidesteps the problem — it rendered as a clean "One of" table linking to fully self-contained, correctly-labelled variant sections. This same encoding is also what makes the ajv equivalence tests meaningful: a variant's `additionalProperties: false` is what actually rejects a wrongly-present/absent field, not custom logic, so proving the union behaves correctly is the main thing worth testing (see "Runtime validation" below).
- Shared fields across all variants of one union go in `<concept>-base.schema.json`, pulled into each variant via `"allOf": [{"$ref": "<concept>-base.schema.json"}, {variant-specific properties}]`. This renders as two separate, clearly-titled tables per variant (base fields, then variant-specific fields) rather than one merged table — an accepted trade-off, still legible. Give the variant-specific inline fragment its own `"title"` when authoring new ones (don't leave it as an unlabelled "item 1").
- JSON Schema draft: **draft-07** (`http://json-schema.org/draft-07/schema#`) — matches what `json-schema-for-humans` actually supports (confirmed via spike), and what ajv validates without extra configuration.
- `$id` per file: bare filename (e.g. `"$id": "producer-household.schema.json"`), relative `$ref`s between sibling files in the same folder — confirmed this resolves correctly.

**Union/variant encoding — orthogonal conditional-forbidden fields, not a single discriminator (e.g. carrier, hazardous, pops, broker-or-dealer).** These resources have **independent conditional axes** within an otherwise-shared shape rather than one discriminator swapping the whole field set — e.g. carrier has two unrelated toggles: `vehicleRegistration` (required/forbidden by `meansOfTransport`) and `reasonForNoRegistrationNumber` (required/forbidden by `registrationNumber`). A full `oneOf`-of-complete-variants would need one file per *combination* of axes (Road×hasReg, Road×noReg, Rail×hasReg, Rail×noReg, …) — combinatorial and not worth it.

- Instead: **compose one small `oneOf` per independent axis, combined with `allOf`** alongside the always-present base fields. Each axis's `oneOf` branches are small fragments — only the fields that axis owns, `additionalProperties: false` scoped to that axis — so ajv's `allOf` merge independently rejects each axis's wrongly-present/absent field without enumerating the other axis's combinations.
- Worked example, `common/carrier/`:
  ```
  carrier-base.schema.json                         # organisationName, meansOfTransport, address, email, phone
  carrier-vehicle-registration-road.schema.json     # vehicleRegistration required, meansOfTransport const "Road"
  carrier-vehicle-registration-other.schema.json    # vehicleRegistration forbidden, meansOfTransport enum of the rest
  carrier-registration-number-present.schema.json   # registrationNumber (pattern), reasonForNoRegistrationNumber forbidden
  carrier-registration-number-absent.schema.json    # registrationNumber const null/"", reasonForNoRegistrationNumber required
  carrier.schema.json                               # allOf: [base, oneOf(vehicle-registration variants), oneOf(registration-number variants)]
  ```
- Apply this pattern to `hazardous`/`pops` (`sourceOfComponents`→`components` required/forbidden) and `broker-or-dealer` (`registrationNumber`↔`reasonForNoRegistrationNumber`, same axis as carrier's). Carrier itself is a single schema matching the stricter shared `carrierSchema` (`sharedSchemas.js`, the D-008 target shape) — not a Creation-specific looser override; `creationJoi.js` still using its own looser `creationCarrierSchema` is a Joi-side TODO (align it to import `carrierSchema`), not something the JSON Schema forks to accommodate.
- Not yet spiked against `json-schema-for-humans` rendering the way the discriminator-union pattern was — rendering stays out of scope regardless (see "Rendering" below), but re-validate before relying on it once rendering is picked up.

**Rendering.** Deliberately out of scope entirely — see "Explicitly out of scope" above. Full detail, including a validated implementation approach, lives in [docs/backlog/automate-event-model-doc-generation.md](../backlog/automate-event-model-doc-generation.md): in short, an `mkdocs-macros-plugin` hook calling `json_schema_for_humans.generate.generate_from_schema()` was prototyped and confirmed working end-to-end (real `mkdocs build`, real output checked), then rolled back out of this branch to keep it to schema-only. Read that backlog item before re-deciding this from scratch — it also covers why a client-side JS viewer and the one plugin that looked relevant (`mkdocs-json-schema-tag`) were both ruled out.

**Runtime validation (replacing Joi).**

- **Approach: ajv, validating the JSON Schema files directly** — not Joi codegen (no solid "JSON Schema → Joi" generator exists in the ecosystem, unlike the reverse), not Zod (would mean either a third hand-maintained schema copy, or a lossy generated layer; TypeScript is NOT SUPPORTED on Defra's tech radar and Zod isn't on it either, with no upside here since this stays plain JS). The `oneOf`-of-variant-files design already encodes most conditional/forbidden-field rules structurally, so ajv needs no extra cross-field logic for those. The handful of rules that don't reduce to a plain `pattern` (e.g. `isValidPhoneNumber`'s "valid chars AND 7–15 digits after stripping non-digits") are wired in as custom ajv `format`s, reusing `docs/collections/data/validators.js`'s existing exported functions as-is (they're already pure, Joi-independent, boolean-returning) — no rewrite.
- **Node tooling**: root `package.json` (`"type": "module"`, matching the fixtures' existing ESM syntax) with `jest`, `joi`, `prettier` as devDependencies — Jest chosen over Vitest to match the sibling service repos' convention. `ajv`/`ajv-formats` are added once the first resource's JSON Schema is ready to be validated against. Scoped purely to this verification work; doesn't touch the `mkdocs build`/publish pipeline.
- **Test layout**: mirrors the schema path under `test/` — `common/` for resources reused across events, per-event folders (`creation/`, `collection/`, `delivery/`, `receipt/`) for event roots and event-specific variants. Flat within each folder (no per-resource subfolder), one file per resource, cases inlined (no separate cases file):
  ```
  test/event-model/schema/common/producer.test.js
  test/event-model/schema/common/carrier.test.js
  test/event-model/schema/common/broker-or-dealer.test.js
  test/event-model/schema/common/receiver.test.js
  test/event-model/schema/common/address.test.js
  test/event-model/schema/common/weight.test.js
  test/event-model/schema/common/other-reference.test.js
  test/event-model/schema/common/intended-treatment.test.js
  test/event-model/schema/common/actual-treatment.test.js
  test/event-model/schema/common/hazardous.test.js
  test/event-model/schema/common/pops.test.js
  test/event-model/schema/creation/waste-item.test.js
  test/event-model/schema/creation/create-movement.test.js   # event root
  test/event-model/schema/collection/*.test.js                # same pattern
  test/event-model/schema/delivery/*.test.js
  test/event-model/schema/receipt/*.test.js
  ```
- **Test design — one stable file per resource, evolved in three small edits, not rewritten. Plain `test()` blocks, one per condition — no `test.each`/table-driven cases.** Each condition being proven (one per union variant valid, one per forbidden/required-field boundary) gets its own named `test(...)` block, body written by hand rather than pulled from a shared case table:
  1. **Joi-only** (as soon as tooling exists, before that resource's JSON Schema exists):
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
- **Sequencing**: write the Joi-only expectation tests first, independently of and before any new JSON Schema authoring — this can happen as soon as Node/Jest/`joi` tooling exists. Only then move resource-by-resource through JSON-Schema-authoring + the ajv-assertion stage + the Joi-retirement stage. See "Remaining steps" for the concrete order.
- **openapi.yaml/JSON Schema drift**: no separate automated check needed — `openapi.yaml`'s `$ref` points at the exact `.schema.json` file ajv validates, so there's nothing to drift between them. The "build `openapi.md`, eyeball it" step (below) stays the mechanism for catching *rendering* problems; kept manual, not automated, per "tests must be simple, high-level."

## Already built

- **Node tooling** — `package.json` (`"type": "module"`), `jest.config.js`. `jest`, `joi`, `prettier` as devDependencies. Not yet: `ajv`/`ajv-formats`.
- **Joi-only expectation tests, for all four events** — `test/event-model/schema/{common,creation,collection,delivery,receipt}/*.test.js`. Written against the *existing* Joi schemas in `creationJoi.js`/`collectionJoi.js`/`deliveryJoi.js`/`receiptJoi.js`/`receiptWithoutDeliveryJoi.js`/`sharedSchemas.js` — one named `test()` per condition, no `test.each`/tables, lean/high-level per the case-scope decision above.
- `docs/event-model/schema/resources/producer/producer-base.schema.json`, `producer-household.schema.json`, `producer-commercial.schema.json`, `producer-municipal.schema.json`, `producer.schema.json` — real content ported from `docs/collections/data/creationJoi.js`'s `producerSchema` (the `wasteSource`-driven Household/Commercial/Municipal union) and `docs/collections/data/sharedSchemas.js`'s `businessAddressSchema`. Committed on branch `DWTC-151`. **Has known drift from current Joi and from this plan's own union-encoding decision — fix before treating as a template (step 1 below):**
  1. None of the four files set `additionalProperties: false`, so ajv currently accepts a wrongly-present field (e.g. `organisationName` on a Household producer) instead of rejecting it.
  2. `producer-household.schema.json` doesn't forbid `address` — it inherits `producer-base.schema.json`, which requires `address` unconditionally for every variant. Current Joi (and the test `'forbids an address'`) forbids `address` entirely for Household.
  3. `producer-municipal.schema.json` doesn't require `organisationName` — current Joi (and the test `'requires organisationName'` under Municipal) requires it for both Commercial and Municipal, only Household is exempt.

## Remaining steps

1. **Fix Producer, and move it to the new layout.** Against current `creationJoi.js`'s `producerSchema` and `test/event-model/schema/common/producer.test.js`: add `additionalProperties: false` to all four files, make `producer-household.schema.json` forbid `address` (move `address`'s requiredness out of `producer-base.schema.json` and into each non-Household variant), add `organisationName` to `producer-municipal.schema.json`'s required list. Move the folder from `docs/event-model/schema/resources/producer/` to `docs/event-model/schema/common/producer/`. Hand-verify against every case in `common/producer.test.js` before moving on (ajv isn't wired yet — this is a manual check).
2. **Node tooling: add `ajv`/`ajv-formats`.** Build out `docs/event-model/validate/index.js` (compiles `schema/common/**/*.schema.json` + `schema/<event>/**/*.schema.json`, exports `validate(name, payload)`) and `formats.js` (custom ajv `format`s reusing `docs/collections/data/validators.js`'s exported functions as-is). Add the ajv assertion to `common/producer.test.js` as the first proof this wiring works.
3. **Simple common resources — no conditionals.** `address`, `weight`, `other-reference` into `docs/event-model/schema/common/`. Reconcile each against `sharedSchemas.js` and `openapi.yaml`'s equivalent inline schema. Add the ajv assertion to each resource's existing test as it's done.
4. **Treatment resources.** `intended-treatment`, `actual-treatment` into `docs/event-model/schema/common/`. Same treatment.
5. **Broker/dealer resource.** Reconcile `brokerSchema` (Joi) against `openapi.yaml`'s equivalent inline schema into `docs/event-model/schema/common/broker-or-dealer/`. Has one orthogonal conditional axis (`registrationNumber`↔`reasonForNoRegistrationNumber`, same shape as carrier's) — apply the allOf/oneOf pattern from "Union/variant encoding" above.
6. **Carrier resource.** Reconcile `carrierSchema` (`sharedSchemas.js`) against `openapi.yaml`'s `creationCarrierDetails` into `docs/event-model/schema/common/carrier/`, per the carrier worked example above (two independent axes: `meansOfTransport`→`vehicleRegistration`, `registrationNumber`↔`reasonForNoRegistrationNumber`). Single schema for all four events — no Creation-specific override.
7. **Hazardous / POPs resources.** `hazardous`, `pops` into `docs/event-model/schema/common/`, each with one orthogonal conditional axis (`sourceOfComponents`→`components` required/forbidden). Same allOf/oneOf treatment.
8. **Receiver resource.** Reconcile the receiver shape (conditionally required when hazardous waste is present, per D-008) against both sources into `docs/event-model/schema/common/receiver/`.
9. **Retire Joi per common resource, as each goes green.** For each of producer/address/weight/other-reference/intended-treatment/actual-treatment/broker-or-dealer/carrier/hazardous/pops/receiver, once its test's ajv assertion passes and (once wired — see step 12) something references it from `openapi.yaml`: delete that resource's definition from `sharedSchemas.js`/`creationJoi.js`, and drop the Joi assertion line (and its now-unused import) from that resource's test file.
10. **Per-event resources and roots.** For each of `creation`, `collection`, `delivery`, `receipt` in turn: author its event-specific variants (e.g. each event's own `waste-item` shape) into `docs/event-model/schema/<event>/`, then assemble that event's root document (`create-movement.schema.json` etc.), `$ref`-ing the common resources plus its own variants. Creation first (least remaining work — only `waste-item` and the root left once steps 1–9 are done).
11. **Pilot: reference Producer from openapi.yaml.** Replace `producerDetails` with a `$ref` to `../../event-model/schema/common/producer/producer.schema.json` (or wherever the relative path resolves to from `docs/api/openapi.yaml`). Build/check `docs/api/openapi.md` renders sensibly before continuing — this is the cheap, early check for whether the `oneOf`/`const` shape is tolerated by `swagger-ui-tag`'s renderer (see "Scope" above).
12. **Reference the rest, one at a time.** Same swap-and-check for every other resource and event root, per event, one resource per check — not all at once, so a rendering problem is easy to isolate to the resource that caused it.
13. **D-002 note.** Add the note flagged above to `docs/collections/decisions.md` once `openapi.yaml` actually starts `$ref`-ing outside itself.

Rendering the _event-model_ schema as its own page (a `.md` page, MkDocs nav wiring, CI changes) is picked up separately — see [docs/backlog/automate-event-model-doc-generation.md](../backlog/automate-event-model-doc-generation.md) when that's prioritised. It's independent of this plan's `openapi.yaml` wiring above.

## Open questions for whoever picks this up

- Whether resource pages, once the event-model's own rendering exists, get their own nav entries or are only reachable by link from the event page that references them.
- Exact wording/placement of the frontmatter warning block on schema-derived pages, once they exist — currently copied verbatim from the rest of the repo's convention; revisit if the event-model section wants its own framing given it's meant for external software providers eventually (see `CLAUDE.local.md`: "Nothing here is yet guidance for external Software Providers").
- The orthogonal-conditional-axes pattern (carrier/hazardous/pops/broker-or-dealer) hasn't been spiked against `json-schema-for-humans` rendering the way the discriminator-union pattern was — re-validate before relying on it once rendering is picked up.
