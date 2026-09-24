---
search:
  exclude: true
robots: noindex, nofollow
---

# Schemas

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

Every `*.schema.json` file in this folder is copied verbatim from [`waste-movement-backend`](https://github.com/DEFRA/waste-movement-backend)'s `src/schemas/`, preserving that folder's layout. This README is the one file here that the sync does not touch.

Both API versions are mirrored, each keeping its version prefix:

```
beta-1/                             # the live Receipt of Waste endpoints
  create-movement.schema.json
  record-receipt.schema.json
  …
beta-2/                             # the Phase 2 event model
  common/
    address.schema.json
    contact-details.schema.json
    producer/
      producer.schema.json          # the choice: household, commercial or municipal
      producer-base.schema.json     # the fields all three share
      producer-household.schema.json
      producer-commercial.schema.json
      producer-municipal.schema.json
  creation/
    create-movement.schema.json
```

The version prefix is not decoration: each file's path from this folder matches its own `$id` (`"beta-2/common/producer/producer.schema.json"`), which is the relationship the backend's loader asserts. Every `$ref` between these files is relative and stays within its version, so the tree resolves standalone. A future `beta-3` is picked up by the sync with no change to the script.

## Do not edit anything in this folder

Changes made here are silently overwritten by the next sync. A change to a rule — in either version — is a PR against `waste-movement-backend`; once it is on `main`, it arrives here by running:

```bash
npm run schemas:sync
```

Commit the result with the upstream SHA the script prints, e.g. `chore: sync schemas from waste-movement-backend@<sha>`.

## The backend is the source of truth

These files are what the running service validates against. The beta-2 files may look different from the hand-maintained copies this folder replaced (the former `docs/event-model/schema/`, singular, now deleted) — a field renamed, a rule tightened, a structure reshaped. **That is expected, and is not drift to reconcile here.** If a difference looks wrong, the conversation belongs in `waste-movement-backend`.

The snapshot always tracks latest `main`; there is no pinned SHA. Git holds the provenance — the committed diffs of this folder are its history. The `Schemas / schemas:sync` workflow re-runs the sync on every PR (and on demand), and fails visibly — but non-blocking — when this snapshot no longer matches upstream. There is no scheduled run, so a backend-side change lands here when the next PR opens rather than the moment it is merged.

## Why a copy rather than a `$ref` to GitHub

`raw.githubusercontent.com` would work on paper: both repos are public and raw sends `access-control-allow-origin: *`. Committing the files instead keeps `mkdocs serve`, a fresh clone, and the published site all rendering with no build-time or view-time network dependency, and no reliance on another host staying up.

## Why these files declare no `$id`

A schema file here carries no `$id`, and that is deliberate upstream rather than an omission. The backend's loader registers each schema under its path relative to `src/schemas/` and ajv treats that key as the base URI, so the path is the identity instead of being restated inside the file. Keeping `$id` out is also what makes these files correct when served from anywhere else, this site included: a resolver falls back to the retrieval URL for the base URI, and every relative `$ref` beneath a schema — `producer-household.schema.json` and the rest — resolves against the folder the file was actually fetched from.

This was not always so. The first version of this mirror carried path-relative `$id`s (`"beta-2/common/producer/producer.schema.json"`), which a spec-compliant resolver appends to the retrieval URL, deriving a base URI with the path in it twice and 404ing every nested `$ref`. Swagger UI ignores `$id` and so rendered the spec page correctly throughout, which is why it was not visible here. Upstream removed them; a sync brought that across, and `test/api/openapi-dialect.test.js` now asserts none come back.

## Conventions

The schema conventions — file layout, path-as-identity, variant composition, the tests that sit beside each file — are documented upstream in [`waste-movement-backend`'s `src/schemas/README.md`](https://github.com/DEFRA/waste-movement-backend/blob/main/src/schemas/README.md). The schemas are tested there, beside the schema files; they are not re-tested in this repo.
