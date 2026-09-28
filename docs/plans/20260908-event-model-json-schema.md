# Event model JSON Schema

Branch: `DWTC-151`. Repo: `digital-waste-tracking-api-docs`.

## Problem

Event-model knowledge — the fields and rules the DWT API expects from data providers — is currently scattered across PowerPoint, spreadsheets, `openapi.yaml`, and hand-written Joi fixtures in `docs/collections/data/`. No single source of truth exists, and there's no way to communicate the expected data to software providers without exposing API implementation details.

## Where the conventions now live

The mechanical how-to for writing a resource has moved out of this plan and into the repo itself, since it's now real, working convention rather than a proposal:

- **[`docs/event-model/schema/README.md`](../event-model/schema/README.md)** — how to structure a resource's JSON Schema files, the `oneOf`-of-variant-files pattern for a discriminator union, the `propertyNames.enum` trick for forbidding unknown properties per variant (draft-07's `additionalProperties: false` doesn't compose across an `allOf` of `$ref`s — this replaces an earlier, disproven assumption that it would), `format` vs `pattern`, and the `minLength: 1` gotcha for free-text fields.
- **[`test/README.md`](../../test/README.md)** — the BDD (`Feature`/`Scenario`) test style, the `validateJoi`/`validateAjv` helper pair every test asserts through, and the `test.todo` convention for a deliberate, tracked Joi/ajv gap.

Read those before touching a schema or test file. This plan covers scope, sequencing, and status — not the encoding rules themselves.

## Scope

1. Define the event model using JSON Schema, one file per resource, composed via `$ref` — covering all four events (Creation, Collection, Delivery, Receipt), resource by resource. Shared resources (producer, carrier, broker-or-dealer, receiver, address, weight, other-reference, intended-treatment, actual-treatment, hazardous, pops) are defined once and referenced from whichever events use them; each event also gets its own event-specific resources (e.g. each event has its own waste-item shape) and a root document.
2. Reference those resource files **one by one from `docs/api/openapi.yaml`**, replacing its existing inline schema definitions (`producerDetails`, `creationCarrierDetails`, etc.) with `$ref`s to the new files. **Producer is done** — see "Already built".
3. Replace the hand-written Joi fixtures in `docs/collections/data/*Joi.js` with runtime validation driven by the JSON Schema files (ajv), proven equivalent to the existing Joi behaviour via tests, resource by resource.
4. **Figure out how to get this repo's schema/validation/openapi artifacts into `waste-movement-backend` and `waste-movement-external-api`.** Not yet designed — see "Cross-repo consumption" below. The aim is for the JSON Schema, its documentation, its unit tests, and its validation function to all be defined once, in this repo, and then made consumable by those services rather than hand-re-implemented there.

**Why openapi.yaml can change shape freely here:** it's a _target_ spec used to align with the business on what's being built, not an implemented/consumed contract — the actual implementations live in other OpenAPI specs in the sibling service repos. So swapping a flat, prose-described object for a `$ref`'d `oneOf`-of-variants is not a backward-compatibility concern the way it would be for a live API. `openapi.yaml` is pinned to OpenAPI 3.0.3 (D-003), whose schema dialect doesn't officially include `const` (only added in later JSON Schema drafts / OpenAPI 3.1) — the event-model files use `const` to pin each variant's discriminator value. There's no OpenAPI linter in this repo to catch a mismatch, so the only real signal is whether `docs/api/openapi.md` (the `swagger-ui-tag` render) still displays sensibly — checked for Producer already, recheck per resource as each is wired in.

**Why the Joi fixtures can be replaced here (not just referenced against):** `docs/collections/data/*Joi.js` are documentation fixtures, not consumed code — nothing in the sibling service repos imports them (they pin their own Joi via `waste-movement-utils`). Replacing them is scoped entirely to this repo's own fixtures/docs, not a change to any live service.

**Explicitly out of scope for now:**

- A regulator-facing spreadsheet generated from the schema.
- Relationship/variant graph visualisation.
- Rendering the event-model schema as its own documentation page (hand-written or automated) — a `json-schema-for-humans` + `mkdocs-macros-plugin` approach was spiked and confirmed working, then deliberately rolled back to keep this work to schema-only. No backlog item tracks it any more; pick this up fresh if/when it's prioritised rather than assuming the spike details are still current.

**Sources for field lists/rules**, to reconcile against each other while porting a resource (they may have already drifted slightly from one another):

