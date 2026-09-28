---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# Payload Resource Analysis

Research note scoping a future extraction of the four Phase 2 event payloads into standalone, `$ref`-composed JSON Schema files. Covers what resources the payloads share, where they diverge, and — since several fields are conditionally required/forbidden depending on sibling values ("union-typed" in the loose sense, not discriminator-tagged `oneOf`s) — where the [`data/`](../data/) Joi schemas express rules the OpenAPI spec can only describe in prose. This is an analysis record, not a decision; anything acted on from it belongs in the [decisions register](../decisions.md).

Scope: the four core event endpoints, plus the related `POST /receipts` (D-041) endpoint. A placeholder Jest suite exercising every schema and sub-schema named below now lives at [`test/event-model/schema/`](../../../test/event-model/schema/) — many of its header comments and `test.todo` entries double as a live tracker of exactly the gaps and inconsistencies this analysis flags, so each is cited alongside the corresponding finding below rather than only described in prose. A first, partial JSON Schema extraction has also started at [`docs/event-model/schema/resources/producer/`](../../event-model/schema/resources/producer/) — see §3 and §6 for how it compares to the current Joi.

## Contents

- [1. Endpoint → schema mapping](#1-endpoint--schema-mapping)
- [2. Shared sub-resources](#2-shared-sub-resources)
- [3. The two genuinely union-typed resources](#3-the-two-genuinely-union-typed-resources)
- [4. Conditional (if/then-shaped) rules catalog](#4-conditional-ifthen-shaped-rules-catalog)
- [5. Per-event resource presence](#5-per-event-resource-presence-whats-absent-not-just-whats-shared)
- [6. Suggested JSON Schema decomposition](#6-suggested-json-schema-decomposition)

## 1. Endpoint → schema mapping

Naming note: what's sometimes called "transfers" is `/deliveries` in this repo.

| Endpoint | OpenAPI schema | Joi file | Root-level tests |
| --- | --- | --- | --- |
| `POST /movements` | `createMovementRequest` (`api/openapi.yaml:684`) | `creationJoi.js` → `createMovementSchema` | `creation/create-movement.test.js` |
| `POST /movements/{movementId}/collection` | `collectionRequest` (`api/openapi.yaml:842`) | `collectionJoi.js` → `recordCollectionSchema` | `collection/collection-site.test.js`, `collection/received-from-carrier.test.js` |
| `POST /deliveries` ("transfers") | `deliveryRequest` (`api/openapi.yaml:1008`) | `deliveryJoi.js` → `recordDeliverySchema` | `delivery/record-delivery.test.js`, `delivery/delivery-site.test.js`, `delivery/update-delivery.test.js` |
| `POST /deliveries/{deliveryId}/receipt` | `receiveMovementRequest` (`api/openapi.yaml:1940`) | `receiptJoi.js` → `receiptMovementSchema` | `receipt/receipt-movement.test.js`, `receipt/receipt-site.test.js`, `receipt/waste-item.test.js` |

A fifth, related endpoint used to be describable as "reuses one of these wholesale": `POST /receipts` (D-041, `receiptWithoutDeliveryRequest`, `api/openapi.yaml:1184`) = `receiptWithoutDeliveryJoi.js` → `receiptWithoutDeliverySchema` (tests: `receipt/receipt-without-delivery.test.js`). That's no longer true. It was previously built as `receiptMovementSchema.keys({ reasonForNoDeliveryId: ... })` — a clean allOf/extend case. Since D-042 landed, `POST /receipts`'s `wasteItems` needs the **full** classification (no prior Creation/Delivery record exists to source `ewcCodes`/`wasteDescription`/`pops`/`hazardous` from), whereas the ordinary Receipt endpoint's `wasteItems` deliberately **drops** classification (a Creation record already carries it). Those are two different shapes, not one shape plus a field, so `receiptWithoutDeliveryJoi.js` is now built independently: its own root object, importing `wasteItemBaseSchema`/`actualTreatmentSchema`/`carrierSchema`/`brokerSchema` from `sharedSchemas.js` directly rather than extending `receiptMovementSchema`. See §2 for what it still hand-duplicates instead of importing, and §6 for what this means for the suggested `$ref` decomposition.

## 2. Shared sub-resources

`sharedSchemas.js` is the common layer, imported by all five event files (`creationJoi.js`, `collectionJoi.js`, `deliveryJoi.js`, `receiptJoi.js`, `receiptWithoutDeliveryJoi.js`). The genuine duplicates flagged in an earlier pass of this analysis were fixed in `receiptJoi.js` — it now imports `weightSchema`, `businessAddressSchema`, `otherReferenceSchema`, `carrierSchema` and `brokerSchema` rather than hand-duplicating them, keeping only its genuinely Receipt-specific shapes (`receiptWasteItemSchema`, `receiverSiteSchema`, `receiptAddressSchema`, `receiptSiteSchema`) local and exported for testing. `receiptWithoutDeliveryJoi.js` (added for D-041/D-042) is the new outlier: per its own header comment, it duplicates `otherReferenceSchema`, `receiptAddressSchema`, `receiptSiteSchema` and `receiverSiteSchema` locally rather than importing them from `sharedSchemas.js`/`receiptJoi.js`, "since that file doesn't currently export them." That's the same duplication pattern already fixed once for `receiptJoi.js` — worth folding in during any future extraction rather than re-baking as three copies of the same rule.

| Resource | Identical everywhere? | Used by |
| --- | --- | --- |
| `weight` (metric/amount/isEstimate) | ✅ identical | wasteItem (creation, both receipt endpoints), `intendedTreatment`/`actualTreatment` entries — collection/delivery carry no waste weight at all, see §5 |
| `otherReferenceForMovement` (label/reference) | ✅ identical shape, but `receiptWithoutDeliveryJoi.js` still holds its own local copy instead of importing | creation, collection, delivery, receipt (imported); `POST /receipts` (local duplicate) |
| `pops` / `popComponent` | ✅ identical | any event whose `wasteItems` carries classification: creation, `POST /receipts` — **not** the ordinary Receipt endpoint (see §5) |
| `hazardous` / `hazardousComponent` | ✅ identical | same as `pops` above |
| `intendedTreatment` (code+weight, both mandatory) | own schema, `intendedTreatmentSchema` | creation only, `intendedTreatments` (min 1, required) |
| `actualTreatment` (code optional, weight conditional) | own schema, `actualTreatmentSchema` | ordinary Receipt and `POST /receipts`, `actualTreatments` (optional array) |
| `driverDetails` | defined but **unused** | none of the five event schemas actually reference it (matches OpenAPI's "reserved" note) |
| `address` | ⚠️ family of variants, not one resource — see below | all |
| `carrier` | ⚠️ two profiles — see §3 | collection/delivery/receipt/`POST /receipts` use the "full" profile; creation uses a relaxed profile |
| `brokerOrDealer` | ✅ identical shape (shared `brokerSchema`), absent from delivery | creation, collection, receipt, `POST /receipts` |

**`intendedTreatment`/`actualTreatment` (D-031 amended)** replace what an earlier pass of this analysis called one `disposalOrRecoveryCode` resource used two ways. They're now genuinely two named schemas in `sharedSchemas.js` (`intendedTreatmentSchema:148-176`, `actualTreatmentSchema:178-211`), not one shape with inline requiredness differences — but they still share the same underlying `disposalOrRecoveryCode` + `weight` field pair, so the split is worth keeping visible in any `$ref` decomposition (e.g. a shared `treatment-base.json` with two thin requiredness overlays) rather than two unrelated definitions. See §4 for the `weight`-required-iff-`disposalOrRecoveryCode`-supplied rule that's new to `actualTreatmentSchema`.

**Address is really a 2×2 family, not one resource** — worth a single base definition parameterised two ways rather than four separate schemas:

- postcode format: UK+Irish (`businessAddressSchema`, `sharedSchemas.js:218`) vs UK-only (`receiptAddressSchema`, standalone in both `receiptJoi.js:72` and, now duplicated a second time, `receiptWithoutDeliveryJoi.js:111`)
- `fullAddress` requiredness: optional (plain business address) vs required (`collectionSite.address`, `deliverySite.address`, creation's `receiver.address`/`collectionSite` when populated — all built by `.keys({ fullAddress: required })` over the base, via the shared `siteAddressSchema`, `sharedSchemas.js:232`)

`common/address.test.js` formally flags `receiptAddressSchema` as "the pending outlier still to converge" — a standalone reimplementation, not built on `businessAddressSchema`, that also drops Irish Eircode support. That's still true, and now applies to two copies instead of one.

## 3. The two genuinely union-typed resources

### `carrier`

Same field set, two required-field profiles:

- **Full profile** (`sharedSchemas.js:531` `carrierSchema`): used by collection, delivery, receipt, `POST /receipts`. `meansOfTransport`, `organisationName`, `registrationNumber` all required (`registrationNumber` may be `null`/`''`).
- **Creation profile** (`creationJoi.js:316` `creationCarrierSchema`): only `meansOfTransport` required; everything else optional.

Not just "fewer required fields" — the _conditional_ logic itself differs subtly, which matters for how the `if/then` would be written:

- Full profile: `reasonForNoRegistrationNumber` is **required** when `registrationNumber` is null/empty, **forbidden** otherwise (`sharedSchemas.js:547-560`).
- Creation profile: `reasonForNoRegistrationNumber` is **forbidden** when a real `registrationNumber` is present, **optional** (not required) otherwise (`creationJoi.js:329-341`) — because at creation neither may be known yet.
- `otherMeansOfTransport`: the creation profile forbids it unless `meansOfTransport === 'Other'` (`creationJoi.js:356-363`); the full profile has **no such constraint at all** — it's just a free string, always allowed regardless of `meansOfTransport` (`sharedSchemas.js:573`). Still a real inconsistency, not an intentional design difference. `common/carrier.test.js` now tracks it explicitly as `test.todo('documents whether otherMeansOfTransport should stay unconstrained here, or be forbidden-unless-Other to match creationCarrierSchema (flagged inconsistency)')`, alongside a second `test.todo` for the longer-term intent that `creationJoi.js` should import `carrierSchema` directly and drop `creationCarrierSchema` once Creation's carrier rules are tightened to match.

A clean JSON Schema decomposition: one `carrier.json` base (all properties + the `vehicleRegistration`-requires-`Road` rule, which _is_ consistent everywhere), then two thin overlays via `allOf`/`if-then` for "required-field profile: full" vs "…: creation", rather than two forked copies.

### `producer.wasteSource`

(`creationJoi.js:229` `producerSchema`) — still the closest thing here to a textbook `oneOf`, though the asymmetry between branches has narrowed since this analysis was first written:

- `Commercial`: `organisationName`, `sicCode`, `address` **required**; `authorisationNumber`, `emailAddress`, `phoneNumber` **optional**.
- `Municipal`: same as Commercial except `sicCode` is **optional** rather than required — the only field-requiredness difference between the two branches now.
- `Household`: `organisationName`, `authorisationNumber`, `sicCode`, `emailAddress`, `phoneNumber` and `address` are all **forbidden**; only `wasteSource` and `councilMovement` apply.

This still maps cleanly to JSON Schema `oneOf` branches keyed on `wasteSource: {const: ...}`, each with its own `required`/disallowed list.

**A first extraction has already started, and has already drifted from the Joi above.** [`docs/event-model/schema/resources/producer/`](../../event-model/schema/resources/producer/) has exactly this `oneOf` shape (`producer.schema.json` → `producer-commercial.schema.json` / `producer-household.schema.json` / `producer-municipal.schema.json`, each `allOf`-ing a shared `producer-base.schema.json`), but it was written before the producer requiredness rules above settled and needs realigning before it's extended to other resources:

- `producer-commercial.schema.json` lists `authorisationNumber` in its `required` array — the current Joi (`producerSchema.authorisationNumber`, `creationJoi.js:245-258`) makes it optional for Commercial.
- `producer-base.schema.json` requires `address` unconditionally (`"required": ["address", "councilMovement"]`), and `producer-household.schema.json` inherits that via `allOf` — so as written, the POC schema requires an `address` for Household producers, where the Joi (`creationJoi.js:296-302`) explicitly forbids one.

## 4. Conditional (if/then-shaped) rules catalog

Everything below is a same-object `Joi.when()` — a good match for JSON Schema `if/then/else` — except the two custom-validator rows at the bottom.

| Rule | Where | Notes |
| --- | --- | --- |
| `vehicleRegistration` required iff `meansOfTransport==='Road'`, forbidden otherwise | `carrier` (all profiles) | Consistent everywhere |
| `registrationNumber`⇄`reasonForNoRegistrationNumber` mutual exclusivity | `carrier` (full profile) | See asymmetry above vs creation profile |
| `weight` required iff `disposalOrRecoveryCode` supplied | `actualTreatmentSchema` (`sharedSchemas.js:201-207`) | New to the D-031 amended split — `intendedTreatmentSchema` has no equivalent conditionality; both its fields are unconditionally required |
| `receiver.authorisationNumber` + `receiver.address` required iff `receiver.siteName` present | creation `receiverSchema` (`creationJoi.js:168`) | Simple existence-trigger, not a value-match — easiest case. Receipt's `receiverSiteSchema` (`receiptJoi.js:141`) is a **different** resource under an adjacent name, not a variant of this one: `siteName` and `authorisationNumber` are unconditionally required, it adds `regulatoryPositionStatements`, and has no nested `address` at all (address lives separately on `receipt.address`). `common/receiver.test.js` formally flags reconciling the two as future work, once Receipt is updated to match this shape. |
| `pops`/`hazardous` object required iff `containsPops`/`containsHazardous===true`, forbidden otherwise | any `wasteItems` with classification: creation, `POST /receipts` | Single definition in `sharedSchemas.js` (`wasteItemClassificationSchema:411-463`) — no longer duplicated per file |
| `components` required iff `sourceOfComponents` in `(GUIDANCE, OWN_TESTING)`, forbidden iff `NOT_PROVIDED`, optional iff `PROVIDED_WITH_WASTE` | `pops`, `hazardous` (`sharedSchemas.js:296-317`, `:369-398`) | 3-way switch, identical for both pops and hazardous. Single definition, imported everywhere classification appears. |
| `collectionType==='TRANSIT'` ⇒ `receivedFromCarrier` required; `STATIC` ⇒ forbidden | **documented** in `api/openapi.yaml:909-920` and in `collectionJoi.js`'s own header comment | **Still not actually implemented** — `collectionJoi.js:142` uses plain `carrierSchema` with no `.when()` tying it to `collectionType`. `collection/received-from-carrier.test.js` now formally tracks this: its two active tests assert today's unenforced behaviour (both TRANSIT-without and STATIC-with pass validation), with `test.todo` entries recording the rejections that should exist once the D-029 rule is wired up. Decide which is the source of truth before encoding it in JSON Schema. |
| `hazardousWasteConsignmentCode`⇄`reasonForNoConsignmentCode` mutual exclusivity, and the latter required when any `wasteItems[].ewcCodes` is hazardous and no code given | creation (`creationJoi.js:68-101`), `POST /receipts` (`receiptWithoutDeliveryJoi.js:69-93`, near-identical duplicate of creation's), ordinary receipt — mutual-exclusivity half only (`receiptJoi.js:55-68`) | Implemented as a whole-object `.custom()` validator, **not** `.when()`, in all three places — it depends on scanning an array (`wasteItems[].ewcCodes`). Plain JSON Schema `if/then` can't express "any array item matches X" cleanly; `contains` gets you partway but it's the one rule that resists clean decomposition. The ordinary Receipt endpoint can only check the mutual-exclusivity half, since its `wasteItems` drops classification (D-042) — the "required when hazardous" half is enforced server-side against the linked Movement instead. Worth documenting as prose next to the schema rather than forcing it into `if/then`, and worth extracting the near-duplicate creation/`POST /receipts` logic into one shared helper before any extraction, since they're now two copies of essentially the same function. |
| `deliveryUpdateRequest`: only `apiCode`+`isDeleted` allowed | `deliveryJoi.js:144`, `additionalProperties:false` (`.unknown(false)`) | Not conditional — a deliberately restricted sibling of `deliveryRequest`, not a variant of it (fields don't overlap enough for `allOf`) |

## 5. Per-event resource presence (what's absent, not just what's shared)

- **`wasteItems`/`weight` only exist on creation and the two receipt endpoints.** Collection and delivery carry no waste classification or weight at all — `collectionJoi.js`/`deliveryJoi.js` and their event fixtures confirm no such field exists. The stale claim flagged in an earlier pass of this analysis (`api/openapi.yaml`'s comment on `collectionRequest` claiming _"Only actual weights are captured here"_) hasn't been fixed, only relocated: it's no longer in the rendered `description` field of `collectionRequest` (which now just reads "Request body for POST /movements/{movementId}/collection."), but persists as a source-level YAML comment directly above the schema (`api/openapi.yaml:836-838`) — invisible in the published Swagger UI, but still wrong against `collectionJoi.js`/`collectionEvent.js`, and still worth a decision-register note or a straight removal.
- **The two receipt endpoints no longer share one `wasteItems` shape** (see §1). The ordinary Receipt endpoint (`POST /deliveries/{deliveryId}/receipt`) drops classification entirely — a prior Creation record already carries it. `POST /receipts` carries the full classification, since it has no prior Creation/Delivery record to source it from. This is why `pops`/`hazardous`/the hazardous-consignment-code rule apply differently across the three "has waste items" endpoints (see §4) — it isn't just a creation-vs-receipt split any more.
- **`brokerOrDealer` is absent from `deliveryRequest`** (present in creation, collection, receipt, `POST /receipts`).
- **Treatment requiredness no longer "flips" on one shared shape — it's two distinct named sub-resources** (see §2): `intendedTreatments` (creation, min 1, required, each entry's `disposalOrRecoveryCode`+`weight` both mandatory) vs `actualTreatments` (ordinary receipt and `POST /receipts`, optional array, each entry's `disposalOrRecoveryCode` itself optional with `weight` conditional on it — D-031 amended).

## 6. Suggested JSON Schema decomposition

Given the above, a rough split into:

- `primitives/` — `weight.json`, `otherReference.json`, `treatment-base.json` (+ `intendedTreatment.json`/`actualTreatment.json` overlays — see §2), `address-base.json` (+ two thin variants: `address-uk-irl.json`, `address-uk-only.json`, and a `full-address-required` overlay applied via `allOf`)
- `parties/` — `carrier-base.json` (shape) + `carrier-full.json`/`carrier-creation.json` (requiredness overlays via `allOf`+`if/then`), `brokerOrDealer.json`, `producer.json` (the `oneOf` on `wasteSource` — realign the existing POC first, see §3), `receiver-creation.json`/`receiver-receipt.json` (two genuinely different shapes, not one — see §4)
- `waste/` — `wasteItem-base.json` (shared classification + logistics fields) + creation/`POST /receipts` overlays for `intendedTreatments`/`actualTreatments`, and a light `wasteItem-receipt.json` (no classification) for the ordinary Receipt endpoint
- `sites/` — `collectionSite.json`, `deliverySite.json`, `receiptSite.json`
- `events/` — `createMovement.json`, `recordCollection.json`, `recordDelivery.json`, `receiveMovement.json` (the light `wasteItem-receipt.json` variant), `receiveWithoutDelivery.json` (the `wasteItem-base.json` variant + `reasonForNoDeliveryId`), each composing the above via `$ref`. `receiveWithoutDelivery.json` can **no longer** be modelled as `allOf: [receiveMovement.json, {required:[reasonForNoDeliveryId]}]`, per §1 — its `wasteItems` diverges in shape from `receiveMovement.json`'s, not just in one added root field, so it needs to compose the shared root-field primitives directly and swap in the full `wasteItem-base.json` variant instead of extending the other event schema.

Before doing that extraction, several things are worth resolving first, since encoding them as-is would bake in bugs/inconsistencies (or, for the producer POC, an already-existing drift) rather than intentional design:

1. `receivedFromCarrier` requiredness vs `collectionType` — documented but not implemented (`collection/received-from-carrier.test.js`).
2. `carrier.otherMeansOfTransport` forbidden-unless-Other — only enforced in the creation profile, not the shared/receipt one (`common/carrier.test.js`).
3. The stale "weights captured at collection" comment in `api/openapi.yaml` — still present, now hidden in a source-only comment rather than the rendered spec.
4. Reconcile creation's `receiverSchema` and receipt's `receiverSiteSchema` — two different shapes under adjacent names, flagged for convergence in `common/receiver.test.js`.
5. Realign `docs/event-model/schema/resources/producer/` with the current `producerSchema` (`authorisationNumber` requiredness, `address` on Household) before extracting any further resources with it as the template.
6. Fold `receiptWithoutDeliveryJoi.js`'s local duplicates of `otherReferenceSchema`/`receiptAddressSchema`/`receiptSiteSchema`/`receiverSiteSchema` into shared imports — the same duplication pattern already fixed once for `receiptJoi.js` (§2).
