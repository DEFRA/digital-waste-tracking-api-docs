---
search:
  exclude: true
robots: noindex, nofollow
---

# Schemas

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

Every `*.schema.json` file in this folder, the named `*.examples.json` beside them, and each version's `openapi.json` are copied verbatim from [`waste-movement-backend`](https://github.com/DEFRA/waste-movement-backend)'s `src/schemas/`, preserving that folder's layout. This README is the one file here that the sync does not touch.

Both API versions are mirrored, each keeping its version prefix:

```
beta-1/                             # the live Receipt of Waste endpoints
  openapi.json                      # the beta-1 spec — $refs the files beside it
  common/                           # ids, wasteType, delivery-item, issue, validation
  create-movement-request.schema.json
  create-movement-response.schema.json
  record-receipt-request.schema.json
  record-receipt-response.schema.json
  …
beta-2/                             # the Phase 2 event model
  openapi.json                      # the beta-2 spec — $refs the files beside it
  common/
    address.schema.json
    contact-details.schema.json
    movement-id.schema.json
    producer/
      producer.schema.json          # the choice: household, commercial or municipal
      producer-base.schema.json     # the fields all three share
      producer-household.schema.json
      producer-commercial.schema.json
      producer-municipal.schema.json
    …
  creation/
    create-movement-request.schema.json
    create-movement-response.schema.json
  …
```

Every whole request or response body is named after the backend route it belongs to, with a `-request` or `-response` suffix; the resources they are built from keep resource names.

The version prefix is not decoration: each file's path from this folder matches its own `$id` (`"beta-2/common/producer/producer.schema.json"`), which is the relationship the backend's loader asserts. Every `$ref` between these files is relative and stays within its version, so the tree resolves standalone. A future `beta-3` is picked up by the sync with no change to the script.

## Do not edit anything in this folder

Changes made here are silently overwritten by the next sync. A change to a rule or a beta spec — in either version — is a PR against `waste-movement-backend`; once it is on `main`, it arrives here by running:

```bash
npm run schemas:sync
```

Commit the result with the upstream SHA the script prints, e.g. `chore: sync schemas from waste-movement-backend@<sha>`.

## The backend is the source of truth

These files are what the running service validates against. The beta-2 files may look different from the hand-maintained copies this folder replaced (the former `docs/event-model/schema/`, singular, now deleted) — a field renamed, a rule tightened, a structure reshaped. **That is expected, and is not drift to reconcile here.** If a difference looks wrong, the conversation belongs in `waste-movement-backend`.

The snapshot always tracks latest `main`; there is no pinned SHA. Git holds the provenance — the committed diffs of this folder are its history. The `Schemas / schemas:sync` workflow re-runs the sync on every PR (and on demand), and fails visibly — but non-blocking — when this snapshot no longer matches upstream. There is no scheduled run, so a backend-side change lands here when the next PR opens rather than the moment it is merged.

## When a schema arrives here