- `docs/collections/data/*Joi.js` / `*Types.ts` — the POC fixtures; not mechanically ported, but the most detailed source for conditional business rules, and the equivalence-test oracle while each resource is being replaced.
- `docs/api/openapi.yaml`'s existing inline schemas for the same resource (e.g. `creationCarrierDetails`) — arguably closer to the current target _public contract_ shape, since it's the thing being replaced.
- `docs/collections/model/*.md` (the Mongo storage proposals) — mostly restates rules already visible in the Joi fixtures, but worth checking for anything not in the Joi fixtures (e.g. D-010's hazardous-delivery identifier rule lives here).
- `reference/DWT_API_Field_Reference_v2/{creation,collection,delivery,receipt}-Table 1.csv` — a BA spreadsheet export, one row per field-path. Covers all four events, so useful when authoring resources where the Joi fixtures are thinner.

## Decisions (apply these, don't re-derive)

**Location.** `docs/event-model/`, sibling to `docs/api/` and `docs/collections/`. Everything lives under `docs/` so GitHub Pages publishes the raw schema files too, which `openapi.yaml`'s `$ref`s need to resolve against.

**File layout.** Mirrors `test/event-model/schema/`'s `common/` vs per-event split:

```
docs/event-model/
  schema/
    README.md                     # conventions — read this, not this plan, for how-to
    common/                        # resources reused across events
      <concept>/
        <concept>.schema.json      # oneOf of $refs, or a single file if no variants
        <concept>-base.schema.json
        <concept>-<variant>.schema.json
    creation/                      # event-specific: root + variants that differ per event
      create-movement.schema.json
      waste-item/
    collection/  delivery/  receipt/
  validate/
    index.js                       # compiles every *.schema.json under schema/, exports validate(name, payload) / getErrors(name)
    formats.js                     # registers custom ajv `format`s, reusing validator functions from docs/collections/data/validators.js
```

JSON Schema draft: **draft-07**, matching what `json-schema-for-humans` supports and what ajv validates without extra configuration. `$id` per file is the bare filename; `$ref`s between sibling files in the same folder are relative.

**Discriminator unions vs orthogonal conditional axes.** Two distinct shapes recur:

- **Discriminator swaps the whole shape** (Producer's `wasteSource`, and similarly the per-event waste-item/root resources): model as `<concept>.schema.json` = `oneOf` of `$ref`s to fully self-contained `<concept>-<variant>.schema.json` files. See `schema/README.md` for the mechanics (base file, `propertyNames.enum`, etc.).
- **Independent conditional axes within one otherwise-shared shape** (carrier's `meansOfTransport`→`vehicleRegistration` and `registrationNumber`↔`reasonForNoRegistrationNumber`; same `registrationNumber`↔`reasonForNoRegistrationNumber` axis on broker-or-dealer; hazardous/pops's `sourceOfComponents`→`components`): a full `oneOf`-of-complete-variants would need one file per _combination_ of axes, which is combinatorial and not worth it. Instead: compose one small `oneOf` per independent axis, combined with `allOf` alongside the always-present base fields, each axis's branches only owning the fields that axis controls. Worked example for carrier:
  ```
  carrier-base.schema.json                         # organisationName, meansOfTransport, address, email, phone
  carrier-vehicle-registration-road.schema.json     # vehicleRegistration required, meansOfTransport const "Road"
  carrier-vehicle-registration-other.schema.json    # vehicleRegistration forbidden, meansOfTransport enum of the rest
  carrier-registration-number-present.schema.json   # registrationNumber (pattern), reasonForNoRegistrationNumber forbidden
  carrier-registration-number-absent.schema.json    # registrationNumber const null/"", reasonForNoRegistrationNumber required
  carrier.schema.json                               # allOf: [base, oneOf(vehicle-registration variants), oneOf(registration-number variants)]
  ```
  Carrier itself is a single schema matching the stricter shared `carrierSchema` (`sharedSchemas.js`, the D-008 target shape) — not a Creation-specific looser override; `creationJoi.js` still using its own looser `intendedCarrierSchema` is a Joi-side TODO (align it to import `carrierSchema`), not something the JSON Schema forks to accommodate.
  This pattern hasn't been spiked against `json-schema-for-humans` rendering the way the discriminator-union pattern was — irrelevant while rendering stays out of scope, but re-validate before relying on it if rendering is ever picked back up.

**Runtime validation (replacing Joi).** ajv, validating the JSON Schema files directly — not Joi codegen, not Zod (TypeScript is NOT SUPPORTED on Defra's tech radar; no upside here since this stays plain JS). The `oneOf`-of-variant-files design already encodes most conditional/forbidden-field rules structurally, so ajv needs no extra cross-field logic for those. The handful of rules that don't reduce to a plain `pattern` are wired in as custom ajv `format`s reusing `docs/collections/data/validators.js`'s existing exported functions as-is — see `formats.js` and `schema/README.md`.

**Test design.** See `test/README.md` — BDD `Feature`/`Scenario` style is now the house convention for every resource, not just Producer; several older files (`carrier.test.js`, `address.test.js`, …) are legacy plain-style and get migrated opportunistically when touched, not in a big-bang rewrite. Sequencing per resource: Joi-only BDD tests already exist for everything (see "Already built"); each resource then gets its JSON Schema authored, a `validateAjv()` helper added to its test file, and a second assertion added to every existing test — not a rewrite.

**openapi.yaml/JSON Schema drift.** No separate automated check needed — `openapi.yaml`'s `$ref` points at the exact `.schema.json` file ajv validates, so there's nothing to drift between them. "Build `openapi.md`, eyeball it" stays the (manual) mechanism for catching rendering problems.

**OpenAPI 3.1 (new, undecided — supersedes D-003 once written up).** D-003 ("OpenAPI 3.0.3, not 3.1") predates this plan and was about matching Phase 1, not about hosting `$ref`'d JSON Schema. 3.0.3's schema dialect doesn't officially support `const` (added in later JSON Schema drafts / OpenAPI 3.1), which the event-model's discriminator-union variants rely on — so far this has only been a soft risk flagged for the `openapi.md` render to catch, not a blocker. Producer rendered fine regardless, but as more `oneOf`/`const` resources get wired in, moving `openapi.yaml` to 3.1 is likely to become a real decision, not just a watch-item. Not writing the decision now — flagging it here so whoever hits a real 3.0.3/3.1 rendering problem knows it's coming and isn't starting from scratch. When it's written up, it supersedes/qualifies D-003 the same way the D-002 note (above) qualifies D-002.

**Cross-repo consumption (new, undecided).** The ask is to get this repo's JSON Schema, its docs, its unit tests, and its ajv validation function all defined in one place (here), then make that consumable by `waste-movement-backend` and `waste-movement-external-api` — not to hand-port rules into their Joi again. Nothing is decided yet; the closest existing precedent in this workspace is `waste-movement-utils`, which both of those services already consume as a real published, versioned package (`@defra/waste-movement-utils`, semver-pinned in each `package.json` — not a GitHub-SHA pin, contrary to how the cross-repo `CLAUDE.md` currently describes it). Whether this repo's event-model should be distributed the same way (its own package), folded into `waste-movement-utils` itself, or something else (e.g. services fetching the published schema files from GitHub Pages at build/boot time) is the open question — investigate before committing to one. See "Remaining steps" and "Open questions".

## Already built

- **Node tooling** — `package.json` (`"type": "module"`), `jest.config.js`, `jest`/`joi`/`ajv`/`ajv-formats`/`prettier` as devDependencies.
- **`docs/event-model/validate/index.js` + `formats.js`** — working ajv wiring. `index.js` recursively picks up every `*.schema.json` under `docs/event-model/schema/` and registers it by its own `$id`, no manifest to maintain; exports `validate(name, payload)` / `getErrors(name)`. `formats.js` registers `authorisationNumber`, `phoneNumber`, `postcode` as custom formats, reusing `docs/collections/data/validators.js` as-is.
- **Producer — the completed reference example**, `docs/event-model/schema/common/producer/` (`producer-base`, `producer-household`, `producer-commercial`, `producer-municipal`, `producer.schema.json`): matches current `creationJoi.js` behaviour exactly (verified via `test/event-model/schema/common/producer.test.js`, BDD style, every scenario asserting both `validateJoi` and `validateAjv`). Uses the `propertyNames.enum` per-variant forbidding pattern now documented in `schema/README.md`. **Already referenced from `docs/api/openapi.yaml`** (line ~709, `producer: $ref: '../event-model/schema/common/producer/producer.schema.json'`) — the openapi.yaml pilot step is done. Joi's `producerSchema` in `creationJoi.js` has *not* been deleted yet — that's the retirement step, still pending.
- **Joi-only BDD/legacy expectation tests already exist for every other resource**, written against the current Joi schemas, no JSON Schema or `validateAjv()` yet:
  - `test/event-model/schema/common/`: `address`, `weight`, `other-reference`, `intended-treatment`, `actual-treatment`, `broker-or-dealer`, `carrier`, `hazardous`, `pops`, `receiver`.
  - `test/event-model/schema/creation/`: `waste-item`, `intended-carrier`, `create-movement` (event root).
  - `test/event-model/schema/collection/`: `collection-site`, `received-from-carrier`.
  - `test/event-model/schema/delivery/`: `delivery-site`, `record-delivery`, `update-delivery`.
  - `test/event-model/schema/receipt/`: `receipt-movement`, `receipt-site`, `receipt-without-delivery`, `waste-item`.
- **`docs/event-model/schema/README.md` and `test/README.md`** — the living convention docs described above.

## Remaining steps

Resource-by-resource, each step is: reconcile the resource's Joi/openapi.yaml/model-doc sources, author its JSON Schema per `schema/README.md`, add `validateAjv()` + a second assertion to its existing test file, hand-check it against `docs/api/openapi.md`'s render once wired into `openapi.yaml`, then delete the Joi definition and drop the `validateJoi()` line once its test is fully green on ajv.

1. **Simple common resources — no conditionals.** `address`, `weight`, `other-reference` into `docs/event-model/schema/common/`.
2. **Treatment resources.** `intended-treatment`, `actual-treatment`.
3. **Broker/dealer resource.** One orthogonal conditional axis (`registrationNumber`↔`reasonForNoRegistrationNumber`) — apply the axis pattern above.
4. **Carrier resource.** Two independent axes (`meansOfTransport`→`vehicleRegistration`, `registrationNumber`↔`reasonForNoRegistrationNumber`). Single schema for all four events, matching `carrierSchema` (`sharedSchemas.js`) — not a Creation-specific override.
5. **Hazardous / POPs resources.** One orthogonal axis each (`sourceOfComponents`→`components`).
6. **Receiver resource.** Conditionally required when hazardous waste is present (D-008).
7. **Reference each resource from `openapi.yaml`** as it's ready — one resource per check, so a rendering problem is easy to isolate. (Producer already done.)
8. **Per-event resources and roots.** For each of `creation`, `collection`, `delivery`, `receipt` in turn: author its event-specific variants (e.g. each event's own `waste-item` shape) into `docs/event-model/schema/<event>/`, then assemble that event's root document, `$ref`-ing the common resources plus its own variants. Creation first — least remaining work once steps 1–6 land.
9. **D-002 note.** `docs/collections/decisions.md`'s D-002 ("Single OpenAPI file, not `$ref`-split") predates `openapi.yaml` referencing anything outside itself — now that Producer does, add a short note to D-002 (or a new decision) qualifying it, rather than leaving D-002 reading as still fully in force unqualified. Still pending.
10. **Cross-repo consumption — investigate, then decide.** Once there's more than Producer to offer (or sooner, if useful to de-risk early): work out how `waste-movement-backend` and `waste-movement-external-api` consume this repo's schema/docs/tests/validation. Concretely, at minimum: check how `@defra/waste-movement-utils` is actually published (registry, CI step) as the nearest precedent; decide whether the event-model becomes its own published package, gets folded into `waste-movement-utils`, or is consumed a different way (e.g. raw schema files fetched from GitHub Pages); confirm whether "consume" means schema+ajv validation only, or also replacing those services' hand-written Joi (the original plan treated the latter as fully out of scope — that's no longer settled, see Scope item 4). Nothing here should block resource-by-resource progress in the meantime.

## Open questions for whoever picks this up

- Whether/when to move `openapi.yaml` to OpenAPI 3.1 (see "OpenAPI 3.1" above) — not urgent while `openapi.md` keeps rendering fine on 3.0.3, but likely forced once more `const`-bearing resources are wired in.
- The cross-repo consumption mechanism (see "Cross-repo consumption" above) — no candidate has been chosen yet, just the observation that `@defra/waste-movement-utils` is the closest existing pattern.
- Whether replacing `waste-movement-backend`/`waste-movement-external-api`'s own Joi with something driven by this JSON Schema is actually intended, or whether "consuming" this repo's output means something narrower (e.g. just the OpenAPI contract, or docs). Clarify before designing the distribution mechanism — the answer changes what "consumable" needs to mean.
- The orthogonal-conditional-axes pattern (carrier/hazardous/pops/broker-or-dealer) hasn't been spiked against `json-schema-for-humans` rendering. Irrelevant while rendering is out of scope; re-validate first if that ever changes.
