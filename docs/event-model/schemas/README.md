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
beta-1/                             # beta-1: the five journey endpoints, minimal fields
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

The version prefix is not decoration: the backend's loader registers each file under its path from this folder (`beta-2/common/producer/producer.schema.json`), and that path is the schema's identity — the files declare no `$id` (see below). Every `$ref` between these files is relative and stays within its version, so the tree resolves standalone. A future `beta-3` is picked up by the sync with no change to the script.

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

A sync that brings a resource across for the first time is not finished when the files land. The resource may also exist as a hand-written shape in the target spec (`docs/api/openapi.yaml`) and as a Joi draft under `docs/collections/data/`, and both now have a source of truth above them. Producer went through this in [#78](https://github.com/DEFRA/digital-waste-tracking-api-docs/pull/78), Broker or Dealer after it.

**1. Point the target spec at it.** The beta spec itself (`beta-N/openapi.json`) arrives with the sync, already referring to the new files. In the target spec, swap the hand-written shape for a `$ref`, per endpoint rather than per field name; the path is relative to `docs/api/`, e.g. `../event-model/schemas/beta-2/common/producer/producer.schema.json`. Drop any `allOf` + `description` wrapper around the old internal `$ref`: the synced schema carries its own description. Delete a local `#/components/schemas/…` component only once nothing else refers to it.

**2. Retire the Joi draft.** Once the resource has landed, delete its draft from `docs/collections/data/` and remove it from the differences table in that folder's [README](../../collections/data/README.md). If other drafts still compose it, mark it `@deprecated` instead, naming the mirror path — `producerSchema` in `creationJoi.js` is the worked example.

**3. Leave the Phase 1 endpoints alone.** `POST /movements/receive` and `PUT /movements/{wasteTrackingId}/receive` are live and unchanged, and the target spec does not repeat their bodies — it points at the live [Receipt of Waste API reference](https://defra.github.io/waste-tracking-service/production/apiSpecifications/) through `legacyReceiptRequest`. Nothing synced here should be wired into them.

**4. Check the references.** `npm run specs:bundle` resolves every `$ref` in the synced beta specs and validates them against OpenAPI 3.1, and `test/api/openapi-dialect.test.js` checks the synced schemas' 2020-12 dialect and that no `$id` has come back. The target spec `openapi.yaml` is neither bundled nor tested, so a new external `$ref` in it is worth walking by hand, including the nested hops (`broker-or-dealer.schema.json` reaches `../contact-details.schema.json` and `../address.schema.json`).

A swap is rarely only a refactor: the beta-2 shapes have often moved on from the drafts they replace — broker went from a bare object to an `isPresent`/`items[]` wrapper with `contactDetails` nesting — so say in the PR what the target spec now documents.

## Why a copy rather than a `$ref` to GitHub

`raw.githubusercontent.com` would work on paper: both repos are public and raw sends `access-control-allow-origin: *`. Committing the files instead keeps `mkdocs serve`, a fresh clone, and the published site all rendering with no build-time or view-time network dependency, and no reliance on another host staying up.

## Why these files declare no `$id`

A schema file here carries no `$id`, and that is deliberate upstream rather than an omission. The backend's loader registers each schema under its path relative to `src/schemas/` and ajv treats that key as the base URI, so the path is the identity instead of being restated inside the file. Keeping `$id` out is also what makes these files correct when served from anywhere else, this site included: a resolver falls back to the retrieval URL for the base URI, and every relative `$ref` beneath a schema — `producer-household.schema.json` and the rest — resolves against the folder the file was actually fetched from.

This was not always so. The first version of this mirror carried path-relative `$id`s (`"beta-2/common/producer/producer.schema.json"`), which a spec-compliant resolver appends to the retrieval URL, deriving a base URI with the path in it twice and 404ing every nested `$ref`. Swagger UI ignores `$id` and so rendered the spec page correctly throughout, which is why it was not visible here. Upstream removed them; a sync brought that across, and `test/api/openapi-dialect.test.js` now asserts none come back.

## Conventions

The schema conventions — file layout, path-as-identity, variant composition, the tests that sit beside each file — are documented upstream in [`waste-movement-backend`'s `src/schemas/README.md`](https://github.com/DEFRA/waste-movement-backend/blob/main/src/schemas/README.md). The schemas are tested there, beside the schema files; they are not re-tested in this repo.