A sync that brings a resource across for the first time is not finished when the files land — that resource already exists twice more in this repo, as a Joi fixture under `docs/collections/data/` and as its spec shape in `docs/api/openapi.yaml`, and both now have a source of truth above them. Producer went through this in [#78](https://github.com/DEFRA/digital-waste-tracking-api-docs/pull/78), Broker or Dealer after it; the steps below are what those two settled on.

**1. Deprecate the Joi fixture — do not delete it.** Add an `@deprecated` JSDoc block to the export naming the mirror path, saying the synced schema wins, and listing the divergences you can actually see. The fixture stays because the rest of its event file still composes it and would stop being readable without it. `producerSchema` in `creationJoi.js` and `brokerSchema` in `sharedSchemas.js` are the two worked examples. If the file's header comment describes the resource's rules, add a closing paragraph marking it as the exception — the bullets above it now describe the fixture, not what the service enforces.

**2. Delete the fixture's test under `test/event-model/schema/`.** These schemas are tested upstream beside the schema files, so a doc-side test of the same rules is a second, staler copy. Then grep for the deleted file: sibling tests cite each other in their header comments (`create-movement.test.js` lists which sub-schemas are "covered elsewhere"), and those lists go stale silently.

**3. Swap the `$ref` in `docs/api/openapi.yaml`, per endpoint rather than per field name.** The path is relative to `docs/api/`, e.g. `../event-model/schemas/beta-2/common/producer/producer.schema.json`. Drop any `allOf` + `description` wrapper around the old internal `$ref`: the synced schema carries its own description, and the inline one is usually about to become wrong — both broker descriptions still claimed the Phase 1 shape. Delete the local `#/components/schemas/…` component only once nothing else refers to it. `producerDetails` had exactly one consumer and went; `brokerOrDealer` had four and stayed.

**4. Leave the deprecated Phase 1 endpoints alone.** `POST /movements/receive` and `PUT /movements/{wasteTrackingId}/receive` keep the shapes they shipped with. The trap is that a request schema can serve both sides of the Phase 1 / Phase 2 line: `receiveMovementRequest` is shared by those two **and** by the live `POST`/`PUT /deliveries/{deliveryId}/receipt`, so swapping a `$ref` inside it changes all four at once. Where that happens, the Phase 1 constraint wins and the live endpoint keeps the old shape too — splitting the schema to separate them is a deliberate change worth its own conversation, not something to do in passing. Check what a schema actually feeds before editing it.

Two things worth knowing about what will and will not catch a mistake here. `test/api/openapi-dialect.test.js` does not resolve `$ref`s — it checks the synced schemas' 2020-12 dialect and absent `$id`s — and `openapi.yaml` is neither bundled nor tested, so nothing in the repo resolves its refs, so a new external `$ref` is worth walking by hand, including the nested hops (`broker-or-dealer.schema.json` reaches `../contact-details.schema.json` and `../address.schema.json`). And a swap is rarely only a refactor: the beta-2 shapes have genuinely moved on from the fixtures they replace — broker went from a bare object to an `isPresent`/`items[]` wrapper with `contactDetails` nesting — so the endpoints you point at them start documenting a shape the backend may only implement for some events so far. Say so in the PR.

The doc-side Joi fixture is not updated to match. It is deprecated, and it drifts from here on; the synced schema is what readers are being sent to.

## Why a copy rather than a `$ref` to GitHub

`raw.githubusercontent.com` would work on paper: both repos are public and raw sends `access-control-allow-origin: *`. Committing the files instead keeps `mkdocs serve`, a fresh clone, and the published site all rendering with no build-time or view-time network dependency, and no reliance on another host staying up.

## Why these files declare no `$id`

A schema file here carries no `$id`, and that is deliberate upstream rather than an omission. The backend's loader registers each schema under its path relative to `src/schemas/` and ajv treats that key as the base URI, so the path is the identity instead of being restated inside the file. Keeping `$id` out is also what makes these files correct when served from anywhere else, this site included: a resolver falls back to the retrieval URL for the base URI, and every relative `$ref` beneath a schema — `producer-household.schema.json` and the rest — resolves against the folder the file was actually fetched from.

This was not always so. The first version of this mirror carried path-relative `$id`s (`"beta-2/common/producer/producer.schema.json"`), which a spec-compliant resolver appends to the retrieval URL, deriving a base URI with the path in it twice and 404ing every nested `$ref`. Swagger UI ignores `$id` and so rendered the spec page correctly throughout, which is why it was not visible here. Upstream removed them; a sync brought that across, and `test/api/openapi-dialect.test.js` now asserts none come back.

## Conventions

The schema conventions — file layout, path-as-identity, variant composition, the tests that sit beside each file — are documented upstream in [`waste-movement-backend`'s `src/schemas/README.md`](https://github.com/DEFRA/waste-movement-backend/blob/main/src/schemas/README.md). The schemas are tested there, beside the schema files; they are not re-tested in this repo.
