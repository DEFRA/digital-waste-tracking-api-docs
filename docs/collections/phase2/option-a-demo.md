---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# Trying Option A locally

## What this is

A walkthrough for pulling down the DWTC-129 spike prototype (Option A — pre-reserved Delivery IDs, [D-028](../decisions.md#d-028)) and exercising it locally. For the design itself and what the spike found, see [option-a-pre-reserved-delivery-IDs.md](option-a-pre-reserved-delivery-IDs.md) — that document is now the outcome record; this one is just "how do I run it."

Nothing here is merged to `main` or intended to be. These are prototype branches to poke at, not production-track work.

## Branches

| Repo | Branch |
| --- | --- |
| `waste-movement-backend` | `feat/DWTC-129-option-a-pre-reserved-delivery-ids` |
| `waste-movement-external-api` | `feat/DWTC-129-option-a-pre-reserved-delivery-ids` |

```
git checkout feat/DWTC-129-option-a-pre-reserved-delivery-ids
```
in each repo. The commit messages on each branch summarise what changed and point back to the outcome doc.

## A known local-only blocker you'll hit

`waste-movement-backend/src/config.js` unconditionally overwrites `services.wasteTracking` with a templated CDP hostname (`https://waste-tracking-id-backend.${ENVIRONMENT}.cdp-int.defra.cloud`) *after* convict has already read `WASTE_TRACKING_SERVICE_URL` from the environment. With `ENVIRONMENT=local` (what `compose.yml` sets), this silently discards the docker-compose value and points at a hostname that doesn't resolve — which blocks ID minting (`GET /next`) entirely, so nothing in this demo works until it's patched.

This is a **pre-existing bug, unrelated to Option A** — it isn't part of either feature branch, and hits anyone doing local dev regardless of this spike. Patch it locally, uncommitted, before starting:

```js
// src/config.js — around the overrideConfig block near the bottom
const overrideConfig = {
  services: {
    wasteTracking:
      config.get('cdpEnvironment') === 'local'
        ? config.get('services.wasteTracking')
        : `https://waste-tracking-id-backend.${config.get('cdpEnvironment')}.cdp-int.defra.cloud`
  }
}
```

Worth raising with the team separately as a standalone fix — it isn't specific to this prototype.

## Bringing the stack up

From `waste-movement-backend`:

```
docker compose up -d waste-movement-backend waste-tracking-id-backend
```

This starts `mongodb` as a dependency automatically. You don't need `waste-organisation-backend`, `localstack` or `zap` for this demo.

Confirm it's up:

```
curl http://localhost:3002/health
```

## Two ways to test it

### Option 1 — straight against the backend (simplest, recommended)

Call `waste-movement-backend` directly on `http://localhost:3002/beta-1`, no JWT needed — it authenticates with Basic Auth.

- **Auth**: Basic, using one of your own `ACCESS_CRED_*` entries from `waste-movement-backend/.env`. Each is base64 of `username=password` (e.g. `echo <value> | base64 -d`); use the decoded username as the Basic Auth username and the decoded password as the Basic Auth password.
- **`apiCode`**: decode your own `ORG_API_CODES` from the same `.env` the same way — it's `apiCode=orgId` pairs.

This is what the spike itself was tested against, and is enough to see the whole lifecycle.

### Option 2 — through external-api with a real JWT (the full chain)

Only worth it if you specifically want to exercise the thin-proxy layer. You'll need:

1. A local build of `waste-movement-external-api` from the feature branch — the running `defradigital/waste-movement-external-api:latest` image in `compose.yml` predates this branch and has never heard of these routes. Point `compose.yml`'s `waste-tracking-external-api` service at a local build (`build: context: ../waste-movement-external-api`) instead of the pulled image, or run it separately with `npm run dev`.
2. `API_VERSIONS_ENABLED=beta-1` set on that service — the whole `beta-1` route group is feature-flagged off otherwise (`src/plugins/router.js`).
3. A dev Cognito JWT — there's no local auth bypass. Follow `waste-movement-external-api/JWT_AUTHENTICATION_TESTING.md` for the CDP Portal flow to get one.

## The demo script

Run these against whichever base URL you chose above (`/beta-1` prefix either way).

**1. Reserve a batch**
```
POST /deliveries/reserve
Headers: Idempotency-Key: <any-fresh-string>
Body: { "apiCode": "<your-apiCode>", "count": 3 }
```
→ `201`, a `reservations[]` array of `{ deliveryId, expiresAt }`. Pick one `deliveryId` for the rest of the script.

**2. Check validity — expect `reserved`**
```
GET /deliveries/{deliveryId}/validity
```
→ `{ "known": true, "state": "reserved", "acceptable": true }`

**3. Receipt against it before any delivery exists — the interesting bit**
```
POST /deliveries/{deliveryId}/receipt
Body: { "apiCode": "<your-apiCode>" }
```
→ `202`, not `404` — creates the `awaiting_delivery` shell. This is the "receipt arrives before delivery" case Option A is built around.

**4. Validity again — expect `awaiting_delivery`**

**5. Submit the delivery.** First mint a `movementId`:
```
POST /movements
Body: { "apiCode": "<your-apiCode>" }
```
Then:
```
POST /deliveries
Body: {
  "apiCode": "<your-apiCode>",
  "movementIds": ["<movementId>"],
  "deliveryId": "<reservedDeliveryId>"
}
```
→ `201`. Reservation flips to `used`, delivery to `complete`.

**6. Validity again — expect `complete`**

**7. Resubmit step 5 identically** → `200` (idempotent replay, nothing new written).

**8. Resubmit step 5 with different `movementIds`** → `409 ALREADY_USED`.

**9. Wrong-org submission** — same `deliveryId`, an `apiCode` mapped to a different `orgId` → `404`, indistinguishable from an unknown ID by design (see "Ownership and verification" in the outcome doc).

**10. Reuse the `Idempotency-Key` from step 1 with the same `count`** → `200`, returns the original batch, mints nothing new. With a different `count` → `409 IDEMPOTENCY_CONFLICT`.

## Checking state directly

Mongo Compass against `mongodb://127.0.0.1:27017/waste-movement-backend?directConnection=true` — collections `deliveries` and `id-reservations` — is the fastest way to see what a call actually wrote, if a response looks off.

## Prototype simplifications — don't read too much into these

The outcome doc's "Risks, prerequisites and open decisions" section is the authoritative list, but the two that most affect what you'll observe locally:

- **The outstanding-reservation cap is a flat 50 per org**, not the design's self-scaling formula — there's no real volume data yet to derive it from.
- **Duplicate-submission handling is an application-level find-before-insert**, not the unique `deliveries.deliveryId` index the design calls a blocking prerequisite for real use. A single-operator manual demo has no concurrency to expose the gap this leaves, but it's real and must land before this goes anywhere near production.
